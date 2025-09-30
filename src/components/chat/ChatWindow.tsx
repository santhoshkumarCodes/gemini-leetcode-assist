import { FC, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { Resizable } from "react-resizable";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/state/store";
import {
  setChatPosition,
  setChatSize,
  toggleChat,
  toggleMinimize,
} from "@/state/slices/uiSlice";
import ChatMessage from "./ChatMessage";
import MessageInput from "./MessageInput";
import { addMessage } from "@/state/slices/chatSlice";
import { setLoading, setError, clearError } from "@/state/slices/apiSlice";
import { callGeminiApi } from "@/utils/gemini";
import { loadApiKey } from "@/state/slices/settingsSlice";
import { X, Minus, Bot, Maximize2 } from "lucide-react";

const ChatWindow: FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const nodeRef = useRef(null);
  const { isChatOpen, isChatMinimized, chatPosition, chatSize } = useSelector(
    (state: RootState) => state.ui,
  );
  const { messages } = useSelector((state: RootState) => state.chat);
  const { apiKey } = useSelector((state: RootState) => state.settings);
  const { isLoading, error } = useSelector((state: RootState) => state.api);

  useEffect(() => {
    dispatch(loadApiKey());
  }, [dispatch]);

  const handleSendMessage = async (text: string) => {
    dispatch(clearError());
    if (!apiKey) {
      dispatch(setError("API key not set."));
      return;
    }
    dispatch(addMessage({ text, isUser: true }));
    dispatch(setLoading(true));
    try {
      const response = await callGeminiApi(apiKey, text);
      dispatch(addMessage({ text: response, isUser: false }));
    } catch (error) {
      dispatch(setError((error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isChatOpen) {
    return null;
  }

  return (
    <div className="isolate">
      <Draggable
        nodeRef={nodeRef}
        handle=".handle"
        position={chatPosition}
        onDrag={(_, data) => {
          dispatch(setChatPosition({ x: data.x, y: data.y }));
        }}
      >
        <Resizable
          width={chatSize.width}
          height={isChatMinimized ? 40 : chatSize.height}
          onResize={(_, { size }) => {
            dispatch(setChatSize({ width: size.width, height: size.height }));
          }}
          minConstraints={isChatMinimized ? [300, 40] : [300, 200]}
          maxConstraints={[800, 1000]}
        >
          <div
            ref={nodeRef}
            className="@container absolute bg-[#1E1E1E]/80 rounded-lg shadow-2xl border border-white/20 flex flex-col pointer-events-auto overflow-hidden glass transform-gpu"
            style={{
              width: chatSize.width,
              height: isChatMinimized ? 40 : chatSize.height,
            }}
          >
            <div
              className="handle flex items-center justify-between w-full h-10 px-4 cursor-move flex-shrink-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(126, 34, 206, 0.8), rgba(59, 130, 246, 0.7), rgba(6, 182, 212, 0.8))",
              }}
            >
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-white/80" />
                <span className="text-sm font-medium text-white/90">
                  Gemini Assistant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch(toggleMinimize())}
                  className="hover:bg-white/20 p-1 rounded"
                >
                  {isChatMinimized ? (
                    <Maximize2 size={16} />
                  ) : (
                    <Minus size={16} />
                  )}
                </button>
                <button
                  onClick={() => dispatch(toggleChat())}
                  className="hover:bg-red-500/50 p-1 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isChatMinimized && (
              <>
                <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                  {messages.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-white">
                      <h2 className="text-xl font-bold">
                        <span
                          style={{
                            background:
                              "linear-gradient(to right, #8b5cf6, #3b82f6, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          Hello, LeetCoder
                        </span>
                      </h2>
                      <h1>
                        <span className="text-white/70">
                          How can I assist you with Two Sum problem?
                        </span>
                      </h1>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => (
                        <ChatMessage
                          key={index}
                          text={msg.text}
                          isUser={msg.isUser}
                        />
                      ))}
                    </>
                  )}

                  {isLoading && <ChatMessage text="..." isUser={false} />}
                  {error && <ChatMessage text={error} isUser={false} />}
                </div>
                <div className="p-2">
                  {apiKey ? (
                    <MessageInput onSendMessage={handleSendMessage} />
                  ) : (
                    <div className="text-center text-xs text-white/60 p-2">
                      Please set your Gemini API key in the extension settings.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Resizable>
      </Draggable>
    </div>
  );
};

export default ChatWindow;
