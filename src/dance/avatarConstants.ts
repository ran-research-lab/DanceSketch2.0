import { AVATAR_DOC } from "./avatarDoc"

// Converts a display name into a constant-safe key.
// Example: "HipHop1" -> "HIPHOP1"
function toAvatarConstantKey(displayName: string): string {
    return displayName.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()
}

// Maps CONSTANT_NAME -> displayName used at runtime.
// Example: { MICHELL: "Michell", NINJA: "Ninja" }
export const AVATAR_CONSTANTS = Object.freeze(
    Object.fromEntries(
        AVATAR_DOC.map((avatar) => [
            toAvatarConstantKey(avatar.displayName),
            avatar.displayName,
        ])
    ) as Record<string, string>
)

export type AvatarConstantName = keyof typeof AVATAR_CONSTANTS
export type AvatarConstantValue = (typeof AVATAR_CONSTANTS)[AvatarConstantName]

// Returns the constant name for a given display name, if it exists.
export function getAvatarConstantNameForDisplayName(displayName: string): string | undefined {
    const key = toAvatarConstantKey(displayName)

    return Object.prototype.hasOwnProperty.call(AVATAR_CONSTANTS, key)? key: undefined
}

