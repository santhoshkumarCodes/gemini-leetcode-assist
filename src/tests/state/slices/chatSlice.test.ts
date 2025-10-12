import chatReducer, {
  addMessage,
  addContext,
  removeContext,
  setCurrentChat,
  newChat,
  loadChats,
  ChatState,
  Chat,
  ChatMessage,
} from "@/state/slices/chatSlice";
import { saveChat, loadChats as loadChatsFromDB } from "@/utils/db";

jest.mock("@/utils/db");

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  selectedContexts: ["Problem Details", "Code"],
  currentProblemSlug: null,
  loading: "idle",
  currentRequestId: undefined,
};

describe("chatSlice", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the initial state", () => {
    expect(chatReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  describe("addMessage extraReducers", () => {
    const messageId = "msg1";
    const chatId = "chat1";
    const text = "Hello";
    const isUser = true;

    it("should handle addMessage.pending for a new chat", () => {
      const action = {
        type: addMessage.pending.type,
        meta: { arg: { text, isUser, messageId, chatId } },
      };
      const state = chatReducer(initialState, action);
      expect(state.chats.length).toBe(1);
      expect(state.chats[0].id).toBe(chatId);
      expect(state.chats[0].messages.length).toBe(1);
      expect(state.chats[0].messages[0]).toEqual({
        id: messageId,
        text,
        isUser,
        status: "sending",
      });
      expect(state.currentChatId).toBe(chatId);
    });

    it("should handle addMessage.pending for an existing chat", () => {
      const existingState: ChatState = {
        ...initialState,
        chats: [{ id: chatId, messages: [] as ChatMessage[] }],
        currentChatId: chatId,
      };
      const action = {
        type: addMessage.pending.type,
        meta: { arg: { text, isUser, messageId, chatId } },
      };
      const state = chatReducer(existingState, action);
      expect(state.chats.length).toBe(1);
      expect(state.chats[0].messages.length).toBe(1);
      expect(state.chats[0].messages[0]).toEqual({
        id: messageId,
        text,
        isUser,
        status: "sending",
      });
    });

    it("should handle addMessage.fulfilled", () => {
      const pendingState: ChatState = {
        ...initialState,
        chats: [
          {
            id: chatId,
            messages: [{ id: messageId, text, isUser, status: "sending" }],
          },
        ],
        currentChatId: chatId,
      };
      const action = {
        type: addMessage.fulfilled.type,
        payload: { chatId, messageId },
      };
      const state = chatReducer(pendingState, action);
      expect(state.chats[0].messages[0].status).toBe("succeeded");
    });

    it("should handle addMessage.rejected", () => {
      const pendingState: ChatState = {
        ...initialState,
        chats: [
          {
            id: chatId,
            messages: [{ id: messageId, text, isUser, status: "sending" }],
          },
        ],
        currentChatId: chatId,
      };
      const action = {
        type: addMessage.rejected.type,
        payload: { chatId, messageId },
      };
      const state = chatReducer(pendingState, action);
      expect(state.chats[0].messages[0].status).toBe("failed");
    });
  });

  it("should handle addContext", () => {
    const state = chatReducer(initialState, addContext("New Context"));
    expect(state.selectedContexts).toEqual([
      "Problem Details",
      "Code",
      "New Context",
    ]);
  });

  it("should not add a context if it already exists", () => {
    const state = chatReducer(initialState, addContext("Code"));
    expect(state.selectedContexts).toEqual(["Problem Details", "Code"]);
  });

  it("should handle removeContext", () => {
    const state = chatReducer(initialState, removeContext("Code"));
    expect(state.selectedContexts).toEqual(["Problem Details"]);
  });

  it("should handle setCurrentChat", () => {
    const state = chatReducer(initialState, setCurrentChat("chat1"));
    expect(state.currentChatId).toBe("chat1");
  });

  it("should handle newChat", () => {
    const state = chatReducer(initialState, newChat());
    expect(state.chats.length).toBe(1);
    expect(state.currentChatId).toBe(state.chats[0].id);
  });

  describe("loadChats thunk", () => {
    it("should load chats and set the first as current", async () => {
      const mockChats: Chat[] = [{ id: "chat1", messages: [] }];
      (loadChatsFromDB as jest.Mock).mockResolvedValue(mockChats);
      const dispatch = jest.fn();
      const thunk = loadChats("two-sum");
      await thunk(dispatch, () => ({ chat: initialState }), undefined);
      const { calls } = dispatch.mock;
      expect(calls.length).toBe(2);
      expect(calls[0][0].type).toBe("chat/loadChats/pending");
      expect(calls[1][0].type).toBe("chat/loadChats/fulfilled");
      expect(calls[1][0].payload).toEqual(mockChats);

      const pendingState = chatReducer(initialState, calls[0][0]);
      const finalState = chatReducer(pendingState, calls[1][0]);
      expect(finalState.chats).toEqual(mockChats);
      expect(finalState.currentChatId).toBe("chat1");
      expect(finalState.currentProblemSlug).toBe("two-sum");
    });

    it("should create a new chat if none are loaded", async () => {
      (loadChatsFromDB as jest.Mock).mockResolvedValue([]);
      const dispatch = jest.fn();
      const thunk = loadChats("two-sum");
      await thunk(dispatch, () => ({ chat: initialState }), undefined);
      const { calls } = dispatch.mock;
      const pendingState = chatReducer(initialState, calls[0][0]);
      const finalState = chatReducer(pendingState, calls[1][0]);
      expect(finalState.chats.length).toBe(1);
      expect(finalState.currentChatId).toBe(finalState.chats[0].id);
      expect(finalState.currentProblemSlug).toBe("two-sum");
    });

    it("should merge new chats with existing ones", async () => {
      // Setup state with an existing chat
      const existingChat: Chat = { id: "chat1", messages: [] };
      const currentState: ChatState = {
        ...initialState,
        chats: [existingChat],
        currentChatId: existingChat.id,
        currentProblemSlug: "two-sum",
      };

      // Setup mock for loading chats
      const newChat: Chat = { id: "chat2", messages: [] };
      (loadChatsFromDB as jest.Mock).mockResolvedValue([newChat]);

      // Run the thunk
      const dispatch = jest.fn();
      const thunk = loadChats("two-sum");
      await thunk(dispatch, () => ({ chat: currentState }), undefined);

      const pendingAction = {
        type: loadChats.pending.type,
        meta: { arg: "two-sum", requestId: "test" },
      };

      const fulfilledAction = {
        type: loadChats.fulfilled.type,
        payload: [newChat],
        meta: { arg: "two-sum", requestId: "test" },
      };

      // Apply actions in sequence
      let state = chatReducer(currentState, pendingAction);
      state = chatReducer(state, fulfilledAction);

      // Verify both chats are present
      expect(state.chats).toEqual(
        expect.arrayContaining([existingChat, newChat]),
      );
      expect(state.currentProblemSlug).toBe("two-sum");
    });

    it("should handle rejection on chat load failure", async () => {
      const error = new Error("Failed to load chats");
      (loadChatsFromDB as jest.Mock).mockRejectedValue(error);

      const dispatch = jest.fn();
      const thunk = loadChats("two-sum");
      await thunk(dispatch, () => ({ chat: initialState }), undefined);

      const { calls } = dispatch.mock;
      expect(calls.length).toBe(2);
      expect(calls[0][0].type).toBe("chat/loadChats/pending");
      expect(calls[1][0].type).toBe("chat/loadChats/rejected");

      const pendingState = chatReducer(initialState, calls[0][0]);
      const finalState = chatReducer(pendingState, calls[1][0]);
      expect(finalState.loading).toBe("idle");
    });

    it("should handle different problem slug in between load", async () => {
      const mockChats: Chat[] = [{ id: "chat1", messages: [] }];
      (loadChatsFromDB as jest.Mock).mockResolvedValue(mockChats);

      // Start with problem1
      let state = chatReducer(initialState, {
        type: "chat/loadChats/pending",
        meta: { arg: "problem1", requestId: "test1" },
      });

      // Change to problem2 before first load completes
      state = chatReducer(state, {
        type: "chat/loadChats/pending",
        meta: { arg: "problem2", requestId: "test2" },
      });

      // Complete problem1's load (should be ignored)
      state = chatReducer(state, {
        type: "chat/loadChats/fulfilled",
        payload: mockChats,
        meta: { arg: "problem1", requestId: "test1" },
      });

      // Verify state matches problem2's state
      expect(state.currentProblemSlug).toBe("problem2");
      expect(state.chats).toEqual([]);
    });
  });

  describe("chat storage operations", () => {
    const message: ChatMessage = {
      id: "msg1",
      text: "Hello",
      isUser: true,
      status: "sending",
    };

    it("should save chat and handle success", async () => {
      const state: ChatState = {
        ...initialState,
        chats: [{ id: "chat1", messages: [message] }],
        currentChatId: "chat1",
      };

      (saveChat as jest.Mock).mockResolvedValue(undefined);

      const dispatch = jest.fn();
      const thunk = addMessage({
        text: message.text,
        isUser: message.isUser,
        problemSlug: "test-problem",
        messageId: message.id,
        chatId: "chat1",
      });

      await thunk(dispatch, () => ({ chat: state }), undefined);

      expect(saveChat).toHaveBeenCalledWith(
        "test-problem",
        "chat1",
        expect.any(Array),
      );

      const finalState = chatReducer(
        state,
        dispatch.mock.calls[dispatch.mock.calls.length - 1][0],
      );
      expect(finalState.chats[0].messages[0].status).toBe("succeeded");
    });

    it("should handle save failure", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const state: ChatState = {
        ...initialState,
        chats: [{ id: "chat1", messages: [message] }],
        currentChatId: "chat1",
      };

      const error = new Error("Failed to save");
      (saveChat as jest.Mock).mockRejectedValue(error);

      const dispatch = jest.fn();
      const thunk = addMessage({
        text: message.text,
        isUser: message.isUser,
        problemSlug: "test-problem",
        messageId: message.id,
        chatId: "chat1",
      });

      await thunk(dispatch, () => ({ chat: state }), undefined);

      const finalState = chatReducer(
        state,
        dispatch.mock.calls[dispatch.mock.calls.length - 1][0],
      );
      expect(finalState.chats[0].messages[0].status).toBe("failed");
      consoleErrorSpy.mockRestore();
    });
  });
});
