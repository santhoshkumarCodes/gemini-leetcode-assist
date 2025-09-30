import { callGeminiApi } from "@/utils/gemini";

// Mock the GoogleGenerativeAI library
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe("callGeminiApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the text response from the API on success", async () => {
    const mockResponse = {
      response: {
        text: () => "Test response",
      },
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await callGeminiApi("test-api-key", "test-prompt");
    expect(result).toBe("Test response");
  });

  it("should throw an error for an invalid API key", async () => {
    await expect(callGeminiApi(null, "test-prompt")).rejects.toThrow(
      "Invalid API key provided.",
    );
  });

  it("should throw an error for an invalid prompt", async () => {
    await expect(callGeminiApi("test-api-key", null)).rejects.toThrow(
      "Invalid prompt provided.",
    );
  });

  it("should throw a specific error for a 400 response", async () => {
    mockGenerateContent.mockRejectedValue(new Error("400 Bad Request"));
    await expect(callGeminiApi("test-api-key", "test-prompt")).rejects.toThrow(
      "Invalid request. Please check your prompt and try again.",
    );
  });

  it("should throw a specific error for a 401 response", async () => {
    mockGenerateContent.mockRejectedValue(new Error("401 Unauthorized"));
    await expect(callGeminiApi("test-api-key", "test-prompt")).rejects.toThrow(
      "Authentication failed. Please check your API key.",
    );
  });

  it("should throw a specific error for a 403 response", async () => {
    mockGenerateContent.mockRejectedValue(new Error("403 Forbidden"));
    await expect(callGeminiApi("test-api-key", "test-prompt")).rejects.toThrow(
      "Permission denied. You do not have permission to call the API.",
    );
  });

  it("should throw a specific error for a 404 response", async () => {
    mockGenerateContent.mockRejectedValue(new Error("404 Not Found"));
    await expect(callGeminiApi("test-api-key", "test-prompt")).rejects.toThrow(
      "The requested resource was not found.",
    );
  });

  it("should throw a specific error for a 429 response", async () => {
    mockGenerateContent.mockRejectedValue(new Error("429 Too Many Requests"));
    await expect(callGeminiApi("test-api-key", "test-prompt")).rejects.toThrow(
      "Rate limit exceeded. Please try again later.",
    );
  });

  it("should throw a specific error for a 500 response", async () => {
    mockGenerateContent.mockRejectedValue(
      new Error("500 Internal Server Error"),
    );
    await expect(callGeminiApi("test-api-key", "test-prompt")).rejects.toThrow(
      "The service is temporarily unavailable. Please try again later.",
    );
  });

  it("should throw a specific error for a 503 response", async () => {
    mockGenerateContent.mockRejectedValue(new Error("503 Service Unavailable"));
    await expect(callGeminiApi("test-api-key", "test-prompt")).rejects.toThrow(
      "The service is temporarily unavailable. Please try again later.",
    );
  });

  it("should throw a generic error for an unexpected error", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Some other error"));
    await expect(callGeminiApi("test-api-key", "test-prompt")).rejects.toThrow(
      "An unexpected error occurred: Some other error",
    );
  });
});
