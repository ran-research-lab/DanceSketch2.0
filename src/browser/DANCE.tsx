import { useEffect, useRef, useState, ChangeEvent } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useTranslation } from "react-i18next"

import { BrowserTabType } from "./BrowserTab"
import * as dance from "./danceState"

import { SearchBar } from "./Utils"
import * as editor from "../ide/Editor"
import * as tabs from "../ide/tabState"
import * as cai from "../cai/caiState"
import { addUIClick } from "../cai/dialogue/student"
import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import * as daw from "../daw/dawState"

import type { DanceMove } from "../dance/danceDoc"
import { getDanceMoveConstantNameForDisplayName } from "../dance/danceConstants"

const ASSET_BASE_URL = import.meta.env.BASE_URL

type DANCEItem = DanceMove

// Inserts the dance move constant (or fallback string) into the code editor.
const paste = (name: string) => {
    const constantName = getDanceMoveConstantNameForDisplayName(name)
    editor.pasteCode(constantName ?? `"${name}"`)
}


const AnimationPreview = ({ name }: { name: string }) => {
    const AVATAR_FBX_NAME = "Michell.fbx"

    function avatarFbxUrl(fileName: string): string {
        const base = fileName.endsWith(".fbx") ? fileName : `${fileName}.fbx`
        return `${ASSET_BASE_URL}MixamoAnimations/Avatars/${base}`
    }

    function danceFbxUrl(fileName: string): string {
        const base = fileName.endsWith(".fbx") ? fileName : `${fileName}.fbx`
        return `${ASSET_BASE_URL}MixamoAnimations/${base}`
    }

    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const clockRef = useRef(new THREE.Clock())

    const avatar = useSelector(daw.selectAvatar)
    const avatarFbxName = avatar?.fbxName || AVATAR_FBX_NAME

    const avatarRef = useRef<THREE.Object3D | null>(null)
    const [avatarReady, setAvatarReady] = useState(false)

    const animFrameRef = useRef<number>(0)
    const currentActionRef = useRef<THREE.AnimationAction | null>(null)
    const clipCacheRef = useRef<Record<string, THREE.AnimationClip | null>>({})
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Reset readiness when avatar changes.
        setAvatarReady(false)

        // Set up Three.js scene, camera, renderer, and lights.
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xB8E8F5)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
        camera.position.set(0, 1.2, 2.8)
        camera.lookAt(0, 1, 0)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(200, 300)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const ambient = new THREE.AmbientLight(0xffffff, 4)
        scene.add(ambient)

        const dir = new THREE.DirectionalLight(0xffffff, 0.8)
        dir.position.set(2, 5, 3)
        scene.add(dir)

        // Load the selected avatar model used to preview the dance move.
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

                const scale = 0.01
                fbx.scale.setScalar(scale)
                fbx.position.set(0, 0, 0)

                scene.add(fbx)
                avatarRef.current = fbx

                const mixer = new THREE.AnimationMixer(fbx)
                mixerRef.current = mixer
                setAvatarReady(true)
            },
            undefined,
            (err) => {
                console.error("FBX avatar load error:", err)
            }
        )

        // Main render loop.
        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate)
            const delta = clockRef.current.getDelta()
            if (mixerRef.current) mixerRef.current.update(delta)
            renderer.render(scene, camera)
        }
        animate()

        // Cleanup on unmount or avatar change.
        return () => {
            cancelAnimationFrame(animFrameRef.current)

            if (rendererRef.current) {
                rendererRef.current.dispose()
                const parent = rendererRef.current.domElement.parentNode
                if (parent) parent.removeChild(rendererRef.current.domElement)
            }

            rendererRef.current = null
            sceneRef.current = null
            cameraRef.current = null
            mixerRef.current = null
            currentActionRef.current = null
            avatarRef.current = null
            clipCacheRef.current = {}
        }
    }, [avatarFbxName])

    useEffect(() => {
        if (!avatarReady || !mixerRef.current) return

        const mixer = mixerRef.current
        const url = danceFbxUrl(name)

        // Reuse cached animation clip if already loaded.
        if (Object.prototype.hasOwnProperty.call(clipCacheRef.current, url)) {
            const cachedClip = clipCacheRef.current[url]
            if (cachedClip) {
                if (currentActionRef.current) currentActionRef.current.stop()

                const action = mixer.clipAction(cachedClip)
                action.reset()
                action.setLoop(THREE.LoopRepeat, Infinity)
                action.play()
                currentActionRef.current = action
            }
            return
        }

        // Load and play the selected dance move animation.
        const loader = new FBXLoader()
        loader.load(
            url,
            (fbx) => {
                const clip = fbx.animations[0]
                clipCacheRef.current[url] = clip || null

                if (clip && mixerRef.current) {
                    if (currentActionRef.current) currentActionRef.current.stop()

                    const action = mixerRef.current.clipAction(clip)
                    action.reset()
                    action.setLoop(THREE.LoopRepeat, Infinity)
                    action.play()
                    currentActionRef.current = action
                }
            },
            undefined,
            (err) => {
                console.error("FBX animation load error:", err)
                clipCacheRef.current[url] = null
            }
        )
    }, [name, avatarReady])

    return (
        <div
            ref={containerRef}
            className="mt-3 rounded-lg overflow-hidden shadow-lg border border-gray-700"
            style={{ width: 200, height: 300 }}
            aria-label="Dance animation preview"
        />
    )
}

