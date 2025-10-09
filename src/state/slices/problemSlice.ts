import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProblemState {
  currentProblemSlug: string | null;
}

const initialState: ProblemState = {
  currentProblemSlug: window.location.pathname.split("/")[2] || null,
};

const problemSlice = createSlice({
  name: "problem",
  initialState,
  reducers: {
    setProblemSlug: (state, action: PayloadAction<string>) => {
      state.currentProblemSlug = action.payload;
    },
  },
});

export const { setProblemSlug } = problemSlice.actions;
export default problemSlice.reducer;
