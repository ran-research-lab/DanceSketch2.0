import { DANCE_DOC } from "./danceDoc"

// Converts a display name into a constant-safe key.
// Example: "HipHop1" -> "HIPHOP1"
function toDanceMoveConstantKey(displayName: string): string {
    return displayName.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()
}

// Map CONSTANT_NAME -> displayName string used at runtime (e.g. "HipHop1").
export const DANCE_MOVE_CONSTANTS = Object.freeze(
    Object.fromEntries(
        DANCE_DOC.map((m) => [toDanceMoveConstantKey(m.displayName), m.displayName])
    ) as Record<string, string>
)

export type DanceMoveConstantName = keyof typeof DANCE_MOVE_CONSTANTS
export type DanceMoveConstantValue = (typeof DANCE_MOVE_CONSTANTS)[DanceMoveConstantName]

// Returns the constant name for a given display name, if it exists.
export function getDanceMoveConstantNameForDisplayName(displayName: string): string | undefined {
    const key = toDanceMoveConstantKey(displayName)
    return Object.prototype.hasOwnProperty.call(DANCE_MOVE_CONSTANTS, key) ? key : undefined
}
