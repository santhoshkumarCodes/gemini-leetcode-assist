import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatState {
  messages: {
    text: string;
    isUser: boolean;
  }[];
}

const initialState: ChatState = {
  messages: [],
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<{ text: string; isUser: boolean }>,
    ) => {
      state.messages.push(action.payload);
    },
  },
});

export const { addMessage } = chatSlice.actions;
export default chatSlice.reducer;
