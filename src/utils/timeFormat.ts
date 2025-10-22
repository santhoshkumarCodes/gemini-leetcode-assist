// Time conversion constants
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;
const DAYS_IN_YEAR = 365;

// Chat title constants
const CHAT_TITLE_MAX_LENGTH = 40;

/**
 * Formats a timestamp to a relative time string (e.g., "2 minutes ago", "5 hours ago")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < SECONDS_IN_MINUTE) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / SECONDS_IN_MINUTE);
  if (diffInMinutes < MINUTES_IN_HOUR) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / MINUTES_IN_HOUR);
  if (diffInHours < HOURS_IN_DAY) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / HOURS_IN_DAY);
  if (diffInDays < DAYS_IN_WEEK) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / DAYS_IN_WEEK);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / DAYS_IN_MONTH);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  const diffInYears = Math.floor(diffInDays / DAYS_IN_YEAR);
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
    // Limit to maximum length for a cleaner look
    return firstUserMessage.text.length > CHAT_TITLE_MAX_LENGTH
      ? firstUserMessage.text.substring(0, CHAT_TITLE_MAX_LENGTH) + "..."
      : firstUserMessage.text;
  }
  return "New Chat";
};
