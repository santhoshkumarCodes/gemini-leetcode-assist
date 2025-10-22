import {
  createSlice,
  PayloadAction,
  nanoid,
  createAsyncThunk,
} from "@reduxjs/toolkit";
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
  title?: string;
  lastUpdated?: number; // Unix timestamp in milliseconds
}

/**
 * Selects the most recent chat from an array of chats based on lastUpdated timestamp.
 * Safely handles missing lastUpdated values by treating them as 0.
 * @param chats - Array of chats to search
 * @returns The most recent chat, or undefined if the array is empty
 */
export function getMostRecentChat(chats: Chat[]): Chat | undefined {
  if (chats.length === 0) {
    return undefined;
  }

  return chats.reduce((latest, chat) =>
    (chat.lastUpdated ?? 0) > (latest.lastUpdated ?? 0) ? chat : latest,
  );
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
    const chat = state.chat.chats.find((c) => c.id === chatId)!;

    try {
      await saveChat(
        problemSlug,
        chatId,
        structuredClone(chat.messages),
        chat.lastUpdated,
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
      // First, check if there's already an empty chat
      const emptyChat = state.chats.find((c) => c.messages.length === 0);

      if (emptyChat) {
        // Navigate to the existing empty chat and update its timestamp
        state.currentChatId = emptyChat.id;
        emptyChat.lastUpdated = Date.now();
      } else {
        // Create a new chat only if no empty chat exists
        const newChatId = nanoid();
        state.chats.push({
          id: newChatId,
          messages: [],
          lastUpdated: Date.now(),
        });
        state.currentChatId = newChatId;
      }
    },
    updateChatTimestamp: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c.id === action.payload);
      if (chat) {
        chat.lastUpdated = Date.now();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadChats.pending, (state, action) => {
        state.loading = "pending";
        state.currentRequestId = action.meta.requestId;
        if (state.currentProblemSlug !== action.meta.arg) {
          state.chats = [];
          state.currentChatId = null;
        }
        state.currentProblemSlug = action.meta.arg;
      })
      .addCase(loadChats.fulfilled, (state, action: PayloadAction<Chat[]>) => {
        if (
          state.loading === "pending" &&
          state.currentRequestId === action.meta.requestId
        ) {
          state.loading = "idle";
          state.currentRequestId = undefined;

          if (action.meta.arg !== state.currentProblemSlug) {
            return;
          }

          const loadedChats = action.payload;
          const existingChats = state.chats;

          if (existingChats.length === 0) {
            state.chats = loadedChats;
            if (state.chats.length > 0) {
              // Select the most recent chat (highest lastUpdated timestamp)
              const mostRecentChat = getMostRecentChat(state.chats);
              state.currentChatId = mostRecentChat?.id ?? null;
            } else {
              const newChatId = nanoid();
              state.chats.push({
                id: newChatId,
                messages: [],
                lastUpdated: Date.now(),
              });
              state.currentChatId = newChatId;
            }
            return;
          }

          const existingChatMap = new Map(existingChats.map((c) => [c.id, c]));

          for (const loadedChat of loadedChats) {
            if (!existingChatMap.has(loadedChat.id)) {
              state.chats.push(loadedChat);
            }
          }

          if (
            !state.currentChatId ||
            !state.chats.find((c) => c.id === state.currentChatId)
          ) {
            if (state.chats.length > 0) {
              // Select the most recent chat (highest lastUpdated timestamp)
              const mostRecentChat = getMostRecentChat(state.chats);
              state.currentChatId = mostRecentChat?.id ?? null;
            }
          }
        }
      })
      .addCase(loadChats.rejected, (state, action) => {
        if (
          state.loading === "pending" &&
          state.currentRequestId === action.meta.requestId
        ) {
          state.loading = "idle";
          state.currentRequestId = undefined;
        }
      })
      .addCase(addMessage.pending, (state, action) => {
        const { text, isUser, messageId, chatId } = action.meta.arg;
        let chat = state.chats.find((c) => c.id === chatId);
        if (!chat) {
          chat = { id: chatId, messages: [], lastUpdated: Date.now() };
          state.chats.push(chat);
          state.currentChatId = chatId;
        }
        chat.messages.push({ id: messageId, text, isUser, status: "sending" });
        chat.lastUpdated = Date.now();
      })
      .addCase(addMessage.fulfilled, (state, action) => {
        const { chatId, messageId } = action.payload;
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) {
          const message = chat.messages.find((m) => m.id === messageId);
          if (message) {
            message.status = "succeeded";
          }
        }
      })
      .addCase(addMessage.rejected, (state, action) => {
        const { chatId, messageId } = action.payload as {
          chatId: string;
          messageId: string;
        };
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) {
          const message = chat.messages.find((m) => m.id === messageId);
          if (message) {
            message.status = "failed";
          }
        }
      });
  },
});

export const {
  addContext,
  removeContext,
  setCurrentChat,
  newChat,
  updateChatTimestamp,
} = chatSlice.actions;
export default chatSlice.reducer;
