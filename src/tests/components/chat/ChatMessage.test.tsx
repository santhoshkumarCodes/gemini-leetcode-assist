import { render, screen } from "@testing-library/react";
import ChatMessage from "@/components/chat/ChatMessage";

describe("ChatMessage", () => {
  it("renders a user message correctly", () => {
    const { container } = render(
      <ChatMessage text="Hello, world!" isUser={true} />,
    );
    const messageElement = screen.getByText("Hello, world!");
    expect(messageElement).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("user-message", "mb-4");
  });

  it("renders a bot message correctly", () => {
    const { container } = render(
      <ChatMessage text="Hi there!" isUser={false} />,
    );
    const messageElement = screen.getByText("Hi there!");
    expect(messageElement).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bot-message", "mb-4");
  });

  it("renders a code block with a language", () => {
    const code = '```javascript\nconsole.log("hello");\n```';
    render(<ChatMessage text={code} isUser={false} />);
    expect(screen.getByText('console.log("hello");')).toBeInTheDocument();
  });

  it("renders a code block without a language", () => {
    const code = "```\nhello\n```";
    render(<ChatMessage text={code} isUser={false} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders a copy button for code blocks", () => {
    const code = '```javascript\nconsole.log("hello");\n```';
    render(<ChatMessage text={code} isUser={false} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders user message with streaming status", () => {
    render(
      <ChatMessage text="Hello, world!" isUser={true} status="streaming" />,
    );
    const messageElement = screen.getByText("Hello, world!");
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest(".user-message")).toBeInTheDocument();
  });

  it("renders user message with failed status", () => {
    render(<ChatMessage text="Hello, world!" isUser={true} status="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });

  it("renders user message with sending status", () => {
    render(<ChatMessage text="Hello, world!" isUser={true} status="sending" />);
    const messageElement = screen.getByText("Hello, world!");
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveClass("opacity-70");
  });

  it("handles message prop shape with streaming status", () => {
    const message = {
      id: "1",
      text: "Hello from bot",
      sender: "bot" as const,
      status: "streaming" as const,
    };
    render(<ChatMessage message={message} />);
    expect(screen.getByText("Hello from bot")).toBeInTheDocument();
  });

  it("handles message prop shape with user sender and streaming status", () => {
    const message = {
      id: "1",
      text: "Hello from user",
      sender: "user" as const,
      status: "streaming" as const,
    };
    render(<ChatMessage message={message} />);
    expect(screen.getByText("Hello from user")).toBeInTheDocument();
    expect(
      screen.getByText("Hello from user").closest(".user-message"),
    ).toBeInTheDocument();
  });
});
