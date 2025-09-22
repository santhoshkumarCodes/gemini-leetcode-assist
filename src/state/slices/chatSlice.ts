import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatState {
  messages: {
    text: string;
    isUser: boolean;
  }[];
}

const initialState: ChatState = {
  messages: [
    {
      text: "Hello! I'm Gemini. I can help you with LeetCode problems. How can I assist you today?",
      isUser: false,
    },
  ],
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
