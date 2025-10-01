import chatReducer, {
  addMessage,
  addContext,
  removeContext,
  ChatState,
} from "@/state/slices/chatSlice";

const initialState: ChatState = {
  messages: [],
  selectedContexts: ["Problem Details", "Code"],
};

describe("chatSlice", () => {
  it("should return the initial state", () => {
    expect(chatReducer(undefined, { type: "unknown" })).toEqual({
      messages: [],
      selectedContexts: ["Problem Details", "Code"],
    });
  });

  it("should handle addMessage", () => {
    const userMessage = { text: "Hello", isUser: true };
    const botMessage = { text: "Hi", isUser: false };

    let state = chatReducer(initialState, addMessage(userMessage));
    expect(state.messages.length).toBe(1);
    expect(state.messages[0].text).toBe("Hello");
    expect(state.messages[0].isUser).toBe(true);

    state = chatReducer(state, addMessage(botMessage));
    expect(state.messages.length).toBe(2);
    expect(state.messages[1].text).toBe("Hi");
    expect(state.messages[1].isUser).toBe(false);
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
});
