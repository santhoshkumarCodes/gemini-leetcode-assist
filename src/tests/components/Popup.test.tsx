import { render, screen } from "@testing-library/react";
import Popup from "@/pages/popup/Popup";

describe("Popup", () => {
  it("renders the correct title", () => {
    render(<Popup />);
    const titleElement = screen.getByText(/Gemini LeetCode Assist/i);
    expect(titleElement).toBeInTheDocument();
  });
});
