import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ApiState {
  isLoading: boolean;
  error: string | null;
}

const initialState: ApiState = {
  isLoading: false,
  error: null,
};

const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setLoading, setError } = apiSlice.actions;
export default apiSlice.reducer;
