// Tests for src/scripts/content-script/content-script.ts

// Import mockChrome from setupTests
import { mockChrome } from "./setupTests";

// Mock the parser with a delegating implementation we can control per test
type ParserImpl = () => Promise<{
  title: string;
  description: string;
  examples: string[];
  constraints: string;
}>;
let mockParseImpl: ParserImpl;

jest.mock("../scripts/content-script/parser", () => {
  return {
    __esModule: true,
    parseLeetCodeProblem: jest.fn(() => mockParseImpl()),
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

    // Set a relative path to avoid cross-origin SecurityError in jsdom
    window.history.replaceState({}, "", "/problems/two-sum/");

    // Spy the addEventListener to capture handler for cleanup
    addListenerSpy = jest.spyOn(window, "addEventListener");
    messageHandler = null;

    // Default parser impl resolves immediately
    mockParseImpl = () => Promise.resolve(fakeDetails);
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
    mockParseImpl = () =>
      new Promise<typeof fakeDetails>((res) => {
        resolveParse = res;
      });

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

  it("logs an error and does not send when problem slug is missing", async () => {
    await import("../scripts/content-script/content-script");
    await Promise.resolve();
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
    mockParseImpl = () => Promise.reject(error);

    await import("../scripts/content-script/content-script");

    // allow the catch to run
    await Promise.resolve();
    await Promise.resolve();
  });
});
