import apiReducer, {
  setLoading,
  setError,
  clearError,
  ApiState,
} from "@/state/slices/apiSlice";

const initialState: ApiState = {
  isLoading: false,
  error: null,
};

describe("apiSlice", () => {
  it("should return the initial state", () => {
    expect(apiReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  it("should handle setLoading", () => {
    const actual = apiReducer(initialState, setLoading(true));
    expect(actual.isLoading).toBe(true);
  });

  it("should handle setError", () => {
    const error = "Test error";
    const actual = apiReducer(initialState, setError(error));
    expect(actual.error).toBe(error);
  });

  it("should handle clearError", () => {
    const state = { ...initialState, error: "Test error" };
    const actual = apiReducer(state, clearError());
    expect(actual.error).toBeNull();
  });
});
