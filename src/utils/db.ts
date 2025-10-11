import { openDB, DBSchema } from "idb";
import { Chat } from "../state/slices/chatSlice";

interface LeetCodeAssistantDB extends DBSchema {
  chats: {
    key: string;
    value: Chat[];
  };
}

let dbPromise: Promise<import('idb').IDBPDatabase<LeetCodeAssistantDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<LeetCodeAssistantDB>("leetcode-assistant", 1, {
      upgrade(db) {
        db.createObjectStore("chats");
      },
    });
  }
  return dbPromise;
};

export const saveChat = async (
  problemSlug: string,
  chatId: string,
  messages: Chat["messages"],
) => {
  const db = await getDB();
  const allChatsForProblem = (await db.get("chats", problemSlug)) || [];
  const chatIndex = allChatsForProblem.findIndex((chat) => chat.id === chatId);

  if (chatIndex > -1) {
    allChatsForProblem[chatIndex].messages = messages;
  } else {
    allChatsForProblem.push({ id: chatId, messages });
  }

  await db.put("chats", allChatsForProblem, problemSlug);
};

export const loadChats = async (problemSlug: string): Promise<Chat[]> => {
  const db = await getDB();
  return (await db.get("chats", problemSlug)) || [];
};
