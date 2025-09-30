import { render, screen } from "@testing-library/react";
import ChatMessage from "@/components/chat/ChatMessage";

describe("ChatMessage", () => {
  it("renders a user message correctly", () => {
    render(<ChatMessage text="Hello, world!" isUser={true} />);
    const messageElement = screen.getByText("Hello, world!");
    expect(messageElement).toBeInTheDocument();
  });

  it("renders a bot message correctly", () => {
    render(<ChatMessage text="Hi there!" isUser={false} />);
    const messageElement = screen.getByText("Hi there!");
    expect(messageElement).toBeInTheDocument();
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
});
