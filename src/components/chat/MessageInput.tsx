import { FC, useState } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

const MessageInput: FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="flex items-center p-4">
      <input
        type="text"
        className="flex-grow rounded-full bg-gray-800 text-white px-4 py-2 focus:outline-none text-[clamp(12px,2.5cqw,16px)]"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSend();
          }
        }}
      />
      <button onClick={handleSend} className="ml-4">
        <Send className="text-white" />
      </button>
    </div>
  );
};

export default MessageInput;
