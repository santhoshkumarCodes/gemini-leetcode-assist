import { GoogleGenerativeAI } from "@google/generative-ai";

export const callGeminiApi = async (apiKey: string, prompt: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
};
