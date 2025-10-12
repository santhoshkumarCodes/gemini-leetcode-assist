import { createSlice, PayloadAction, nanoid, createAsyncThunk } from "@reduxjs/toolkit";
import { saveChat, loadChats as loadChatsFromDB } from "@/utils/db";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  status: "sending" | "succeeded" | "failed";
}

export interface Chat {
  id: string;
  messages: ChatMessage[];
}

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  selectedContexts: string[];
  currentProblemSlug: string | null;
  loading: "idle" | "pending";
  currentRequestId: string | undefined;
}

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  selectedContexts: ["Problem Details", "Code"],
  currentProblemSlug: null,
  loading: "idle",
  currentRequestId: undefined,
};

export const loadChats = createAsyncThunk(
  "chat/loadChats",
  async (problemSlug: string) => {
    const chats = await loadChatsFromDB(problemSlug);
    return chats;
  },
);

export const addMessage = createAsyncThunk(
  "chat/addMessage",
  async (
    payload: {
      text: string;
      isUser: boolean;
      problemSlug: string;
      messageId: string;
      chatId: string;
    },
    { getState, rejectWithValue },
  ) => {
    const { problemSlug, chatId, messageId } = payload;
    const state = getState() as { chat: { chats: Chat[] } };
    const chat = state.chat.chats.find((c) => c.id === chatId);

    if (!chat) {
      return rejectWithValue({ chatId, messageId, error: "Chat not found" });
    }

    try {
      await saveChat(
        problemSlug,
        chatId,
        JSON.parse(JSON.stringify(chat.messages)),
      );
      return { chatId, messageId };
    } catch (error) {
      console.error("Failed to save chat:", {
        problemSlug,
        chatId,
        messageId,
        error,
      });
      return rejectWithValue({ chatId, messageId });
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
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
    builder
      .addCase(loadChats.pending, (state, action) => {
        state.loading = 'pending';
        state.currentRequestId = action.meta.requestId;
        if (state.currentProblemSlug !== action.meta.arg) {
          state.chats = [];
          state.currentChatId = null;
        }
        state.currentProblemSlug = action.meta.arg;
      })
      .addCase(loadChats.fulfilled, (state, action: PayloadAction<Chat[]>) => {
        if (state.loading === 'pending' && state.currentRequestId === action.meta.requestId) {
          state.loading = 'idle';
          state.currentRequestId = undefined;

          if (action.meta.arg !== state.currentProblemSlug) {
            return;
          }

          const loadedChats = action.payload;
          const existingChats = state.chats;

          if (existingChats.length === 0) {
            state.chats = loadedChats;
            if (state.chats.length > 0) {
              state.currentChatId = state.chats[0].id;
            } else {
              const newChatId = nanoid();
              state.chats.push({ id: newChatId, messages: [] });
              state.currentChatId = newChatId;
            }
            return;
          }

          const existingChatMap = new Map(existingChats.map(c => [c.id, c]));

          for (const loadedChat of loadedChats) {
            if (!existingChatMap.has(loadedChat.id)) {
              state.chats.push(loadedChat);
            }
          }

          if (!state.currentChatId || !state.chats.find(c => c.id === state.currentChatId)) {
            if (state.chats.length > 0) {
              state.currentChatId = state.chats[0].id;
            }
          }
        }
      })
      .addCase(loadChats.rejected, (state, action) => {
        if (state.loading === 'pending' && state.currentRequestId === action.meta.requestId) {
            state.loading = 'idle';
            state.currentRequestId = undefined;
        }
      })
      .addCase(addMessage.pending, (state, action) => {
          const { text, isUser, messageId, chatId } = action.meta.arg;
          let chat = state.chats.find(c => c.id === chatId);
          if (!chat) {
              chat = { id: chatId, messages: [] };
              state.chats.push(chat);
              state.currentChatId = chatId;
          }
          chat.messages.push({ id: messageId, text, isUser, status: 'sending' });
      })
      .addCase(addMessage.fulfilled, (state, action) => {
          const { chatId, messageId } = action.payload;
          const chat = state.chats.find(c => c.id === chatId);
          if (chat) {
              const message = chat.messages.find(m => m.id === messageId);
              if (message) {
                  message.status = 'succeeded';
              }
          }
      })
      .addCase(addMessage.rejected, (state, action) => {
          const { chatId, messageId } = action.payload as { chatId: string, messageId: string };
          const chat = state.chats.find(c => c.id === chatId);
          if (chat) {
              const message = chat.messages.find(m => m.id === messageId);
              if (message) {
                  message.status = 'failed';
              }
          }
      });
  }
});

export const { addContext, removeContext, setCurrentChat, newChat } = chatSlice.actions;
export default chatSlice.reducer;
