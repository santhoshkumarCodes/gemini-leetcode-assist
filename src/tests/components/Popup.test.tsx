import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore, { MockStore } from "redux-mock-store";
import Popup from "@/pages/popup/Popup";
import { thunk } from "redux-thunk";

// Create a mock store
const mockStore = configureStore([thunk]);

describe("Popup", () => {
  let store: MockStore;

  beforeEach(() => {
    store = mockStore({
      settings: {
        apiKey: "test-api-key",
      },
      chat: {
        messages: [],
        isTyping: false,
      },
    });
  });

  it("renders the correct title", () => {
    render(
      <Provider store={store}>
        <Popup />
      </Provider>,
    );
    const titleElement = screen.getByText(/Gemini LeetCode Assist/i);
    expect(titleElement).toBeInTheDocument();
  });
});
