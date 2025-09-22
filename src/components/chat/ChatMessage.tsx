import { FC } from "react";

interface ChatMessageProps {
  text: string;
  isUser: boolean;
}

const ChatMessage: FC<ChatMessageProps> = ({ text, isUser }) => {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 text-[clamp(12px,2.5cqw,16px)] ${
          isUser ? "bg-blue-500 text-white" : "bg-gray-700 text-white"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;
