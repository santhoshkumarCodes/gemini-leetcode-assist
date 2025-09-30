import settingsReducer, {
  setApiKey,
  loadApiKey,
  saveApiKey,
  SettingsState,
} from "@/state/slices/settingsSlice";
import { configureStore } from "@reduxjs/toolkit";

const initialState: SettingsState = {
  apiKey: null,
};

describe("settingsSlice", () => {
  beforeAll(() => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
        } as unknown as typeof chrome.storage.local,
      },
    } as unknown as typeof chrome;
  });

  it("should return the initial state", () => {
    expect(settingsReducer(undefined, { type: "unknown" })).toEqual(
      initialState,
    );
  });

  it("should handle setApiKey", () => {
    const apiKey = "test-api-key";
    const actual = settingsReducer(initialState, setApiKey(apiKey));
    expect(actual.apiKey).toBe(apiKey);
  });

  describe("loadApiKey thunk", () => {
    it("should load the api key from chrome storage", async () => {
      const store = configureStore({ reducer: { settings: settingsReducer } });
      (chrome.storage.local.get as jest.Mock).mockResolvedValue({
        apiKey: "test-key",
      });
      await store.dispatch(loadApiKey());
      const state = store.getState().settings;
      expect(state.apiKey).toBe("test-key");
    });
  });

  describe("saveApiKey thunk", () => {
    it("should save the api key to chrome storage", async () => {
      const store = configureStore({ reducer: { settings: settingsReducer } });
      await store.dispatch(saveApiKey("test-key"));
      const state = store.getState().settings;
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        apiKey: "test-key",
      });
      expect(state.apiKey).toBe("test-key");
    });
  });
});
