import { callGeminiApi } from "@/utils/gemini";
import { Chat } from "@/state/slices/chatSlice";

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

  const apiKey = "test-api-key";
  const modelName = "gemini-pro";
  const chatHistory: Chat["messages"] = [
    { id: "1", text: "Hello", isUser: true },
    { id: "2", text: "Hi there", isUser: false },
  ];
  const problemDetails = '{"title":"Two Sum"}';
  const userCode = 'console.log("hello world")';
  const currentUserMessage = "How do I solve this?";

  it("should return the text response from the API on success", async () => {
    const mockResponse = {
      response: {
        text: () => "Test response",
      },
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await callGeminiApi(
      apiKey,
      modelName,
      chatHistory,
      problemDetails,
      userCode,
      currentUserMessage,
    );
    expect(result).toBe("Test response");
  });

  it("should throw an error for an invalid API key", async () => {
    await expect(
      callGeminiApi(null as any, modelName, chatHistory, problemDetails, userCode, currentUserMessage),
    ).rejects.toThrow("Invalid API key provided.");
  });

  it("should construct the final prompt correctly", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "mock response",
      },
    });
    await callGeminiApi(
      apiKey,
      modelName,
      chatHistory,
      problemDetails,
      userCode,
      currentUserMessage,
    );

    const finalPrompt = mockGenerateContent.mock.calls[0][0];
    expect(finalPrompt).toContain("You are an expert competitive programmer and mentor.");
    expect(finalPrompt).toContain("User: Hello");
    expect(finalPrompt).toContain("Assistant: Hi there");
    expect(finalPrompt).toContain('Problem Details:\n{"title":"Two Sum"}');
    expect(finalPrompt).toContain('User Code:\nconsole.log("hello world")');
    expect(finalPrompt).toContain("User's latest message to respond to:\nHow do I solve this?");
  });

  it("should handle null problemDetails and userCode", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "mock response",
      },
    });
    await callGeminiApi(apiKey, modelName, chatHistory, null, null, currentUserMessage);

    const finalPrompt = mockGenerateContent.mock.calls[0][0];
    expect(finalPrompt).toContain("Problem Details:\nNo problem details provided.");
    expect(finalPrompt).toContain("User Code:\nNo code provided.");
  });

  const errorTestCases = [
    { code: "400", message: "Invalid request. Please check your prompt and try again." },
    { code: "401", message: "Authentication failed. Please check your API key." },
    { code: "403", message: "Permission denied. You do not have permission to call the API." },
    { code: "404", message: "The requested resource was not found." },
    { code: "429", message: "Rate limit exceeded. Please try again later." },
    { code: "500", message: "The service is temporarily unavailable. Please try again later." },
    { code: "503", message: "The service is temporarily unavailable. Please try again later." },
  ];

  errorTestCases.forEach(({ code, message }) => {
    it(`should throw a specific error for a ${code} response`, async () => {
      mockGenerateContent.mockRejectedValue(new Error(`Request failed with status code ${code}`));
      await expect(
        callGeminiApi(
          apiKey,
          modelName,
          chatHistory,
          problemDetails,
          userCode,
          currentUserMessage,
        ),
      ).rejects.toThrow(message);
    });
  });

  it("should throw a generic error for an unexpected error", async () => {
    const errorMessage = "Some other error";
    mockGenerateContent.mockRejectedValue(new Error(errorMessage));
    await expect(
      callGeminiApi(
        apiKey,
        modelName,
        chatHistory,
        problemDetails,
        userCode,
        currentUserMessage,
      ),
    ).rejects.toThrow(`An unexpected error occurred: ${errorMessage}`);
  });
});