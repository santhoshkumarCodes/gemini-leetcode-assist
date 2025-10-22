/**
 * Formats a timestamp to a relative time string (e.g., "2 minutes ago", "5 hours ago")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
};

/**
 * Generates a chat title from the first user message
 * @param messages - Array of chat messages
 * @returns Chat title string
 */
export const generateChatTitle = (
  messages: Array<{ text: string; isUser: boolean }>,
): string => {
  const firstUserMessage = messages.find((msg) => msg.isUser);
  if (firstUserMessage && firstUserMessage.text.trim()) {
    // Limit to 40 characters for a cleaner look
    return firstUserMessage.text.length > 40
      ? firstUserMessage.text.substring(0, 40) + "..."
      : firstUserMessage.text;
  }
  return "New Chat";
};
