import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Calls the Gemini API with the provided API key and prompt.
 *
 * @param {string} apiKey - The API key for the Gemini API.
 * @param {string} prompt - The prompt to send to the Gemini API.
 * @returns {Promise<string>} A promise that resolves with the text response from the API.
 * @throws {Error} Throws an error if the API key or prompt is invalid, or if the API call fails.
 */
export const callGeminiApi = async (
  apiKey: string,
  prompt: string,
  modelName: string,
): Promise<string> => {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Invalid API key provided.");
  }

  if (!prompt || typeof prompt !== "string") {
    throw new Error("Invalid prompt provided.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
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
