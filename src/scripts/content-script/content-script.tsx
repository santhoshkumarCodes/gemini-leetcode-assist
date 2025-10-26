import "@/index.css";
import { parseLeetCodeProblem } from "./parser";
import store from "@/state/store";
import { toggleChat } from "@/state/slices/uiSlice";
import { createRoot } from "react-dom/client";
import Injection from "@/components/Injection";
import { setProblemSlug } from "@/state/slices/problemSlice";

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
function handleProblemChange() {
  const pathSegments = window.location.pathname.split("/");
  // Expected URL: /problems/<slug>/...
  if (pathSegments.length > 2 && pathSegments[1] === "problems") {
    const problemSlug = pathSegments[2];
    parseLeetCodeProblem()
      .then((details) => {
        // Check if it's a new problem
        if (details.title !== problemDetails?.title) {
          store.dispatch(setProblemSlug(problemSlug));
          problemDetails = details;

          // If we have already received code, send the first unified update
          if (lastSentCode !== null) {
            sendUnifiedUpdate(lastSentCode);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to parse LeetCode problem details:", error);
        // On failure, clear the slug to avoid inconsistent state
        store.dispatch(setProblemSlug(null));
      });
  } else {
    // Not on a problem page, or URL format is unexpected
    if (problemDetails !== null) {
      problemDetails = null;
      store.dispatch(setProblemSlug(null));
    }
  }
}

// Initial parse
handleProblemChange();

// --- Observe for problem changes (client-side navigation) ---
let debounceTimer: number | null = null;
let lastSeenTitle: string | null = null;
const observer = new MutationObserver(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = window.setTimeout(() => {
    const titleElement = document.querySelector(".text-title-large");
    const currentTitle = titleElement?.textContent;
    if (
      currentTitle &&
      currentTitle !== problemDetails?.title &&
      currentTitle !== lastSeenTitle
    ) {
      lastSeenTitle = currentTitle;
      handleProblemChange();
    }
  }, 200);
});

// Start observing the body for subtree modifications
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// 5. Listen for messages from the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_CHAT") {
    store.dispatch(toggleChat());
  }
});

// 6. Cleanup on unload
window.addEventListener("beforeunload", () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  observer.disconnect();
});
