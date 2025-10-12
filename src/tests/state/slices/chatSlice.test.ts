import chatReducer, {
  addMessage,
  addContext,
  removeContext,
  setCurrentChat,
  newChat,
  loadChats,
  ChatState,
  Chat,
} from "@/state/slices/chatSlice";
import { saveChat, loadChats as loadChatsFromDB } from "@/utils/db";

jest.mock("@/utils/db");

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  selectedContexts: ["Problem Details", "Code"],
  currentProblemSlug: null,
};

describe("chatSlice", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the initial state", () => {
    expect(chatReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  describe("addMessage", () => {
    it("should add a new message to a new chat", () => {
      const action = {
        text: "Hello",
        isUser: true,
        problemSlug: "two-sum",
      };
      const state = chatReducer(initialState, addMessage(action));
      expect(state.chats.length).toBe(1);
      expect(state.chats[0].messages.length).toBe(1);
      expect(state.chats[0].messages[0].text).toBe("Hello");
      expect(saveChat).toHaveBeenCalled();
    });

    it("should add a new message to an existing chat", () => {
      const existingState: ChatState = {
        ...initialState,
        chats: [{ id: "chat1", messages: [] }],
        currentChatId: "chat1",
      };
      const action = {
        text: "Hello",
        isUser: true,
        problemSlug: "two-sum",
      };
      const state = chatReducer(existingState, addMessage(action));
      expect(state.chats.length).toBe(1);
      expect(state.chats[0].messages.length).toBe(1);
      expect(saveChat).toHaveBeenCalled();
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
  });
});
