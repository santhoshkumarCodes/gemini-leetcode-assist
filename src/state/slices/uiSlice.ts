import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  isChatOpen: boolean;
  isChatMinimized: boolean;
  chatPosition: { x: number; y: number };
  chatSize: { width: number; height: number };
}

const initialState: UIState = {
  isChatOpen: false,
  isChatMinimized: false,
  chatPosition: { x: 50, y: 50 },
  chatSize: { width: 400, height: 600 },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    toggleMinimize: (state) => {
      state.isChatMinimized = !state.isChatMinimized;
    },
    setChatPosition: (
      state,
      action: PayloadAction<{ x: number; y: number }>,
    ) => {
      state.chatPosition = action.payload;
    },
    setChatSize: (
      state,
      action: PayloadAction<{ width: number; height: number }>,
    ) => {
      state.chatSize = action.payload;
    },
  },
});

export const { toggleChat, toggleMinimize, setChatPosition, setChatSize } =
  uiSlice.actions;
export default uiSlice.reducer;
