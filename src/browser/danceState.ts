import { createSlice, createSelector } from "@reduxjs/toolkit"
//import i18n from "i18next"

import { DANCE_DOC } from "../dance/danceDoc"   // NEW
import { selectScriptLanguage, selectLocaleCode } from "../app/appState"
import type { RootState } from "../reducers"

const danceSlice = createSlice({
    name: "dance",
    initialState: {
        searchText: "",
    },
    reducers: {
        // Updates the current search text used to filter dance moves.
        setSearchText(state, { payload }) {
            state.searchText = payload
        },
    },
})

export default danceSlice.reducer
export const { setSearchText } = danceSlice.actions

// Gets the dance move search text from Redux state.
export const selectSearchText = (state: RootState) => state.dance.searchText

// Returns dance moves entries filtered by name, display name, and optional description.
export const selectFilteredEntries = createSelector(
    [selectSearchText, selectScriptLanguage, selectLocaleCode],
    (searchText, _, __) => {
        const term = searchText.toLowerCase()
        return DANCE_DOC.filter(move => {
            const field = `${move.name.toLowerCase()}${move.displayName.toLowerCase()}`
            return field.includes(term)
        })
    }
)