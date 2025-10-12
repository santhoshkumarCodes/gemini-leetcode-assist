// Import mockChrome from setupTests
import { mockChrome } from "./setupTests";
import { configureStore } from "@reduxjs/toolkit";
import uiReducer, { UIState } from "@/state/slices/uiSlice";
import chatReducer from "@/state/slices/chatSlice";
import settingsReducer from "@/state/slices/settingsSlice";
import apiReducer from "@/state/slices/apiSlice";
import problemReducer from "@/state/slices/problemSlice";
import { RootState } from "@/state/store";

// Mock parser
const mockParseLeetCodeProblem = jest.fn();
jest.mock("../scripts/content-script/parser", () => ({
  __esModule: true,
  parseLeetCodeProblem: mockParseLeetCodeProblem,
}));

// Create a proper store mock
let mockStore: ReturnType<typeof configureStore>;
jest.mock("@/state/store", () => {
  return {
    __esModule: true,
    get default() {
      return mockStore;
    },
  };
});

describe("content-script", () => {
  const fakeDetails = {
    title: "Two Sum",
    description: "<p>Find two numbers...</p>",
    examples: ["Input: [2,7,11,15], target = 9 Output: [0,1]"],
    constraints: "<ul><li>1 <= n <= 10^5</li></ul>",
  };

  // Helper to send a message event with source === window
  const sendCodeUpdate = (code: string) => {
    const evt = new MessageEvent("message", {
      data: { type: "CODE_UPDATE", code },
      source: window as never,
    });
    window.dispatchEvent(evt);
  };

  let addListenerSpy: jest.SpyInstance | null = null;
  let messageHandler: ((event: MessageEvent) => void) | null = null;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Reset parser mock
    mockParseLeetCodeProblem.mockReset();

    // Create real Redux store for testing
    mockStore = configureStore({
      reducer: {
        chat: chatReducer,
        settings: settingsReducer,
        ui: uiReducer,
        api: apiReducer,
        problem: problemReducer,
      },
    });

    // Set a relative path to avoid cross-origin SecurityError in jsdom
    window.history.replaceState({}, "", "/problems/two-sum/");

    // Spy the addEventListener to capture handler for cleanup
    addListenerSpy = jest.spyOn(window, "addEventListener");
    messageHandler = null;

    // Default parser impl resolves immediately
    mockParseLeetCodeProblem.mockImplementation(() =>
      Promise.resolve(fakeDetails),
    );
  });

  afterEach(() => {
    // Attempt to remove the 'message' listener if we captured it
    try {
      if (addListenerSpy) {
        const messageCall = addListenerSpy.mock.calls.find(
          (c) => c[0] === "message",
        );
        if (messageCall && messageCall[1]) {
          messageHandler = messageCall[1] as (event: MessageEvent) => void;
        }
      }
      if (messageHandler) {
        window.removeEventListener(
          "message",
          messageHandler as EventListener,
          false,
        );
      }
    } catch {
      // ignore cleanup errors
    } finally {
      if (addListenerSpy) addListenerSpy.mockRestore();
    }
  });

  it("injects the script and removes it on load", async () => {
    await import("../scripts/content-script/content-script");

    // The injected script should be in the DOM
    const script = document.querySelector<HTMLScriptElement>(
      'script[src="chrome-extension://mock-id/injected-script.js"]',
    );
    expect(script).toBeTruthy();

    // Simulate script load -> should remove itself
    script?.onload?.(new Event("load") as never);
    const stillThere = document.querySelector<HTMLScriptElement>(
      'script[src="chrome-extension://mock-id/injected-script.js"]',
    );
    expect(stillThere).toBeNull();
  });

  it("sends a unified update when a CODE_UPDATE message is received after parsing is ready", async () => {
    await import("../scripts/content-script/content-script");

    // Wait a microtask for parse promise then-handler to run
    await Promise.resolve();

    // Send a code update from the same window (ensures event.source === window)
    const code = "console.log(1);";
    sendCodeUpdate(code);

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "PROBLEM_UPDATE",
      payload: {
        problemSlug: "two-sum",
        data: expect.objectContaining({
          ...fakeDetails,
          code,
          timestamp: expect.any(String),
        }),
      },
    });
  });

  it("does not send duplicate updates for the same code", async () => {
    await import("../scripts/content-script/content-script");

    await Promise.resolve();

    const code = "let x = 42;";
    sendCodeUpdate(code);
    sendCodeUpdate(code);

    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not send updates before parsing is ready, but sends after it resolves", async () => {
    // Create a deferred promise to control when parse resolves
    let resolveParse!: (value: typeof fakeDetails) => void;
    mockParseLeetCodeProblem.mockImplementation(
      () =>
        new Promise<typeof fakeDetails>((res) => {
          resolveParse = res;
        }),
    );

    await import("../scripts/content-script/content-script");

    // Before parse resolves, updates should be ignored
    sendCodeUpdate("a = b + c;");
    expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();

    // Now resolve parse and let microtasks run
    resolveParse(fakeDetails);
    await Promise.resolve();

    // After parse is ready, posting again should send once
    sendCodeUpdate("a = b + c;");
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not send when problem slug is missing", async () => {
    window.history.replaceState({}, "", "/problems/"); // No slug
    await import("../scripts/content-script/content-script");
    await Promise.resolve();

    sendCodeUpdate("let a = 1;");

    expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("ignores non-CODE_UPDATE messages and messages not from window", async () => {
    await import("../scripts/content-script/content-script");

    await Promise.resolve();

    // Non-matching type
    const evt1 = new MessageEvent("message", {
      data: { type: "NOT_CODE_UPDATE", code: "x" },
      source: window as never,
    });
    window.dispatchEvent(evt1);

    // Matching type but wrong source
    const evt2 = new MessageEvent("message", {
      data: { type: "CODE_UPDATE", code: "y" },
      source: null,
    } as never);
    window.dispatchEvent(evt2);

    expect(mockChrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("logs parse errors when parsing problem details fails", async () => {
    const error = new Error("boom");
    mockParseLeetCodeProblem.mockImplementation(() => Promise.reject(error));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await import("../scripts/content-script/content-script");
    // allow the promise rejection to be handled
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to parse LeetCode problem details:",
      error,
    );
    consoleErrorSpy.mockRestore();
  });

  // New test cases for improved coverage
  it("handles title changes through mutation observer", async () => {
    await import("../scripts/content-script/content-script");
    await Promise.resolve();

    // Add title element
    const titleElement = document.createElement("div");
    titleElement.className = "text-title-large";
    titleElement.textContent = "Three Sum";
    document.body.appendChild(titleElement);

    // Simulate mutation
    await new Promise((resolve) => setTimeout(resolve, 250)); // Wait for debounce

    // Should trigger a new problem parse
    expect(mockParseLeetCodeProblem).toHaveBeenCalled();
  });

  it("cleans up properly on page unload", async () => {
    await import("../scripts/content-script/content-script");

    // Add title element to trigger observer
    const titleElement = document.createElement("div");
    titleElement.className = "text-title-large";
    document.body.appendChild(titleElement);

    // Verify observer is working
    titleElement.textContent = "New Problem";
    await new Promise((resolve) => setTimeout(resolve, 250)); // Wait for debounce

    // Trigger beforeunload
    window.dispatchEvent(new Event("beforeunload"));

    // Add new title - should not trigger observer anymore
    titleElement.textContent = "Another Problem";
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Only the first title change should have triggered a parse
    expect(mockParseLeetCodeProblem).toHaveBeenCalledTimes(2); // Initial + first change
  });

  it("handles chat toggle messages from popup", async () => {
    await import("../scripts/content-script/content-script");

    // Get initial state
    const state = mockStore.getState() as RootState;
    expect(state.ui.isChatOpen).toBe(false);

    // Simulate receiving a TOGGLE_CHAT message
    if (mockChrome.runtime.onMessage.addListener.mock.calls[0]) {
      const messageListener =
        mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      await messageListener({ type: "TOGGLE_CHAT" });
    }

    // Verify the UI state was toggled
    const finalState = mockStore.getState() as RootState;
    expect(finalState.ui.isChatOpen).toBe(true);
  });

  it("updates Redux store state through chat toggle action", async () => {
    await import("../scripts/content-script/content-script");

    // Get initial state
    const initialState = mockStore.getState() as RootState;
    expect(initialState.ui.isChatOpen).toBe(false);

    // Dispatch toggle action through store
    mockStore.dispatch({ type: "ui/toggleChat" });

    // Verify state updated
    const updatedState = mockStore.getState() as RootState;
    expect(updatedState.ui.isChatOpen).toBe(true);

    // Toggle back
    mockStore.dispatch({ type: "ui/toggleChat" });
    const finalState = mockStore.getState() as RootState;
    expect(finalState.ui.isChatOpen).toBe(false);
  });

  it("stops observing when navigating away from a problem page", async () => {
    await import("../scripts/content-script/content-script");
    await Promise.resolve();

    // Navigate to a non-problem page
    window.history.replaceState({}, "", "/contest/");

    // Trigger problem change
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Add a title change that should be ignored
    const titleElement = document.createElement("div");
    titleElement.className = "text-title-large";
    titleElement.textContent = "Contest Page";
    document.body.appendChild(titleElement);

    await new Promise((resolve) => setTimeout(resolve, 250));

    // Should not trigger additional parsing
    expect(mockParseLeetCodeProblem).toHaveBeenCalledTimes(1); // Just the initial parse
  });

  it("handles chat toggle messages from popup", async () => {
    await import("../scripts/content-script/content-script");

    // Get initial state
    const state = mockStore.getState() as RootState;
    expect(state.ui.isChatOpen).toBe(false);

    // Simulate receiving a TOGGLE_CHAT message
    if (mockChrome.runtime.onMessage.addListener.mock.calls[0]) {
      const messageListener =
        mockChrome.runtime.onMessage.addListener.mock.calls[0][0];
      await messageListener({ type: "TOGGLE_CHAT" });
    }

    // Verify the UI state was toggled
    const finalState = mockStore.getState() as RootState;
    expect(finalState.ui.isChatOpen).toBe(true);
  });

  it("stops observing when navigating away from a problem page", async () => {
    await import("../scripts/content-script/content-script");
    await Promise.resolve();

    // Navigate to a non-problem page
    window.history.replaceState({}, "", "/contest/");

    // Trigger problem change
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Add a title change that should be ignored
    const titleElement = document.createElement("div");
    titleElement.className = "text-title-large";
    titleElement.textContent = "Contest Page";
    document.body.appendChild(titleElement);

    await new Promise((resolve) => setTimeout(resolve, 250));

    // Should not trigger additional parsing
    expect(mockParseLeetCodeProblem).toHaveBeenCalledTimes(1); // Just the initial parse
  });

  it("updates Redux store state through chat toggle action", async () => {
    await import("../scripts/content-script/content-script");

    // Get initial state
    const initialState = mockStore.getState() as { ui: UIState };
    expect(initialState.ui.isChatOpen).toBe(false);

    // Dispatch toggle action through store
    mockStore.dispatch({ type: "ui/toggleChat" });

    // Verify state updated
    const updatedState = mockStore.getState() as { ui: UIState };
    expect(updatedState.ui.isChatOpen).toBe(true);

    // Toggle back
    mockStore.dispatch({ type: "ui/toggleChat" });
    const finalState = mockStore.getState() as { ui: UIState };
    expect(finalState.ui.isChatOpen).toBe(false);
  });
});
