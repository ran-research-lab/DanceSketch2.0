import { createSlice, createSelector } from "@reduxjs/toolkit"
import { AVATAR_DOC } from "../dance/avatarDoc"
import { selectScriptLanguage, selectLocaleCode } from "../app/appState"
import type { RootState } from "../reducers"

const avatarSlice = createSlice({
    name: "avatar",
    initialState: {
        searchText: "",
    },
    reducers: {
        // Updates the current search text used to filter avatars.
        setSearchText(state, { payload }) {
            state.searchText = payload
        },
    },
})

export default avatarSlice.reducer
export const { setSearchText } = avatarSlice.actions

// Gets the avatar search text from Redux state.
export const selectSearchText = (state: RootState) => state.avatar.searchText

// Returns avatar entries filtered by name, display name, and optional description.
export const selectFilteredEntries = createSelector(
    [selectSearchText, selectScriptLanguage, selectLocaleCode],
    (searchText, _, __) => {
        const term = searchText.toLowerCase()

        return AVATAR_DOC.filter((move) => {
            const field =`${move.name.toLowerCase()}${move.displayName.toLowerCase()}`
            return field.includes(term)
        })
    }
)