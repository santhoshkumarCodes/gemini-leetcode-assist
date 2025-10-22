import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  isChatOpen: boolean;
  isChatMinimized: boolean;
  chatPosition: { x: number; y: number };
  chatSize: { width: number; height: number };
  isContextOpen: boolean;
  isModelMenuOpen: boolean;
  isChatHistoryOpen: boolean;
}

const initialState: UIState = {
  isChatOpen: false,
  isChatMinimized: false,
  chatPosition: { x: 50, y: 50 },
  chatSize: { width: 400, height: 600 },
  isContextOpen: false,
  isModelMenuOpen: false,
  isChatHistoryOpen: false,
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
    setContextOpen: (state, action: PayloadAction<boolean>) => {
      state.isContextOpen = action.payload;
    },
    setModelMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isModelMenuOpen = action.payload;
    },
    setChatHistoryOpen: (state, action: PayloadAction<boolean>) => {
      state.isChatHistoryOpen = action.payload;
    },
  },
});

export const {
  toggleChat,
  toggleMinimize,
  setChatPosition,
  setChatSize,
  setContextOpen,
  setModelMenuOpen,
  setChatHistoryOpen,
} = uiSlice.actions;
export default uiSlice.reducer;
