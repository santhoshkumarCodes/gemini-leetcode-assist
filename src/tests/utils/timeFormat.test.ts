import { formatRelativeTime, generateChatTitle } from "@/utils/timeFormat";

describe("timeFormat utils", () => {
  let mockNow: number;

  beforeEach(() => {
    mockNow = 1234567890000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("formatRelativeTime", () => {
    it("should return 'just now' for timestamps less than 60 seconds ago", () => {
      expect(formatRelativeTime(mockNow - 30 * 1000)).toBe("just now");
      expect(formatRelativeTime(mockNow - 59 * 1000)).toBe("just now");
      expect(formatRelativeTime(mockNow)).toBe("just now");
    });

    it("should return minutes for timestamps less than 1 hour ago", () => {
      expect(formatRelativeTime(mockNow - 1 * 60 * 1000)).toBe("1 minute ago");
      expect(formatRelativeTime(mockNow - 5 * 60 * 1000)).toBe("5 minutes ago");
      expect(formatRelativeTime(mockNow - 30 * 60 * 1000)).toBe(
        "30 minutes ago",
      );
      expect(formatRelativeTime(mockNow - 59 * 60 * 1000)).toBe(
        "59 minutes ago",
      );
    });

    it("should return hours for timestamps less than 1 day ago", () => {
      expect(formatRelativeTime(mockNow - 1 * 60 * 60 * 1000)).toBe(
        "1 hour ago",
      );
      expect(formatRelativeTime(mockNow - 5 * 60 * 60 * 1000)).toBe(
        "5 hours ago",
      );
      expect(formatRelativeTime(mockNow - 12 * 60 * 60 * 1000)).toBe(
        "12 hours ago",
      );
      expect(formatRelativeTime(mockNow - 23 * 60 * 60 * 1000)).toBe(
        "23 hours ago",
      );
    });

    it("should return days for timestamps less than 1 week ago", () => {
      expect(formatRelativeTime(mockNow - 1 * 24 * 60 * 60 * 1000)).toBe(
        "1 day ago",
      );
      expect(formatRelativeTime(mockNow - 3 * 24 * 60 * 60 * 1000)).toBe(
        "3 days ago",
      );
      expect(formatRelativeTime(mockNow - 6 * 24 * 60 * 60 * 1000)).toBe(
        "6 days ago",
      );
    });

    it("should return weeks for timestamps less than 4 weeks ago", () => {
      expect(formatRelativeTime(mockNow - 7 * 24 * 60 * 60 * 1000)).toBe(
        "1 week ago",
      );
      expect(formatRelativeTime(mockNow - 14 * 24 * 60 * 60 * 1000)).toBe(
        "2 weeks ago",
      );
      expect(formatRelativeTime(mockNow - 21 * 24 * 60 * 60 * 1000)).toBe(
        "3 weeks ago",
      );
    });

    it("should return months for timestamps less than 1 year ago", () => {
      expect(formatRelativeTime(mockNow - 30 * 24 * 60 * 60 * 1000)).toBe(
        "1 month ago",
      );
      expect(formatRelativeTime(mockNow - 60 * 24 * 60 * 60 * 1000)).toBe(
        "2 months ago",
      );
      expect(formatRelativeTime(mockNow - 180 * 24 * 60 * 60 * 1000)).toBe(
        "6 months ago",
      );
      expect(formatRelativeTime(mockNow - 330 * 24 * 60 * 60 * 1000)).toBe(
        "11 months ago",
      );
    });

    it("should return years for timestamps 1 year or more ago", () => {
      expect(formatRelativeTime(mockNow - 365 * 24 * 60 * 60 * 1000)).toBe(
        "1 year ago",
      );
      expect(formatRelativeTime(mockNow - 730 * 24 * 60 * 60 * 1000)).toBe(
        "2 years ago",
      );
      expect(formatRelativeTime(mockNow - 1095 * 24 * 60 * 60 * 1000)).toBe(
        "3 years ago",
      );
    });

    it("should handle edge cases", () => {
      // Exactly 60 seconds
      expect(formatRelativeTime(mockNow - 60 * 1000)).toBe("1 minute ago");

      // Exactly 60 minutes
      expect(formatRelativeTime(mockNow - 60 * 60 * 1000)).toBe("1 hour ago");

      // Exactly 24 hours
      expect(formatRelativeTime(mockNow - 24 * 60 * 60 * 1000)).toBe(
        "1 day ago",
      );
    });
  });

  describe("generateChatTitle", () => {
    it("should return the first user message as title", () => {
      const messages = [
        { text: "Hello world", isUser: true },
        { text: "Hi there", isUser: false },
      ];
      expect(generateChatTitle(messages)).toBe("Hello world");
    });

    it("should truncate long messages to 40 characters", () => {
      const longMessage =
        "This is a very long message that should be truncated because it exceeds forty characters";
      const messages = [{ text: longMessage, isUser: true }];
      expect(generateChatTitle(messages)).toBe(
        "This is a very long message that should ...",
      );
      expect(generateChatTitle(messages).length).toBe(43); // 40 + "..."
    });

    it("should return 'New Chat' for empty messages", () => {
      expect(generateChatTitle([])).toBe("New Chat");
    });

    it("should return 'New Chat' when no user messages exist", () => {
      const messages = [
        { text: "AI response", isUser: false },
        { text: "Another AI response", isUser: false },
      ];
      expect(generateChatTitle(messages)).toBe("New Chat");
    });

    it("should find first user message even if not first in array", () => {
      const messages = [
        { text: "AI response", isUser: false },
        { text: "User question", isUser: true },
        { text: "Another AI response", isUser: false },
      ];
      expect(generateChatTitle(messages)).toBe("User question");
    });

    it("should not truncate messages shorter than 40 characters", () => {
      const shortMessage = "Short message";
      const messages = [{ text: shortMessage, isUser: true }];
      expect(generateChatTitle(messages)).toBe("Short message");
    });

    it("should handle exactly 40 character messages without truncation", () => {
      const exactMessage = "a".repeat(40); // Exactly 40 characters
      const messages = [{ text: exactMessage, isUser: true }];
      expect(generateChatTitle(messages)).toBe(exactMessage);
      expect(generateChatTitle(messages).length).toBe(40);
    });

    it("should handle 41 character messages with truncation", () => {
      const message41 = "a".repeat(41); // Exactly 41 characters
      const messages = [{ text: message41, isUser: true }];
      const result = generateChatTitle(messages);
      expect(result).toBe("a".repeat(40) + "...");
      expect(result.length).toBe(43);
    });
  });
});
