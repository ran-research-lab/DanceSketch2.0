import { AVATAR_CONSTANTS, getAvatarConstantNameForDisplayName } from "../../../src/dance/avatarConstants"
import { AVATAR_DOC } from "../../../src/dance/avatarDoc"

describe("avatarConstants", () => {
    describe("AVATAR_CONSTANTS", () => {
        it("should map to Avatar display names correctly", () => {
            // Verify our map has correct sizes based on the AVATAR_DOC length
            const keysLength = Object.keys(AVATAR_CONSTANTS).length
            expect(keysLength).toBe(AVATAR_DOC.length)

            // Verify explicit expected mappings are correct
            expect(AVATAR_CONSTANTS.MICHELL).toBe("Michell")
            expect(AVATAR_CONSTANTS.NINJA).toBe("Ninja")
        })

        it("should have frozen constants object", () => {
            expect(Object.isFrozen(AVATAR_CONSTANTS)).toBe(true)
        })
    })

    describe("getAvatarConstantNameForDisplayName", () => {
        it("should return the correct constant name given a valid display name", () => {
            expect(getAvatarConstantNameForDisplayName("Michell")).toBe("MICHELL")
            expect(getAvatarConstantNameForDisplayName("Ninja")).toBe("NINJA")
        })

        it("should return undefined given an invalid display name", () => {
            expect(getAvatarConstantNameForDisplayName("InvalidAvatarName")).toBeUndefined()
            expect(getAvatarConstantNameForDisplayName("")).toBeUndefined()
        })
    })
})
