import { render, screen } from "@testing-library/react";
import Injection from "@/components/Injection";

describe("Injection", () => {
  it("renders the ChatWindow component", () => {
    render(<Injection />);
    // We expect the chat window to be closed by default
    expect(screen.queryByText("Gemini Assistant")).toBeNull();
  });
});
