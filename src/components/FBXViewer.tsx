// Nesesary Imports
import React, { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import * as daw from "../daw/dawState"
import * as player from "../audio/player"
import { useScreenSize } from "./useScreenSize"

const ASSET_BASE_URL = import.meta.env.BASE_URL

//construct path for nesesary animation and avatar
const FBX_BASE = `${ASSET_BASE_URL}MixamoAnimations`
const AVATAR_FBX_NAME = "Avatar.fbx"

function fbxUrl(name: string): string {
    const base = name.endsWith(".fbx") ? name : `${name}.fbx`
    return `${FBX_BASE}/${base}`
}

function avatarFbxUrl(name: string): string {
    const base = name.endsWith(".fbx") ? name : `${name}.fbx`
    return `${FBX_BASE}/Avatars/${base}`
}

// Bone cathegory to divide upper and lower body
type BoneCategory = "head" | "spine" | "upper" | "lower" | "other"

const FBXViewer: React.FC = () => {
    const dispatch = useDispatch()
    const tasks = useSelector(daw.selectFbxDanceTasks)
    const playing = useSelector(daw.selectPlaying)
    const avatar = useSelector(daw.selectAvatar)
    const tempoMap = useSelector(daw.selectTempoMap)

    const avatarFbxName = avatar?.fbxName || AVATAR_FBX_NAME
    const { width } = useScreenSize()

    const [position, setPosition] = useState(0)
    const [avatarReady, setAvatarReady] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const clockRef = useRef(new THREE.Clock())

    const avatarRef = useRef<THREE.Object3D | null>(null)
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)
    const currentActionRef = useRef<THREE.AnimationAction | null>(null)

    const clipCacheRef = useRef<Record<string, THREE.AnimationClip | null>>({})
    const hybridClipCacheRef = useRef<Record<string, THREE.AnimationClip | null>>({})
    const animFrameRef = useRef<number>(0)

    const currentTempo = React.useMemo(() => {
        return tempoMap.getTempoAtTime(position)
    }, [tempoMap, position])

    // categorize bone on avatar squeleton
    const categorizeBone = (boneName: string): BoneCategory => {
        const name = boneName.toLowerCase()

        if (name.includes("head") || name.includes("neck")) return "head"
        if (name.includes("spine") || name.includes("chest")) return "spine"

        if (
            name.includes("shoulder") ||
            name.includes("arm") ||
            name.includes("hand") ||
            name.includes("finger") ||
            name.includes("thumb") ||
            name.includes("index") ||
            name.includes("middle") ||
            name.includes("ring") ||
            name.includes("pinky")
        ) {
            return "upper"
        }

        if (
            name.includes("hip") ||
            name.includes("leg") ||
            name.includes("foot") ||
            name.includes("toe")
        ) {
            return "lower"
        }

        return "other"
    }

    // Separate upper body and lower body
    const isUpperBodyBone = (boneName: string): boolean => {
        const category = categorizeBone(boneName)
        return category === "head" || category === "spine" || category === "upper"
    }

    const isLowerBodyBone = (boneName: string): boolean => {
        return categorizeBone(boneName) === "lower"
    }

    const getTrackBoneName = (trackName: string): string => {
        return trackName.split(".")[0]
    }

    const isHipBone = (boneName: string): boolean => {
        const name = boneName.toLowerCase()
        return name.includes("hips") || name === "hips"
    }

    const isUpperTrack = (trackName: string): boolean => {
        const boneName = getTrackBoneName(trackName)

        // prevent conflict with lower/root control
        if (isHipBone(boneName)) return false

        return isUpperBodyBone(boneName)
    }

    const isLowerTrack = (trackName: string): boolean => {
        const boneName = getTrackBoneName(trackName)

        // let lower animation control pelvis/root
        if (isHipBone(boneName)) return true

        return isLowerBodyBone(boneName)
    }

    // Build animation clip
    const buildHybridClip = (
        upperClip: THREE.AnimationClip | null,
        lowerClip: THREE.AnimationClip | null,
        upperName: string,
        lowerName: string
    ): THREE.AnimationClip | null => {
        if (!upperClip && !lowerClip) return null

        const upperTracks =
            upperClip?.tracks.filter((track) => isUpperTrack(track.name)) ?? []

        const lowerTracks =
            lowerClip?.tracks.filter((track) => isLowerTrack(track.name)) ?? []

        const tracks = [...lowerTracks, ...upperTracks]

        if (tracks.length === 0) return null

        const duration = Math.max(
            upperClip?.duration ?? 0,
            lowerClip?.duration ?? 0
        )

        return new THREE.AnimationClip(
            `hybrid_${upperName}_${lowerName}`,
            duration,
            tracks
        )
    }

    const loadClip = (fbxName: string): Promise<THREE.AnimationClip | null> => {
        return new Promise((resolve) => {
            const cached = clipCacheRef.current[fbxName]
            if (cached !== undefined) {
                resolve(cached)
                return
            }

            const loader = new FBXLoader()
            loader.load(
                fbxUrl(fbxName),
                (fbx) => {
                    const clip =
                        fbx.animations && fbx.animations.length > 0
                            ? fbx.animations[0]
                            : null

                    clipCacheRef.current[fbxName] = clip
                    resolve(clip)
                },
                undefined,
                (err) => {
                    console.error("FBX animation load error:", err)
                    clipCacheRef.current[fbxName] = null
                    resolve(null)
                }
            )
        })
    }

    // Sync animation speed with song tempo
    useEffect(() => {
        if (!mixerRef.current) return

        const baseTempo = tempoMap.points[0]?.tempo ?? 120
        const tempo = currentTempo || baseTempo

        mixerRef.current.timeScale = tempo / baseTempo
    }, [currentTempo, tempoMap])

    // Poll playback position
    useEffect(() => {
        if (!playing) return

        const interval = setInterval(() => {
            setPosition(player.getPosition())
        }, 80)

        return () => clearInterval(interval)
    }, [playing])

    const activeTask = tasks.find((t) => position >= t.start && position < t.end)

    useEffect(() => {
        if (!activeTask) return

        if (position >= activeTask.end) {
            dispatch(daw.removeFbxDanceTask(activeTask.id))
        }
    }, [activeTask, position, dispatch])

    const shouldShow = !!activeTask && playing
    const upperFbxName = activeTask?.upperMove
    const lowerFbxName = activeTask?.lowerMove
    // Three.js setup
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        setAvatarReady(false)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xB8E8F5)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, 320 / 420, 0.1, 1000)
        camera.position.set(0, 1.2, 2.8)
        camera.lookAt(0, 1, 0)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(320, 420)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const ambient = new THREE.AmbientLight(0xffffff, 4)
        scene.add(ambient)

        const dir = new THREE.DirectionalLight(0xffffff, 0.8)
        dir.position.set(2, 5, 3)
        scene.add(dir)

        const avatarLoader = new FBXLoader()
        avatarLoader.load(
            avatarFbxUrl(avatarFbxName),
            (fbx) => {
                fbx.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true
                        child.receiveShadow = true
                    }
                })

                fbx.scale.setScalar(0.01)
                fbx.position.set(0, 0, 0)

                scene.add(fbx)
                avatarRef.current = fbx

                mixerRef.current = new THREE.AnimationMixer(fbx)
                setAvatarReady(true)
            },
            undefined,
            (err) => {
                console.error("FBX avatar load error:", err)
            }
        )

        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate)

            const delta = clockRef.current.getDelta()
            if (mixerRef.current) {
                mixerRef.current.update(delta)
            }

            renderer.render(scene, camera)
        }

        animate()

        return () => {
            cancelAnimationFrame(animFrameRef.current)

            if (rendererRef.current) {
                rendererRef.current.dispose()
                const parent = rendererRef.current.domElement.parentNode
                if (parent) {
                    parent.removeChild(rendererRef.current.domElement)
                }
            }

            rendererRef.current = null
            sceneRef.current = null
            cameraRef.current = null
            mixerRef.current = null
            currentActionRef.current = null
            avatarRef.current = null
            clipCacheRef.current = {}
            hybridClipCacheRef.current = {}
        }
    }, [avatarFbxName])

    // Play hybrid animation
    useEffect(() => {
        if (!shouldShow || !upperFbxName || !lowerFbxName) {
            if (currentActionRef.current) {
                currentActionRef.current.stop()
                currentActionRef.current = null
            }
            return
        }

        if (!avatarReady || !avatarRef.current || !mixerRef.current) {
            return
        }

        const mixer = mixerRef.current
        const hybridKey = `${upperFbxName}__${lowerFbxName}`
        let cancelled = false

        const applyClip = (clip: THREE.AnimationClip | null) => {
            if (!clip || !mixer) return

            const previousAction = currentActionRef.current
            const nextAction = mixer.clipAction(clip)

            if (previousAction) {
                previousAction.stop()
            }

            nextAction.reset()
            nextAction.setLoop(THREE.LoopRepeat, Infinity)
            nextAction.clampWhenFinished = false
            nextAction.enabled = true
            nextAction.play()

            // if (previousAction && previousAction !== nextAction) {
            //     previousAction.crossFadeTo(nextAction, 0.3, false)
            // }

            currentActionRef.current = nextAction
        }

        const run = async () => {
            const cachedHybrid = hybridClipCacheRef.current[hybridKey]
            if (cachedHybrid !== undefined) {
                applyClip(cachedHybrid)
                return
            }

            const [upperClip, lowerClip] = await Promise.all([
                loadClip(upperFbxName),
                loadClip(lowerFbxName),
            ])

            if (cancelled) return

            const hybridClip = buildHybridClip(
                upperClip,
                lowerClip,
                upperFbxName,
                lowerFbxName
            )

            hybridClipCacheRef.current[hybridKey] = hybridClip
            applyClip(hybridClip)
        }

        run()

        return () => {
            cancelled = true
        }
    }, [shouldShow, upperFbxName, lowerFbxName, avatarReady,activeTask?.id])

    const viewerStyle: React.CSSProperties = {
        width: 320,
        height: 420,
        left: Math.max(16, width - 400),
        bottom: "20%",
    }

    if (!shouldShow) {
        return (
            <div
                ref={containerRef}
                className="fixed z-50 rounded-lg overflow-hidden shadow-lg border border-gray-700"
                style={viewerStyle}
                aria-label="Dance animation (idle)"
            />
        )
    }

    return (
        <div
            ref={containerRef}
            className="fixed z-50 rounded-lg overflow-hidden shadow-lg border border-gray-700"
            style={viewerStyle}
            aria-label={`Dance animation: upper ${upperFbxName}, lower ${lowerFbxName}`}
        />
    )
}

export default FBXViewer