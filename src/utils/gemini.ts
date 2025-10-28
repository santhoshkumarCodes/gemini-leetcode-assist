import { GoogleGenerativeAI } from "@google/generative-ai";
import { Chat } from "../state/slices/chatSlice";

/**
 * Calls the Gemini API with a structured prompt and returns a streaming response.
 *
 * @param apiKey - The API key for the Gemini API.
 * @param modelName - The name of the Gemini model to use.
 * @param chatHistory - The recent chat history.
 * @param problemDetails - The details of the LeetCode problem.
 * @param userCode - The user's code.
 * @param currentUserMessage - The user's latest message.
 * @returns An async generator that yields text chunks as they are generated.
 */
export const callGeminiApi = async function* (
  apiKey: string,
  modelName: string,
  chatHistory: Chat["messages"],
  problemDetails: string | null,
  userCode: string | null,
  currentUserMessage: string,
): AsyncGenerator<string, void, unknown> {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Invalid API key provided.");
  }

  const systemPrompt = `
You are an expert competitive programmer and mentor.
Adapt your style dynamically based on how the user interacts:

- If the user shares code, act as a debugging assistant.
- If they ask about a problem, act as a teacher and explain clearly.
- If they express emotions (e.g., frustration, excitement), respond empathetically and motivate them.
- If they are brainstorming casually, be a friendly coding buddy.

When context is provided (like problem details or code), use it only if it is relevant to the user's current message.
- If the user asks something that requires context (e.g., questions about their code or a problem) but no context was provided, ask them politely to click on \`Add Context\` and select the context (problem details or code) that is missing in the user's input.
- If the user's message is unrelated to the provided context (for example, a greeting or a casual question), ignore the context and respond naturally to their message alone.

Always keep responses concise, structured, and practical for competitive programming.
`;

  const conversationHistory = chatHistory
    .map((m) => `${m.isUser ? "User" : "Assistant"}: ${m.text}`)
    .join("\n");

  const contextBlock = `
Problem Details:
${problemDetails || "No problem details provided."}

User Code:
${userCode || "No code provided."}
`;

  const finalPrompt = `
${systemPrompt}

Conversation so far:
${conversationHistory}

Current context:
${contextBlock}

User's latest message to respond to:
${currentUserMessage}
`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContentStream(finalPrompt);

    for await (const chunk of result.stream) {
      if (chunk && chunk.text) {
        // Check if chunk exists and has text method
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    }
  } catch (e) {
    const error = e as Error;
    if (error.message.includes("400")) {
      throw new Error(
        "Invalid request. Please check your prompt and try again.",
      );
    } else if (error.message.includes("401")) {
      throw new Error("Authentication failed. Please check your API key.");
    } else if (error.message.includes("403")) {
      throw new Error(
        "Permission denied. You do not have permission to call the API.",
      );
    } else if (error.message.includes("404")) {
      throw new Error("The requested resource was not found.");
    } else if (error.message.includes("429")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    } else if (error.message.includes("500") || error.message.includes("503")) {
      throw new Error(
        "The service is temporarily unavailable. Please try again later.",
      );
    } else {
      throw new Error(`An unexpected error occurred: ${error.message}`);
    }
  }
};
