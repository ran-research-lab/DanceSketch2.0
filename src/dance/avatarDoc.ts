export interface Avatars {
    name: string          // e.g. "Avatar.fbx"
    displayName: string   // what you show in the UI, e.g. "AVATAR"
    
}

export const AVATAR_DOC: readonly Avatars[] = [
    {
        name: "Michell.fbx",
        displayName: "Michell",
    },
    {
        name: "Ninja.fbx",
        displayName: "Ninja",
    },
]