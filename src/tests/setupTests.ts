import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

if (typeof global.structuredClone === "undefined") {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

// Shared mock of Chrome API for tests
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    getURL: jest.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    onRemoved: {
      addListener: jest.fn(),
    },
  },
};

// Make mockChrome available globally
global.chrome = mockChrome as never;

// Export for explicit imports if needed
export { mockChrome };
