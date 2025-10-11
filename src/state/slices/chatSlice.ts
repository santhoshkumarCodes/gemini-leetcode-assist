import { createSlice, PayloadAction, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import { saveChat, loadChats as loadChatsFromDB } from "@/utils/db";

export interface Chat {
  id: string;
  messages: {
    id: string;
    text: string;
    isUser: boolean;
  }[];
}

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  selectedContexts: string[];
}

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  selectedContexts: ["Problem Details", "Code"],
};

export const loadChats = createAsyncThunk(
  "chat/loadChats",
  async (problemSlug: string) => {
    const chats = await loadChatsFromDB(problemSlug);
    return chats;
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<{ text: string; isUser: boolean; problemSlug: string }>
    ) => {
      const { text, isUser, problemSlug } = action.payload;
      let currentChat = state.chats.find(chat => chat.id === state.currentChatId);

      if (!currentChat) {
        const newChatId = nanoid();
        currentChat = { id: newChatId, messages: [] };
        state.chats.push(currentChat);
        state.currentChatId = newChatId;
      }

      currentChat.messages.push({ text, isUser, id: nanoid() });

      saveChat(
        problemSlug,
        currentChat.id,
        JSON.parse(JSON.stringify(currentChat.messages)),
      );
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
    setCurrentChat: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },
    newChat: (state) => {
      const newChatId = nanoid();
      state.chats.push({ id: newChatId, messages: [] });
      state.currentChatId = newChatId;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadChats.fulfilled, (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
      if (state.chats.length > 0) {
        state.currentChatId = state.chats[0].id;
      } else {
        const newChatId = nanoid();
        state.chats.push({ id: newChatId, messages: [] });
        state.currentChatId = newChatId;
      }
    });
  }
});

export const { addMessage, addContext, removeContext, setCurrentChat, newChat } = chatSlice.actions;
export default chatSlice.reducer;
