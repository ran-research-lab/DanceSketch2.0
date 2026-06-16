export interface DanceMove {
    name: string          // e.g. "HipHop1.fbx"
    displayName: string   // what you show in the UI, e.g. "HIPHOIP1"
    bodyPart: "upper" | "lower"
}

export const DANCE_DOC: readonly DanceMove[] = [
    {
        name: "HipHop1.fbx",
        displayName: "HipHop1",
        bodyPart: "upper",
    },
    {
        name: "HipHop2.fbx",
        displayName: "HipHop2",
         bodyPart: "upper",
    },
    {
        name: "HipHop3.fbx",
        displayName: "HipHop3",
        bodyPart: "upper",
    },
    {
        name: "HipHop4.fbx",
        displayName: "HipHop4",
        bodyPart: "upper",
    },
    {
        name: "HipHop5.fbx",
        displayName: "HipHop5",
        bodyPart: "upper",
    },
    {
        name: "HipHop6.fbx",
        displayName: "HipHop6",
        bodyPart: "upper",
    },
    {
        name: "HipHop7.fbx",
        displayName: "HipHop7",
        bodyPart: "upper",
    },
    {
        name: "Salsa1.fbx",
        displayName: "Salsa1",
        bodyPart: "upper",
    },
]