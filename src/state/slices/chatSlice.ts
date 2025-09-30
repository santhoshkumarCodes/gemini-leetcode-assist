import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

export interface ChatState {
  messages: {
    id: string;
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
      state.messages.push({ ...action.payload, id: nanoid() });
    },
  },
});

export const { addMessage } = chatSlice.actions;
export default chatSlice.reducer;
