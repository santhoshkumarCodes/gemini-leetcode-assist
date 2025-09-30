import "@/index.css";
import { parseLeetCodeProblem } from "./parser";
import store from "@/state/store";
import { toggleChat } from "@/state/slices/uiSlice";
import { createRoot } from "react-dom/client";
import Injection from "@/components/Injection";

// --- State Management ---
let problemDetails: Awaited<ReturnType<typeof parseLeetCodeProblem>> | null =
  null;
let lastSentCode: string | null = null;

// --- Function to send combined data to background ---
function sendUnifiedUpdate(code: string) {
  if (!problemDetails || code === lastSentCode) {
    return;
  }

  const problemSlug = window.location.pathname.split("/")[2];
  if (!problemSlug) {
    return;
  }

  const payload = {
    ...problemDetails,
    code,
    timestamp: new Date().toISOString(),
  };

  chrome.runtime.sendMessage({
    type: "PROBLEM_UPDATE",
    payload: {
      problemSlug,
      data: payload,
    },
  });

  lastSentCode = code; // Remember the last code we sent
}

// 1. Inject the script for live code capture
const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected-script.js");
(document.head || document.documentElement).appendChild(script);
script.onload = () => script.remove();

// 2. Listen for live code updates from the injected script
window.addEventListener(
  "message",
  (event) => {
    if (event.source !== window || event.data?.type !== "CODE_UPDATE") {
      return;
    }
    const { code } = event.data;
    sendUnifiedUpdate(code);
  },
  false,
);

// 4. Inject the React component
const root = document.createElement("div");
root.id = "gemini-chat-root";
root.style.position = "fixed";
root.style.top = "0";
root.style.left = "0";
root.style.width = "100vw";
root.style.height = "100vh";
root.style.zIndex = "9999";
root.style.pointerEvents = "none"; // Allow clicks to pass through the container
document.body.appendChild(root);
createRoot(root).render(<Injection />);

// 3. Parse the static problem details from the DOM
parseLeetCodeProblem()
  .then((details) => {
    problemDetails = details;
    // If we have already received code, send the first unified update now
    if (lastSentCode !== null) {
      sendUnifiedUpdate(lastSentCode);
    }
  })
  .catch((error) => {
    console.error("Failed to parse LeetCode problem details:", error);
  });

// 5. Listen for messages from the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_CHAT") {
    store.dispatch(toggleChat());
  }
});
