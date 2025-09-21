// Import mockChrome from setupTests
import { mockChrome } from "./setupTests";

// Define a type for the message listener
type MessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | void;

describe("background script", () => {
  let capturedListener: MessageListener;

  beforeEach(async () => {
    // Reset modules to ensure we get a fresh script instance and clear mocks
    jest.resetModules();
    jest.clearAllMocks();

    // Spy on addListener to capture the callback, then import the script
    const addListenerSpy = jest.spyOn(
      mockChrome.runtime.onMessage,
      "addListener",
    );

    await import("../scripts/background");

    // Ensure the listener was registered and capture it
    expect(addListenerSpy).toHaveBeenCalledTimes(1);
    capturedListener = addListenerSpy.mock.calls[0][0] as MessageListener;

    // Mock implementations for chrome APIs
    mockChrome.tabs.query.mockImplementation((_query, callback) => {
      callback([{ id: 456 }]);
    });

    mockChrome.storage.local.set.mockImplementation((_items, callback) => {
      if (callback) {
        callback();
      }
    });
  });

  it("should handle PROBLEM_UPDATE and save to storage", () => {
    const mockMessage = {
      type: "PROBLEM_UPDATE",
      payload: {
        problemSlug: "two-sum",
        data: { title: "Two Sum", code: "test code", timestamp: "now" },
      },
    };

    capturedListener(mockMessage, {} as never, jest.fn());

    expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
      {
        "leetcode-problem-two-sum": mockMessage.payload.data,
      },
      expect.any(Function),
    );
  });

  it("should handle GET_TAB_ID and respond with sender tab ID", () => {
    const mockSendResponse = jest.fn();
    capturedListener(
      { type: "GET_TAB_ID" },
      { tab: { id: 123 } } as never,
      mockSendResponse,
    );
    expect(mockSendResponse).toHaveBeenCalledWith({ tabId: 123 });
  });

  it("should handle GET_TAB_ID and query for tab ID when sender has no tab", () => {
    const mockSendResponse = jest.fn();
    const result = capturedListener(
      { type: "GET_TAB_ID" },
      {} as never,
      mockSendResponse,
    );

    expect(mockChrome.tabs.query).toHaveBeenCalledWith(
      { active: true, currentWindow: true },
      expect.any(Function),
    );
    expect(mockSendResponse).toHaveBeenCalledWith({ tabId: 456 });
    expect(result).toBe(true); // Should return true for async response
  });

  it("should handle GET_TAB_ID and respond with undefined when no tab is found", () => {
    const mockSendResponse = jest.fn();
    // Override the default implementation for this specific test
    mockChrome.tabs.query.mockImplementation((_query, callback) => {
      callback([]);
    });

    capturedListener({ type: "GET_TAB_ID" }, {} as never, mockSendResponse);

    expect(mockChrome.tabs.query).toHaveBeenCalledWith(
      { active: true, currentWindow: true },
      expect.any(Function),
    );
    expect(mockSendResponse).toHaveBeenCalledWith({ tabId: undefined });
  });

  it("should do nothing for unknown message types", () => {
    const mockSendResponse = jest.fn();
    capturedListener({ type: "UNKNOWN" }, {} as never, mockSendResponse);

    expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    expect(mockChrome.tabs.query).not.toHaveBeenCalled();
    expect(mockSendResponse).not.toHaveBeenCalled();
  });
});
