import { FC, useRef, useEffect, useState } from "react";
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
import { addMessage, loadChats } from "@/state/slices/chatSlice";
import { nanoid } from "@reduxjs/toolkit";
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
  const { chats, currentChatId, selectedContexts } = useSelector(
    (state: RootState) => state.chat,
  );
  const { apiKey, selectedModel } = useSelector(
    (state: RootState) => state.settings,
  );
  const { isLoading, error } = useSelector((state: RootState) => state.api);
  const { currentProblemSlug } = useSelector(
    (state: RootState) => state.problem,
  );

  useEffect(() => {
    dispatch(loadApiKey());
  }, [dispatch]);

  useEffect(() => {
    if (currentProblemSlug) {
      dispatch(loadChats(currentProblemSlug));
    }
  }, [currentProblemSlug, dispatch]);

  const [problemTitle, setProblemTitle] = useState<string | null>(null);

  useEffect(() => {
    const loadProblemTitle = async () => {
      try {
        if (currentProblemSlug) {
          const key = `leetcode-problem-${currentProblemSlug}`;
          const result = await chrome.storage.local.get(key);
          const problemData = result && result[key];
          if (problemData && problemData.title) {
            // Remove leading numbering like "1. " or "12. " from titles
            const cleaned = String(problemData.title)
              .replace(/^\s*\d+\.\s*/, "")
              .trim();
            setProblemTitle(cleaned);
            return;
          }

          // Fallback: prettify slug into a readable title
          const prettify = (s: string) =>
            s
              .replace(/[_-]+/g, " ")
              .split(" ")
              .filter(Boolean)
              .map((w) => {
                const lower = w.toLowerCase();
                return lower.charAt(0).toUpperCase() + lower.slice(1);
              })
              .join(" ");

          setProblemTitle(prettify(currentProblemSlug));
        }
      } catch (e) {
        console.error("Error loading problem title:", e);
      }
    };

    loadProblemTitle();
  }, [currentProblemSlug]);

  const handleSendMessage = async (text: string) => {
    if (!currentProblemSlug) return;

    dispatch(clearError());
    if (!apiKey) {
      dispatch(setError("API key not set."));
      return;
    }

    const userMessageId = nanoid();
    const chatId = currentChatId || nanoid();

    dispatch(
      addMessage({
        text,
        isUser: true,
        problemSlug: currentProblemSlug,
        messageId: userMessageId,
        chatId,
      }),
    );
    dispatch(setLoading(true));

    try {
      let problemDetails: string | null = null;
      let userCode: string | null = null;

      if (selectedContexts.length > 0 && currentProblemSlug) {
        const key = `leetcode-problem-${currentProblemSlug}`;
        const result = await chrome.storage.local.get(key);
        const problemData = result[key];

        if (problemData) {
          if (selectedContexts.includes("Problem Details")) {
            problemDetails = JSON.stringify({
              title: problemData.title,
              description: problemData.description,
              constraints: problemData.constraints,
              examples: problemData.examples,
            });
          }
          if (selectedContexts.includes("Code")) {
            userCode = problemData.code;
          }
        }
      }

      const currentChat = chats.find((chat) => chat.id === currentChatId);
      const chatHistory = currentChat ? currentChat.messages.slice(-10) : [];

      const response = await callGeminiApi(
        apiKey,
        selectedModel,
        chatHistory,
        problemDetails,
        userCode,
        text,
      );
      const assistantMessageId = nanoid();
      dispatch(
        addMessage({
          text: response,
          isUser: false,
          problemSlug: currentProblemSlug,
          messageId: assistantMessageId,
          chatId,
        }),
      );
    } catch (error) {
      dispatch(setError((error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isChatOpen) {
    return null;
  }

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const messages = currentChat ? currentChat.messages : [];

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
          onResize={(
            _event: React.SyntheticEvent,
            data: { size: { width: number; height: number } },
          ) => {
            dispatch(
              setChatSize({ width: data.size.width, height: data.size.height }),
            );
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
                  aria-label="Minimize"
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
                  aria-label="Close"
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
                          How can I assist you with{" "}
                          {problemTitle
                            ? `${problemTitle} problem`
                            : "this problem"}
                          ?
                        </span>
                      </h1>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <ChatMessage
                          key={msg.id}
                          text={msg.text}
                          isUser={msg.isUser}
                          status={msg.status}
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
