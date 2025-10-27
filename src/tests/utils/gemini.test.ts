import { callGeminiApi } from "@/utils/gemini";
import { Chat } from "@/state/slices/chatSlice";

// Mock the GoogleGenerativeAI library
const mockGenerateContentStream = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContentStream: mockGenerateContentStream,
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
    { id: "1", text: "Hello", isUser: true, status: "succeeded" },
    { id: "2", text: "Hi there", isUser: false, status: "succeeded" },
  ];
  const problemDetails = '{"title":"Two Sum"}';
  const userCode = 'console.log("hello world")';
  const currentUserMessage = "How do I solve this?";

  it("should yield text chunks from the streaming API on success", async () => {
    const mockChunks = [{ text: () => "Test " }, { text: () => "response" }];
    const mockStream = {
      stream: (async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      })(),
    };
    mockGenerateContentStream.mockResolvedValue(mockStream);

    const generator = callGeminiApi(
      apiKey,
      modelName,
      chatHistory,
      problemDetails,
      userCode,
      currentUserMessage,
    );

    const chunks = [];
    for await (const chunk of generator) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Test ", "response"]);
  });

  it("should throw an error for an invalid API key", async () => {
    const generator = callGeminiApi(
      "" as string,
      modelName,
      chatHistory,
      problemDetails,
      userCode,
      currentUserMessage,
    );

    await expect(generator.next()).rejects.toThrow("Invalid API key provided.");
  });

  it("should construct the final prompt correctly", async () => {
    const mockStream = {
      stream: (async function* () {
        yield { text: () => "mock response" };
      })(),
    };
    mockGenerateContentStream.mockResolvedValue(mockStream);

    const generator = callGeminiApi(
      apiKey,
      modelName,
      chatHistory,
      problemDetails,
      userCode,
      currentUserMessage,
    );

    await generator.next();

    const finalPrompt = mockGenerateContentStream.mock.calls[0][0];
    expect(finalPrompt).toContain(
      "You are an expert competitive programmer and mentor.",
    );
    expect(finalPrompt).toContain("User: Hello");
    expect(finalPrompt).toContain("Assistant: Hi there");
    expect(finalPrompt).toContain('Problem Details:\n{"title":"Two Sum"}');
    expect(finalPrompt).toContain('User Code:\nconsole.log("hello world")');
    expect(finalPrompt).toContain(
      "User's latest message to respond to:\nHow do I solve this?",
    );
  });

  it("should handle null problemDetails and userCode", async () => {
    const mockStream = {
      stream: (async function* () {
        yield { text: () => "mock response" };
      })(),
    };
    mockGenerateContentStream.mockResolvedValue(mockStream);

    const generator = callGeminiApi(
      apiKey,
      modelName,
      chatHistory,
      null,
      null,
      currentUserMessage,
    );

    await generator.next();

    const finalPrompt = mockGenerateContentStream.mock.calls[0][0];
    expect(finalPrompt).toContain(
      "Problem Details:\nNo problem details provided.",
    );
    expect(finalPrompt).toContain("User Code:\nNo code provided.");
  });

  const errorTestCases = [
    {
      code: "400",
      message: "Invalid request. Please check your prompt and try again.",
    },
    {
      code: "401",
      message: "Authentication failed. Please check your API key.",
    },
    {
      code: "403",
      message: "Permission denied. You do not have permission to call the API.",
    },
    { code: "404", message: "The requested resource was not found." },
    { code: "429", message: "Rate limit exceeded. Please try again later." },
    {
      code: "500",
      message:
        "The service is temporarily unavailable. Please try again later.",
    },
    {
      code: "503",
      message:
        "The service is temporarily unavailable. Please try again later.",
    },
  ];

  errorTestCases.forEach(({ code, message }) => {
    it(`should throw a specific error for a ${code} response`, async () => {
      mockGenerateContentStream.mockRejectedValue(
        new Error(`Request failed with status code ${code}`),
      );

      const generator = callGeminiApi(
        apiKey,
        modelName,
        chatHistory,
        problemDetails,
        userCode,
        currentUserMessage,
      );

      await expect(generator.next()).rejects.toThrow(message);
    });
  });

  it("should throw a generic error for an unexpected error", async () => {
    const errorMessage = "Some other error";
    mockGenerateContentStream.mockRejectedValue(new Error(errorMessage));

    const generator = callGeminiApi(
      apiKey,
      modelName,
      chatHistory,
      problemDetails,
      userCode,
      currentUserMessage,
    );

    await expect(generator.next()).rejects.toThrow(
      `An unexpected error occurred: ${errorMessage}`,
    );
  });

  it("should handle empty chunks from the streaming API", async () => {
    const mockChunks = [
      { text: () => "" },
      { text: () => "Valid text" },
      { text: () => "" },
    ];
    const mockStream = {
      stream: (async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      })(),
    };
    mockGenerateContentStream.mockResolvedValue(mockStream);

    const generator = callGeminiApi(
      apiKey,
      modelName,
      chatHistory,
      problemDetails,
      userCode,
      currentUserMessage,
    );

    const chunks = [];
    for await (const chunk of generator) {
      chunks.push(chunk);
    }

    // Should only yield non-empty chunks
    expect(chunks).toEqual(["Valid text"]);
  });

  it("should handle null API key", async () => {
    const generator = callGeminiApi(
      null as unknown as string,
      modelName,
      chatHistory,
      problemDetails,
      userCode,
      currentUserMessage,
    );

    await expect(generator.next()).rejects.toThrow("Invalid API key provided.");
  });

  it("should handle empty chat history", async () => {
    const mockStream = {
      stream: (async function* () {
        yield { text: () => "response" };
      })(),
    };
    mockGenerateContentStream.mockResolvedValue(mockStream);

    const generator = callGeminiApi(
      apiKey,
      modelName,
      [],
      problemDetails,
      userCode,
      currentUserMessage,
    );

    const chunks = [];
    for await (const chunk of generator) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["response"]);

    const finalPrompt = mockGenerateContentStream.mock.calls[0][0];
    // Should not contain any chat history
    expect(finalPrompt).not.toContain("User: ");
    expect(finalPrompt).not.toContain("Assistant: ");
  });
});
