import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import ChatWindow from "@/components/chat/ChatWindow";
import { thunk } from "redux-thunk";
import { toggleChat, toggleMinimize } from "@/state/slices/uiSlice";
import * as gemini from "@/utils/gemini";

const mockStore = configureStore([thunk]);

// Helper function to create a complete mock state
type MockStateOverrides = Partial<{
  chat: Partial<{
    messages: Array<{ id: string; text: string; isUser: boolean }>;
    selectedContexts: string[];
  }>;
  ui: Partial<{
    isChatOpen: boolean;
    isChatMinimized: boolean;
    chatPosition: { x: number; y: number };
    chatSize: { width: number; height: number };
    isContextOpen: boolean;
    isModelMenuOpen: boolean;
  }>;
  settings: Partial<{
    apiKey: string | null;
    selectedModel: string;
  }>;
  api: Partial<{
    isLoading: boolean;
    error: string | null;
  }>;
  problem: Partial<{
    currentProblemSlug: string | null;
  }>;
  [key: string]: unknown;
}>;

const createMockState = (overrides: MockStateOverrides = {}) => {
  const defaultChat = { messages: [], selectedContexts: [] };
  const defaultUi = {
    isChatOpen: true,
    isChatMinimized: false,
    chatPosition: { x: 50, y: 50 },
    chatSize: { width: 400, height: 600 },
    isContextOpen: false,
    isModelMenuOpen: false,
  };
  const defaultSettings = {
    apiKey: "test-api-key",
    selectedModel: "gemini-2.5-pro",
  };
  const defaultApi = { isLoading: false, error: null };
  const defaultProblem = { currentProblemSlug: "two-sum" };

  return {
    chat: { ...defaultChat, ...(overrides.chat || {}) },
    ui: { ...defaultUi, ...(overrides.ui || {}) },
    settings: { ...defaultSettings, ...(overrides.settings || {}) },
    api: { ...defaultApi, ...(overrides.api || {}) },
    problem: { ...defaultProblem, ...(overrides.problem || {}) },
    ...Object.fromEntries(
      Object.entries(overrides).filter(
        ([k]) => !["chat", "ui", "settings", "api", "problem"].includes(k),
      ),
    ),
  };
};

// Helper to render the component inside act so async state updates are wrapped
const renderWithStore = async (store: ReturnType<typeof mockStore>) =>
  await act(async () =>
    render(
      <Provider store={store}>
        <ChatWindow />
      </Provider>,
    ),
  );

describe("ChatWindow", () => {
  beforeEach(() => {
    (globalThis as unknown as { chrome: typeof chrome }).chrome = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
        } as unknown as typeof chrome.storage.local,
      },
    } as unknown as typeof chrome;
    // ensure window.pathname contains a problem slug used by the component logic
    // use history.pushState to avoid redefining window.location
    window.history.pushState({}, "", "/problems/two-sum/");

    jest.spyOn(gemini, "callGeminiApi").mockResolvedValue("Bot response");
  });

  it("renders chat messages", async () => {
    const state = createMockState({
      chat: {
        messages: [
          { id: "1", text: "User message", isUser: true },
          { id: "2", text: "Bot message", isUser: false },
        ],
      },
    });
    const store = mockStore(state);

    await renderWithStore(store);

    await waitFor(() => {
      expect(screen.getByText("User message")).toBeInTheDocument();
      expect(screen.getByText("Bot message")).toBeInTheDocument();
    });
  });

  it("displays a welcome message when there are no messages", async () => {
    const store = mockStore(createMockState());

    await renderWithStore(store);

    expect(await screen.findByText("Hello, LeetCoder")).toBeInTheDocument();
    // The welcome text may include the prettified problem title derived from the URL
    // (the DOM may split text across nodes), so match flexibly by checking both
    // the helper phrase and the problem title are present in the same element.
    expect(
      await screen.findByText(
        (content) =>
          content.includes("How can I assist you with") &&
          content.includes("Two Sum"),
      ),
    ).toBeInTheDocument();
  });

  it("displays a welcome message with the problem title", async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      "leetcode-problem-two-sum": {
        title: "1. Two Sum",
      },
    });

    const store = mockStore(createMockState());
    await renderWithStore(store);

    expect(
      await screen.findByText("How can I assist you with Two Sum problem?"),
    ).toBeInTheDocument();
  });

  it("sends context with the message", async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      "leetcode-problem-two-sum": {
        title: "1. Two Sum",
        description: "<p>Problem description</p>",
        code: "class Solution {}",
      },
    });

    const store = mockStore(
      createMockState({
        chat: { selectedContexts: ["Problem Details", "Code"] },
      }),
    );

    await renderWithStore(store);

    const input = screen.getByRole("textbox");
    const sendButton = screen.getByRole("button", { name: /Send/i });

    fireEvent.change(input, { target: { value: "My message" } });
    fireEvent.click(sendButton);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(gemini.callGeminiApi).toHaveBeenCalledWith(
      "test-api-key",
      expect.stringContaining("### Problem: 1. Two Sum"),
      "gemini-2.5-pro",
    );
    expect(gemini.callGeminiApi).toHaveBeenCalledWith(
      "test-api-key",
      expect.stringContaining("My message"),
      "gemini-2.5-pro",
    );
  });

  it("displays loading indicator when isLoading is true", async () => {
    const state = createMockState({
      api: {
        isLoading: true,
        error: null,
      },
    });
    const store = mockStore(state);

    await renderWithStore(store);

    expect(await screen.findByText("...")).toBeInTheDocument();
  });

  it("displays error message when there is an error", async () => {
    const state = createMockState({
      api: {
        isLoading: false,
        error: "Something went wrong",
      },
    });
    const store = mockStore(state);

    await renderWithStore(store);

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });

  it("does not render when chat is closed", async () => {
    const state = createMockState({
      ui: {
        isChatOpen: false,
        isChatMinimized: false,
        chatPosition: { x: 50, y: 50 },
        chatSize: { width: 400, height: 600 },
      },
    });
    const store = mockStore(state);

    await renderWithStore(store);

    // renderWithStore returns void from act wrapping, so read from DOM directly
    // Use document queries to assert nothing was rendered
    expect(document.querySelector("#chat-window")).toBeNull();
  });

  it("shows API key message when apiKey is not set", async () => {
    const state = createMockState({
      settings: {
        apiKey: null,
      },
    });
    const store = mockStore(state);

    await renderWithStore(store);

    expect(
      await screen.findByText(
        "Please set your Gemini API key in the extension settings.",
      ),
    ).toBeInTheDocument();
  });

  it("should dispatch toggleMinimize when minimize button is clicked", async () => {
    const store = mockStore(createMockState());
    await renderWithStore(store);

    fireEvent.click(await screen.findByRole("button", { name: /Minimize/i }));
    expect(store.getActions()).toContainEqual(toggleMinimize());
  });

  it("should dispatch toggleChat when close button is clicked", async () => {
    const store = mockStore(createMockState());
    await renderWithStore(store);

    fireEvent.click(await screen.findByRole("button", { name: /Close/i }));
    expect(store.getActions()).toContainEqual(toggleChat());
  });
});
