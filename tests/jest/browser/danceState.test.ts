import reducer, { setSearchText, selectSearchText, selectFilteredEntries } from "../../../src/browser/danceState"

// Mock DANCE_DOC which selectFilteredEntries uses
jest.mock("../../../src/dance/danceDoc", () => ({
    DANCE_DOC: [
        { name: "HipHop1.fbx", displayName: "HipHop1", bodyPart: "upper" },
        { name: "HipHop2.fbx", displayName: "HipHop2", bodyPart: "upper" },
        { name: "Salsa1.fbx", displayName: "Salsa1", bodyPart: "upper" },
    ]
}))

describe("danceState Redux Slice", () => {
    describe("reducers", () => {
        it("should return the initial state", () => {
            expect(reducer(undefined, { type: "unknown" })).toEqual({
                searchText: "",
            })
        })

        it("should handle setSearchText", () => {
            const actual = reducer({ searchText: "" }, setSearchText("salsa"))
            expect(actual.searchText).toEqual("salsa")
        })
    })

    describe("selectors", () => {
        let mockState: any

        beforeEach(() => {
            mockState = {
                dance: {
                    searchText: "hiphop",
                },
                app: {
                    scriptLanguage: "python",
                    localeCode: "en"
                }
            }
        })

        it("selectSearchText should retrieve correct string", () => {
            expect(selectSearchText(mockState)).toEqual("hiphop")
        })

        it("selectFilteredEntries should filter correctly based on name and displayName ignores casing", () => {
            const entries = selectFilteredEntries(mockState)
            expect(entries).toHaveLength(2)
            expect(entries.map((e: any) => e.displayName)).toEqual(["HipHop1", "HipHop2"])
        })

        it("selectFilteredEntries should handle empty search text returning all", () => {
            mockState.dance.searchText = ""
            const entries = selectFilteredEntries(mockState)
            expect(entries).toHaveLength(3) // all entries
        })
    })
})
