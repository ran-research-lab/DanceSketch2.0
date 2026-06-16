import { DANCE_MOVE_CONSTANTS, getDanceMoveConstantNameForDisplayName } from "../../../src/dance/danceConstants"
import { DANCE_DOC } from "../../../src/dance/danceDoc"

describe("danceConstants", () => {
    describe("DANCE_MOVE_CONSTANTS", () => {
        it("should map to Dance Move display names correctly based on DANCE_DOC", () => {
            const keysLength = Object.keys(DANCE_MOVE_CONSTANTS).length
            expect(keysLength).toBe(DANCE_DOC.length)

            expect(DANCE_MOVE_CONSTANTS.HIPHOP1).toBe("HipHop1")
            expect(DANCE_MOVE_CONSTANTS.SALSA1).toBe("Salsa1")
        })

        it("should have frozen constants object", () => {
            expect(Object.isFrozen(DANCE_MOVE_CONSTANTS)).toBe(true)
        })
    })

    describe("getDanceMoveConstantNameForDisplayName", () => {
        it("should return the correct constant name given a valid display name", () => {
            expect(getDanceMoveConstantNameForDisplayName("HipHop1")).toBe("HIPHOP1")
            expect(getDanceMoveConstantNameForDisplayName("Salsa1")).toBe("SALSA1")
        })

        it("should return undefined given an invalid display name", () => {
            expect(getDanceMoveConstantNameForDisplayName("FakeMove")).toBeUndefined()
            expect(getDanceMoveConstantNameForDisplayName("")).toBeUndefined()
        })
    })
})
