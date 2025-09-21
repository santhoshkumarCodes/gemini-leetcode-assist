import { parseLeetCodeProblem } from "./parser";

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
