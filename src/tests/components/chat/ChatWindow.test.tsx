import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import ChatWindow from "@/components/chat/ChatWindow";
import { thunk } from "redux-thunk";
import { toggleChat, toggleMinimize } from "@/state/slices/uiSlice";

const mockStore = configureStore([thunk]);

// Helper function to create a complete mock state
const createMockState = (overrides = {}) => ({
  chat: {
    messages: [],
  },
  ui: {
    isChatOpen: true,
    isChatMinimized: false,
    chatPosition: { x: 50, y: 50 },
    chatSize: { width: 400, height: 600 },
  },
  settings: {
    apiKey: "test-api-key",
  },
  api: {
    isLoading: false,
    error: null,
  },
  ...overrides,
});

describe("ChatWindow", () => {
  it("renders chat messages", () => {
    const state = createMockState({
      chat: {
        messages: [
          { id: "1", text: "User message", isUser: true },
          { id: "2", text: "Bot message", isUser: false },
        ],
      },
    });
    const store = mockStore(state);

    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    );

    expect(screen.getByText("User message")).toBeInTheDocument();
    expect(screen.getByText("Bot message")).toBeInTheDocument();
  });

  it("displays a welcome message when there are no messages", () => {
    const state = createMockState({
      chat: {
        messages: [],
      },
    });
    const store = mockStore(state);

    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    );

    expect(screen.getByText("Hello, LeetCoder")).toBeInTheDocument();
    expect(
      screen.getByText("How can I assist you with Two Sum problem?"),
    ).toBeInTheDocument();
  });

  it("displays loading indicator when isLoading is true", () => {
    const state = createMockState({
      api: {
        isLoading: true,
        error: null,
      },
    });
    const store = mockStore(state);

    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    );

    expect(screen.getByText("...")).toBeInTheDocument();
  });

  it("displays error message when there is an error", () => {
    const state = createMockState({
      api: {
        isLoading: false,
        error: "Something went wrong",
      },
    });
    const store = mockStore(state);

    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("does not render when chat is closed", () => {
    const state = createMockState({
      ui: {
        isChatOpen: false,
        isChatMinimized: false,
        chatPosition: { x: 50, y: 50 },
        chatSize: { width: 400, height: 600 },
      },
    });
    const store = mockStore(state);

    const { container } = render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows API key message when apiKey is not set", () => {
    const state = createMockState({
      settings: {
        apiKey: null,
      },
    });
    const store = mockStore(state);

    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    );

    expect(
      screen.getByText(
        "Please set your Gemini API key in the extension settings.",
      ),
    ).toBeInTheDocument();
  });

  it("should dispatch toggleMinimize when minimize button is clicked", () => {
    const store = mockStore(createMockState());
    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Minimize/i }));
    expect(store.getActions()).toContainEqual(toggleMinimize());
  });

  it("should dispatch toggleChat when close button is clicked", () => {
    const store = mockStore(createMockState());
    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(store.getActions()).toContainEqual(toggleChat());
  });
});
