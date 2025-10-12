import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProblemState {
  currentProblemSlug: string | null;
}

const initialState: ProblemState = {
  currentProblemSlug: typeof window !== "undefined"
    ? window.location.pathname.split("/")[2] || null
    : null,
};

const problemSlice = createSlice({
  name: "problem",
  initialState,
  reducers: {
    setProblemSlug: (state, action: PayloadAction<string | null>) => {
      state.currentProblemSlug = action.payload;
    },
  },
});

export const { setProblemSlug } = problemSlice.actions;
export default problemSlice.reducer;
