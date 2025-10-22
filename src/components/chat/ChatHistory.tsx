import { FC } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/state/store";
import { setCurrentChat, Chat } from "@/state/slices/chatSlice";
import { setChatHistoryOpen } from "@/state/slices/uiSlice";
import { formatRelativeTime, generateChatTitle } from "@/utils/timeFormat";

const ChatHistory: FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { chats, currentChatId } = useSelector(
    (state: RootState) => state.chat,
  );
  const { isChatHistoryOpen } = useSelector((state: RootState) => state.ui);

  if (!isChatHistoryOpen) return null;

  const handleSelectChat = (chatId: string) => {
    dispatch(setCurrentChat(chatId));
    dispatch(setChatHistoryOpen(false));
  };

  // Sort chats by lastUpdated (most recent first)
  const sortedChats = [...chats].sort((a, b) => b.lastUpdated - a.lastUpdated);

  return (
    <div className="absolute top-10 left-0 right-0 bg-[#1E1E1E]/98 max-h-[350px] overflow-y-auto custom-scrollbar z-50 shadow-xl">
      <div className="py-1">
        {chats.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-6">
            No chat history yet
          </div>
        ) : (
          <div>
            {sortedChats.map((chat: Chat) => {
              const isActive = currentChatId === chat.id;
              const title = generateChatTitle(chat.messages);
              const timeAgo = formatRelativeTime(chat.lastUpdated);

              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`w-full text-left px-4 py-2 transition-colors ${
                    isActive ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span
                      className={`text-xs truncate ${
                        isActive ? "text-gray-300" : "text-gray-400"
                      }`}
                    >
                      {title}
                    </span>
                    <span className="text-[10px] text-blue-400 whitespace-nowrap flex-shrink-0">
                      {timeAgo}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
