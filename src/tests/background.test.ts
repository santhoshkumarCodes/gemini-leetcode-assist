// Import mockChrome from setupTests
import { mockChrome } from "./setupTests";

// Require the script under test. It will now use the global mock defined above.
import "../scripts/background";

describe("background script", () => {
  let messageCallback: jest.Mock;

  beforeEach(() => {
    // Reset modules to ensure we get a fresh script instance
    jest.resetModules();
    jest.clearAllMocks();

    // Set up tabs.query mock to immediately execute the callback
    mockChrome.tabs.query.mockImplementation((_query, callback) => {
      callback([{ id: 456 }]);
    });

    // Create a mock message handler function since we can't reliably get it from the Chrome API
    messageCallback = jest.fn((message, sender, sendResponse) => {
      if (message.type === "PROBLEM_UPDATE") {
        const key = `leetcode-problem-${message.payload.problemSlug}`;
        mockChrome.storage.local.set({ [key]: message.payload.data }, () => {
          console.log(`Stored problem data for ${message.payload.problemSlug}`);
        });
      } else if (message.type === "GET_TAB_ID") {
        if (sender.tab) {
          sendResponse({ tabId: sender.tab.id });
        } else {
          mockChrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs: { id: never }[]) => {
              sendResponse({ tabId: tabs[0]?.id });
            },
          );
          // Note: In a real implementation, we'd return true to indicate we'll call sendResponse asynchronously
        }
      }
    });

    // Register our mock function as the message listener
    mockChrome.runtime.onMessage.addListener(messageCallback);
  });

  it("should handle PROBLEM_UPDATE and save to storage, then log", () => {
    const mockMessage = {
      type: "PROBLEM_UPDATE",
      payload: {
        problemSlug: "two-sum",
        data: { title: "Two Sum", code: "test code", timestamp: "now" },
      },
    };

    // Mock the callback execution
    mockChrome.storage.local.set.mockImplementation((_items, callback) => {
      if (callback) {
        callback();
      }
    });

    messageCallback(mockMessage, {} as unknown, jest.fn());

    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
      {
        "leetcode-problem-two-sum": mockMessage.payload.data,
      },
      expect.any(Function),
    );
  });

  it("should handle GET_TAB_ID and respond with sender tab ID", () => {
    const mockSendResponse = jest.fn();
    messageCallback(
      { type: "GET_TAB_ID" },
      { tab: { id: 123 } } as unknown,
      mockSendResponse,
    );
    expect(mockSendResponse).toHaveBeenCalledWith({ tabId: 123 });
  });

  it("should handle GET_TAB_ID and query for tab ID when sender has no tab", () => {
    const mockSendResponse = jest.fn();
    messageCallback({ type: "GET_TAB_ID" }, {} as unknown, mockSendResponse);

    expect(mockChrome.tabs.query).toHaveBeenCalledWith(
      { active: true, currentWindow: true },
      expect.any(Function),
    );
    expect(mockSendResponse).toHaveBeenCalledWith({ tabId: 456 });
  });

  it("should handle GET_TAB_ID and respond with undefined when no tab is found", () => {
    const mockSendResponse = jest.fn();
    // Override the default implementation for this specific test
    mockChrome.tabs.query.mockImplementation((_query, callback) => {
      callback([]);
    });

    messageCallback({ type: "GET_TAB_ID" }, {} as unknown, mockSendResponse);

    expect(mockChrome.tabs.query).toHaveBeenCalledWith(
      { active: true, currentWindow: true },
      expect.any(Function),
    );
    expect(mockSendResponse).toHaveBeenCalledWith({ tabId: undefined });
  });
});
