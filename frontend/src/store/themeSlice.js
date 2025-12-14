import { createSlice } from "@reduxjs/toolkit";

const initialTheme = (() => {
    try {
        return localStorage.getItem('appTheme') || 'dark';
    } catch (e) {
        return 'dark';
    }
})();

const themeSlice = createSlice({
    name: 'theme',
    initialState: { value: initialTheme },
    reducers: {
        setTheme(state, action) {
            state.value = action.payload;
            try { localStorage.setItem('appTheme', action.payload); } catch (e) {}
        },
    },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
