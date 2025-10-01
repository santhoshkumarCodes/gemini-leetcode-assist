import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";

export interface ChatState {
  messages: {
    id: string;
    text: string;
    isUser: boolean;
  }[];
  selectedContexts: string[];
}

const initialState: ChatState = {
  messages: [],
  selectedContexts: ["Problem Details", "Code"],
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
    addContext: (state, action: PayloadAction<string>) => {
      if (!state.selectedContexts.includes(action.payload)) {
        state.selectedContexts.push(action.payload);
      }
    },
    removeContext: (state, action: PayloadAction<string>) => {
      state.selectedContexts = state.selectedContexts.filter(
        (context) => context !== action.payload,
      );
    },
  },
});

export const { addMessage, addContext, removeContext } = chatSlice.actions;
export default chatSlice.reducer;
