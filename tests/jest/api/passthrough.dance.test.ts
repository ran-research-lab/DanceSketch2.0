jest.mock("../../../src/audio/context", () => ({
    default: {},
    context: {},
    OfflineAudioContext: {}
}))
jest.mock("../../../src/app/postRun", () => ({}))
jest.mock("../../../src/app/runner", () => ({}))


import { fitDance, cleanupAllDancers, insertDanceMove, addDanceBlock, setAvatar } from "../../../src/api/passthrough"
import store from "../../../src/reducers"
import * as dawState from "../../../src/daw/dawState"

jest.mock("../../../src/reducers", () => ({
    dispatch: jest.fn(),
    getState: jest.fn(),
}))

jest.mock("../../../src/daw/dawState", () => ({
    addFbxDanceTask: jest.fn(() => ({ type: "ADD_DANCE_TASK" })),
    clearFbxDanceTasks: jest.fn(() => ({ type: "CLEAR_DANCE_TASKS" })),
    SetAvatar: jest.fn(() => ({ type: "SET_AVATAR" })),
}))

jest.mock("../../../src/data/Animations", () => ({
    animations: {
        "HipHop1.fbx": {},
        "HipHop2.fbx": {},
    }
}))

describe("passthrough.dance", () => {
    let mockResult: any

    beforeEach(() => {
        jest.clearAllMocks()
        mockResult = {
            tracks: [
                { clips: [], effects: {}, danceBlocks: [] }
            ],
            length: 0,
            transformedClips: {},
        }
    })

    describe("fitDance", () => {
        it("should dispatch addFbxDanceTask with correct payload", () => {
            fitDance(mockResult, "HipHop1.fbx", "HipHop2.fbx", 1, 5)

            expect(dawState.addFbxDanceTask).toHaveBeenCalledWith({
                upperMove: "HipHop1.fbx",
                lowerMove: "HipHop2.fbx",
                start: 1,
                end: 5
            })
            expect(store.dispatch).toHaveBeenCalled()
        })
    })

    describe("cleanupAllDancers", () => {
        it("should dispatch clearFbxDanceTasks", () => {
            cleanupAllDancers()
            expect(dawState.clearFbxDanceTasks).toHaveBeenCalled()
            expect(store.dispatch).toHaveBeenCalled()
        })
    })

    describe("setAvatar", () => {
        it("should dispatch SetAvatar", () => {
            setAvatar(mockResult, "Ninja.fbx")
            expect(dawState.SetAvatar).toHaveBeenCalledWith("Ninja.fbx")
            expect(store.dispatch).toHaveBeenCalled()
        })
    })

    describe("insertDanceMove / addDanceBlock", () => {
        it("should throw RangeError if dance move does not exist in animations", () => {
            expect(() => {
                insertDanceMove(mockResult, "FakeMove.fbx", "HipHop1.fbx", 1, 4)
            }).toThrow(RangeError)

            expect(() => {
                insertDanceMove(mockResult, "HipHop1.fbx", "FakeMove.fbx", 1, 4)
            }).toThrow(RangeError)
        })

        it("should throw validation error if measure or repeat is < 1", () => {
            expect(() => {
                insertDanceMove(mockResult, "HipHop1.fbx", "HipHop2.fbx", 0, 4)
            }).toThrow(RangeError) // Measure < 1

            expect(() => {
                insertDanceMove(mockResult, "HipHop1.fbx", "HipHop2.fbx", 1, 0)
            }).toThrow(RangeError) // Repeat < 1
        })
    })
})
