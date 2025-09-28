import { FC, useState, useEffect } from "react";
import { ArrowRight, Bot } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

const MessageInput: FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(1);

  useEffect(() => {
    const lineBreaks = message.split("\n").length;
    setRows(Math.min(Math.max(lineBreaks, 2), 6));
  }, [message]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-1 flex flex-col gap-1">
      <textarea
        className="bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none text-sm px-1 pt-1 custom-scrollbar"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Shift+Enter to insert a line break."
        rows={rows}
      />
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border-b-gray-700 rounded-full px-1 py-1">
            <Bot size={16} className="text-purple-400" />
            <span className="text-sm font-medium text-white/80">
              Gemini 2.5 Pro
            </span>
          </div>
        </div>
        <button
          onClick={handleSend}
          className={`p-2 rounded-full ${!message.trim() ? "bg-gray-500 text-gray-800" : "bg-gray-200 text-white"}`}
          disabled={!message.trim()}
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
