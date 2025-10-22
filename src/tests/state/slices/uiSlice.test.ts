import uiReducer, {
  toggleChat,
  toggleMinimize,
  setChatPosition,
  setChatSize,
  setContextOpen,
  setModelMenuOpen,
  setChatHistoryOpen,
  UIState,
} from "@/state/slices/uiSlice";

const initialState: UIState = {
  isChatOpen: false,
  isChatMinimized: false,
  chatPosition: { x: 50, y: 50 },
  chatSize: { width: 400, height: 600 },
  isContextOpen: false,
  isModelMenuOpen: false,
  isChatHistoryOpen: false,
};

describe("uiSlice", () => {
  it("should return the initial state", () => {
    expect(uiReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should handle toggleChat", () => {
    const actual = uiReducer(initialState, toggleChat());
    expect(actual.isChatOpen).toBe(true);
  });

  it("should handle toggleMinimize", () => {
    const actual = uiReducer(initialState, toggleMinimize());
    expect(actual.isChatMinimized).toBe(true);
  });

  it("should handle setChatPosition", () => {
    const newPosition = { x: 100, y: 100 };
    const actual = uiReducer(initialState, setChatPosition(newPosition));
    expect(actual.chatPosition).toEqual(newPosition);
  });

  it("should handle setChatSize", () => {
    const newSize = { width: 500, height: 700 };
    const actual = uiReducer(initialState, setChatSize(newSize));
    expect(actual.chatSize).toEqual(newSize);
  });

  it("should handle setContextOpen", () => {
    const actual = uiReducer(initialState, setContextOpen(true));
    expect(actual.isContextOpen).toBe(true);
  });

  it("should handle setModelMenuOpen", () => {
    const actual = uiReducer(initialState, setModelMenuOpen(true));
    expect(actual.isModelMenuOpen).toBe(true);
  });

  it("should handle setChatHistoryOpen", () => {
    const actual = uiReducer(initialState, setChatHistoryOpen(true));
    expect(actual.isChatHistoryOpen).toBe(true);
  });

  it("should toggle isChatHistoryOpen", () => {
    const openState = uiReducer(initialState, setChatHistoryOpen(true));
    expect(openState.isChatHistoryOpen).toBe(true);

    const closedState = uiReducer(openState, setChatHistoryOpen(false));
    expect(closedState.isChatHistoryOpen).toBe(false);
  });
});