// Renders one dance move entry row in the browser list.
const Entry = ({ name, obj: _obj }: { name: string, obj: DANCEItem }) => {
    const { t } = useTranslation()
    const tabsOpen = !!useSelector(tabs.selectOpenTabs).length

    // Local UI state instead of mutating obj.details.
    const [detailsOpen, setDetailsOpen] = useState(false)

    const toggleDetails = () => {
        setDetailsOpen((prev) => !prev)
        addUIClick("api read - " + name)
    }

    return (
        <div className="p-3 border-b border-r border-black border-gray-500 dark:border-gray-700">
            <div className="flex justify-between mb-2">
                <span
                    className="font-bold cursor-pointer truncate"
                    onClick={toggleDetails}
                >
                    {name}
                </span>

                <div className="flex">
                    <button
                        className={`hover:bg-gray-200 active:bg-gray-300 h-full pt-1 mr-2 text-xs rounded-full px-2.5 border border-gray-600 ${tabsOpen ? "" : "hidden"}`}
                        onClick={() => {
                            paste(name)
                            addUIClick("api copy - " + name)
                        }}
                        title={t("api:pasteToCodeEditor", { name })}
                        aria-label={t("api:pasteToCodeEditor", { name })}
                    >
                        <i className="icon icon-paste2" />
                    </button>

                    <button
                        className="hover:bg-gray-200 active:bg-gray-300 h-full text-sm rounded-full pl-1.5 border border-gray-600 whitespace-nowrap"
                        onClick={toggleDetails}
                        title={
                            detailsOpen
                                ? t("ariaDescriptors:api.closeFunctionDetails", { functionName: name })
                                : t("ariaDescriptors:api.openFunctionDetails", { functionName: name })
                        }
                        aria-label={
                            detailsOpen
                                ? t("ariaDescriptors:api.closeFunctionDetails", { functionName: name })
                                : t("ariaDescriptors:api.openFunctionDetails", { functionName: name })
                        }
                    >
                        <div className="inline-block w-10">
                            {detailsOpen ? t("api:close") : t("api:open")}
                        </div>
                        <i
                            className={`inline-block align-middle mb-px mx-1 icon icon-${
                                detailsOpen ? "arrow-down" : "arrow-right"
                            }`}
                        />
                    </button>
                </div>
            </div>

            {detailsOpen && (
                <>
                    <AnimationPreview name={name} />
                </>
            )}
        </div>
    )
}

const EntryList = () => {
    const moves = useSelector(dance.selectFilteredEntries)

    return (
        <>
            {moves.map((move, index) => (
                <Entry key={move.name + index} name={move.displayName} obj={move} />
            ))}
        </>
    )
}

// Search bar for filtering dance moves.
const APISearchBar = () => {
    const dispatch = useDispatch()
    const searchText = useSelector(dance.selectSearchText)
    const caiHighlight = useSelector(cai.selectHighlight)

    const dispatchSearch = (event: ChangeEvent<HTMLInputElement>) =>
        dispatch(dance.setSearchText(event.target.value))

    const dispatchReset = () => dispatch(dance.setSearchText(""))

    const props = {
        searchText,
        dispatchSearch,
        dispatchReset,
        id: "apiSearchBar",
        highlight: caiHighlight.zone === "apiSearchBar",
    }

    return <SearchBar {...props} />
}

// Main DANCE browser tab UI.
export const DANCEBrowser = () => {
    return (
        <>
            <div className="grow-0 pb-3">
                <APISearchBar />
            </div>

            <div
                className="flex-auto overflow-y-scroll overflow-x-none"
                role="tabpanel"
                id={"panel-" + BrowserTabType.DANCE}
            >
                <EntryList />
            </div>
        </>
    )
}