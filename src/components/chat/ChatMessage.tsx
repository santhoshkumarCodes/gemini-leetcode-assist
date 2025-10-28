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
  | {
      text: string;
      isUser: boolean;
      status?: "sending" | "succeeded" | "failed" | "streaming";
    }
  | {
      message: MessageShape & {
        status?: "sending" | "succeeded" | "failed" | "streaming";
      };
    };

const ChatMessage: FC<ChatMessageProps> = (props) => {
  // Support two prop shapes used across code/tests
  const text = "text" in props ? props.text : props.message?.text || "";
  const isUser =
    "isUser" in props ? props.isUser : props.message?.sender === "user";
  const status =
    "status" in props
      ? props.status
      : "message" in props
        ? props.message?.status
        : undefined;

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 user-message items-center">
        {status === "failed" && (
          <span className="text-xs text-red-500 mr-2">Failed</span>
        )}
        <div
          className={`max-w-[85%] rounded-lg px-4 py-2 text-[clamp(12px,2.5cqw,16px)] text-white ${status === "sending" ? "opacity-70" : ""}`}
          style={{ backgroundColor: "rgba(25, 74, 151, 0.45)" }}
        >
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 bot-message">
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
