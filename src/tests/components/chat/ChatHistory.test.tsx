import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ChatHistory from "@/components/chat/ChatHistory";
import chatReducer, { Chat } from "@/state/slices/chatSlice";
import uiReducer from "@/state/slices/uiSlice";
import { formatRelativeTime, generateChatTitle } from "@/utils/timeFormat";

jest.mock("@/utils/timeFormat");

const mockFormatRelativeTime = formatRelativeTime as jest.MockedFunction<
  typeof formatRelativeTime
>;
const mockGenerateChatTitle = generateChatTitle as jest.MockedFunction<
  typeof generateChatTitle
>;

describe("ChatHistory Component", () => {
  const mockNow = 1234567890000;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);
    mockFormatRelativeTime.mockImplementation((timestamp) => {
      const diff = mockNow - timestamp;
      if (diff < 60000) return "just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
      return `${Math.floor(diff / 86400000)} days ago`;
    });
    mockGenerateChatTitle.mockImplementation((messages) => {
      const firstUserMessage = messages.find((msg) => msg.isUser);
      return firstUserMessage
        ? firstUserMessage.text.substring(0, 40)
        : "New Chat";
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockStore = (
    chats: Chat[],
    currentChatId: string | null,
    isChatHistoryOpen: boolean,
  ) => {
    return configureStore({
      reducer: {
        chat: chatReducer,
        ui: uiReducer,
      },
      preloadedState: {
        chat: {
          chats,
          currentChatId,
          selectedContexts: [],
          currentProblemSlug: "two-sum",
          loading: "idle" as const,
          currentRequestId: undefined,
        },
        ui: {
          isChatOpen: true,
          isChatMinimized: false,
          chatPosition: { x: 0, y: 0 },
          chatSize: { width: 400, height: 600 },
          isContextOpen: false,
          isModelMenuOpen: false,
          isChatHistoryOpen,
        },
      },
    });
  };

  it("should not render when isChatHistoryOpen is false", () => {
    const store = createMockStore([], null, false);
    const { container } = render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should show 'No chat history yet' when there are no chats", () => {
    const store = createMockStore([], null, true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );
    expect(screen.getByText("No chat history yet")).toBeInTheDocument();
  });

  it("should render list of chats sorted by most recent first", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [
          {
            id: "msg1",
            text: "Oldest chat",
            isUser: true,
            status: "succeeded",
          },
        ],
        lastUpdated: mockNow - 10000, // 10 seconds ago
      },
      {
        id: "chat2",
        messages: [
          {
            id: "msg2",
            text: "Most recent chat",
            isUser: true,
            status: "succeeded",
          },
        ],
        lastUpdated: mockNow, // Just now
      },
      {
        id: "chat3",
        messages: [
          {
            id: "msg3",
            text: "Middle chat",
            isUser: true,
            status: "succeeded",
          },
        ],
        lastUpdated: mockNow - 5000, // 5 seconds ago
      },
    ];

    const store = createMockStore(chats, "chat2", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);

    // Should be sorted most recent first
    expect(buttons[0]).toHaveTextContent("Most recent chat");
    expect(buttons[1]).toHaveTextContent("Middle chat");
    expect(buttons[2]).toHaveTextContent("Oldest chat");
  });

  it("should highlight the active chat", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [
          { id: "msg1", text: "Chat 1", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow,
      },
      {
        id: "chat2",
        messages: [
          { id: "msg2", text: "Chat 2", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow - 1000,
      },
    ];

    const store = createMockStore(chats, "chat1", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    const buttons = screen.getAllByRole("button");
    // Active chat should have bg-white/10 styling
    expect(buttons[0].className).toContain("bg-white/10");
    expect(buttons[1].className).not.toContain("bg-white/10");
    expect(buttons[1].className).toContain("hover:bg-white/5");
  });

  it("should display formatted relative time for each chat", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [
          { id: "msg1", text: "Chat 1", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow - 120000, // 2 minutes ago
      },
      {
        id: "chat2",
        messages: [
          { id: "msg2", text: "Chat 2", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow - 7200000, // 2 hours ago
      },
    ];

    const store = createMockStore(chats, "chat1", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    expect(screen.getByText("2 minutes ago")).toBeInTheDocument();
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  it("should call setCurrentChat and close history when a chat is clicked", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [
          { id: "msg1", text: "Chat 1", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow,
      },
      {
        id: "chat2",
        messages: [
          { id: "msg2", text: "Chat 2", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow - 1000,
      },
    ];

    const store = createMockStore(chats, "chat1", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]); // Click chat2

    const state = store.getState();
    expect(state.chat.currentChatId).toBe("chat2");
    expect(state.ui.isChatHistoryOpen).toBe(false);
  });

  it("should call generateChatTitle for each chat", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [
          {
            id: "msg1",
            text: "What is binary search?",
            isUser: true,
            status: "succeeded",
          },
          {
            id: "msg2",
            text: "Binary search is...",
            isUser: false,
            status: "succeeded",
          },
        ],
        lastUpdated: mockNow,
      },
    ];

    const store = createMockStore(chats, "chat1", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    expect(mockGenerateChatTitle).toHaveBeenCalledWith(chats[0].messages);
  });

  it("should handle empty chat (no messages)", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [],
        lastUpdated: mockNow,
      },
    ];

    mockGenerateChatTitle.mockReturnValue("New Chat");

    const store = createMockStore(chats, "chat1", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    expect(screen.getByText("New Chat")).toBeInTheDocument();
  });

  it("should show timestamp in blue color", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [
          { id: "msg1", text: "Chat 1", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow - 120000,
      },
    ];

    const store = createMockStore(chats, "chat1", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    const timeElement = screen.getByText("2 minutes ago");
    expect(timeElement.className).toContain("text-blue-400");
  });

  it("should show smaller font sizes for compact UI", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [
          { id: "msg1", text: "Chat 1", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow,
      },
    ];

    const store = createMockStore(chats, "chat1", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    const titleElement = screen.getByText("Chat 1");
    const timeElement = screen.getByText("just now");

    // Check for text-xs class (smaller font)
    expect(titleElement.className).toContain("text-xs");
    expect(timeElement.className).toContain("text-[10px]");
  });

  it("should use gray colors for inactive chats", () => {
    const chats: Chat[] = [
      {
        id: "chat1",
        messages: [
          { id: "msg1", text: "Active", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow,
      },
      {
        id: "chat2",
        messages: [
          { id: "msg2", text: "Inactive", isUser: true, status: "succeeded" },
        ],
        lastUpdated: mockNow - 1000,
      },
    ];

    const store = createMockStore(chats, "chat1", true);
    render(
      <Provider store={store}>
        <ChatHistory />
      </Provider>,
    );

    const activeChatTitle = screen.getByText("Active");
    const inactiveChatTitle = screen.getByText("Inactive");

    expect(activeChatTitle.className).toContain("text-gray-300");
    expect(inactiveChatTitle.className).toContain("text-gray-400");
  });
});
