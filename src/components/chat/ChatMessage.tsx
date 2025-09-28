import { FC } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./ChatMessage.css";
import CopyButton from "./CopyButton";

type MessageShape = {
  id?: string;
  text: string;
  sender?: "user" | "bot" | string;
};

type ChatMessageProps =
  | { text: string; isUser: boolean }
  | { message: MessageShape };

const ChatMessage: FC<ChatMessageProps> = (props) => {
  // Support two prop shapes used across code/tests
  const text = "text" in props ? props.text : props.message?.text || "";
  const isUser =
    "isUser" in props ? props.isUser : props.message?.sender === "user";
  if (isUser) {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[85%] rounded-lg px-4 py-2 text-[clamp(12px,2.5cqw,16px)] bg-blue-500 text-white">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-2">
      <div className="text-white max-w-[100%] markdown-container">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeText = String(children).replace(/\n$/, "");
              return match ? (
                <div className="relative">
                  <CopyButton textToCopy={codeText} />
                  <SyntaxHighlighter
                    className="custom-scrollbar"
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ChatMessage;
