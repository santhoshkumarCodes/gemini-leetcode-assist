import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

// Thunk to load the API key from chrome.storage
export const loadApiKey = createAsyncThunk(
  "settings/loadApiKey",
  async (_, { dispatch }) => {
    const result = await chrome.storage.local.get("apiKey");
    if (result.apiKey) {
      dispatch(setApiKey(result.apiKey));
    }
  },
);

// Thunk to save the API key to chrome.storage
export const saveApiKey = createAsyncThunk(
  "settings/saveApiKey",
  async (apiKey: string, { dispatch }) => {
    await chrome.storage.local.set({ apiKey });
    dispatch(setApiKey(apiKey));
  },
);

export interface SettingsState {
  apiKey: string | null;
}

const initialState: SettingsState = {
  apiKey: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setApiKey: (state, action: PayloadAction<string | null>) => {
      state.apiKey = action.payload;
    },
  },
});

export const { setApiKey } = settingsSlice.actions;
export default settingsSlice.reducer;
