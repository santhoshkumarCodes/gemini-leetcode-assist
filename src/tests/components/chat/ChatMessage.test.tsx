import { render, screen } from "@testing-library/react";
import ChatMessage from "@/components/chat/ChatMessage";

describe("ChatMessage", () => {
  it("renders a user message correctly", () => {
    const message = {
      id: "1",
      text: "Hello, world!",
      sender: "user" as const,
    };
    render(<ChatMessage message={message} />);
    const messageElement = screen.getByText("Hello, world!");
    expect(messageElement).toBeInTheDocument();
  });

  it("renders a bot message correctly", () => {
    const message = {
      id: "2",
      text: "Hi there!",
      sender: "bot" as const,
    };
    render(<ChatMessage message={message} />);
    const messageElement = screen.getByText("Hi there!");
    expect(messageElement).toBeInTheDocument();
  });
});
