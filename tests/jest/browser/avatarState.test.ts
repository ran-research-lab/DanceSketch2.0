import reducer, { setSearchText, selectSearchText, selectFilteredEntries } from "../../../src/browser/avatarState"

// Mock AVATAR_DOC which selectFilteredEntries uses
jest.mock("../../../src/dance/avatarDoc", () => ({
    AVATAR_DOC: [
        { name: "Michell.fbx", displayName: "Michell" },
        { name: "Ninja.fbx", displayName: "Ninja" },
    ]
}))

describe("avatarState Redux Slice", () => {
    describe("reducers", () => {
        it("should return the initial state", () => {
            expect(reducer(undefined, { type: "unknown" })).toEqual({
                searchText: "",
            })
        })

        it("should handle setSearchText", () => {
            const actual = reducer({ searchText: "" }, setSearchText("michell"))
            expect(actual.searchText).toEqual("michell")
        })
    })

    describe("selectors", () => {
        let mockState: any

        beforeEach(() => {
            mockState = {
                avatar: {
                    searchText: "michell",
                },
                app: {
                    scriptLanguage: "python",
                    localeCode: "en"
                }
            }
        })

        it("selectSearchText should retrieve correct string", () => {
            expect(selectSearchText(mockState)).toEqual("michell")
        })

        it("selectFilteredEntries should filter correctly based on name and displayName ignores casing", () => {
            const entries = selectFilteredEntries(mockState)
            expect(entries).toHaveLength(1)
            expect(entries[0].displayName).toEqual("Michell")
        })

        it("selectFilteredEntries should handle empty search text returning all", () => {
            mockState.avatar.searchText = ""
            const entries = selectFilteredEntries(mockState)
            expect(entries).toHaveLength(2) // all entries
        })
    })
})
