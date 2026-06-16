declare module "three" {
    export const SRGBColorSpace: any
    export const LoopRepeat: any

    export class Color { constructor(value?: any) }
    export class Clock { getDelta(): number }
    export class Scene {
        background: any
        add(...objects: any[]): void
        remove(...objects: any[]): void
    }
    export class PerspectiveCamera {
        aspect: number
        position: any
        constructor(fov?: number, aspect?: number, near?: number, far?: number)
        lookAt(...args: any[]): void
        updateProjectionMatrix(): void
    }
    export class WebGLRenderer {
        domElement: HTMLCanvasElement
        outputColorSpace: any
        constructor(parameters?: any)
        setSize(width: number, height: number): void
        setPixelRatio(ratio: number): void
        render(scene: Scene, camera: PerspectiveCamera): void
        dispose(): void
    }
    export class Object3D {
        scale: any
        position: any
        rotation: any
        traverse(callback: (child: any) => void): void
    }
    export class Mesh extends Object3D {
        castShadow: boolean
        receiveShadow: boolean
    }
    export class AmbientLight extends Object3D { constructor(color?: any, intensity?: number) }
    export class DirectionalLight extends Object3D { constructor(color?: any, intensity?: number) }
    export class AnimationClip {
        name: string
        duration: number
        tracks: any[]
        constructor(name: string, duration: number, tracks: any[])
    }
    export class AnimationAction {
        clampWhenFinished: boolean
        enabled: boolean
        reset(): this
        play(): this
        stop(): this
        setLoop(mode: any, repetitions: number): this
        fadeIn(duration: number): this
        fadeOut(duration: number): this
    }
    export class AnimationMixer {
        timeScale: number
        constructor(root: Object3D)
        clipAction(clip: AnimationClip): AnimationAction
        stopAllAction(): void
        update(delta: number): void
        uncacheRoot(root: Object3D): void
    }
}

declare module "three/examples/jsm/loaders/FBXLoader.js" {
    import { Object3D, AnimationClip } from "three"

    export class FBXLoader {
        load(
            url: string,
            onLoad: (fbx: Object3D & { animations: AnimationClip[] }) => void,
            onProgress?: ((event: ProgressEvent) => void) | undefined,
            onError?: ((error: unknown) => void) | undefined,
        ): void
    }
}
