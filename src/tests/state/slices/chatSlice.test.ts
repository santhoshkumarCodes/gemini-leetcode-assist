import chatReducer, { addMessage, ChatState } from "@/state/slices/chatSlice";

const initialState: ChatState = {
  messages: [],
};

describe("chatSlice", () => {
  it("should return the initial state", () => {
    expect(chatReducer(undefined, { type: "unknown" })).toEqual(initialState);
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
});
