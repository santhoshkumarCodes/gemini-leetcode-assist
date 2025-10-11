
jest.mock("idb");
import { openDB } from "idb";
import { saveChat, loadChats } from "@/utils/db";

// Cast the imported openDB to a mock function
const mockOpenDB = openDB as jest.Mock;

describe("db utils", () => {
  const mockDb = {
    get: jest.fn(),
    put: jest.fn(),
  };

  beforeEach(() => {
    // Before each test, reset the mocks and resolve openDB with our mock DB
    mockDb.get.mockReset();
    mockDb.put.mockReset();
    mockOpenDB.mockResolvedValue(mockDb);
  });

  describe("saveChat", () => {
    it("should add a new chat if one does not exist", async () => {
      mockDb.get.mockResolvedValue([]);
      await saveChat("two-sum", "chat1", [{ id: "msg1", text: "Hello", isUser: true }]);
      expect(mockDb.put).toHaveBeenCalledWith(
        "chats",
        [{ id: "chat1", messages: [{ id: "msg1", text: "Hello", isUser: true }] }],
        "two-sum",
      );
    });

    it("should update an existing chat", async () => {
      mockDb.get.mockResolvedValue([
        { id: "chat1", messages: [{ id: "msg1", text: "Hello", isUser: true }] },
      ]);
      await saveChat("two-sum", "chat1", [
        { id: "msg1", text: "Hello", isUser: true },
        { id: "msg2", text: "World", isUser: false },
      ]);
      expect(mockDb.put).toHaveBeenCalledWith(
        "chats",
        [
          {
            id: "chat1",
            messages: [
              { id: "msg1", text: "Hello", isUser: true },
              { id: "msg2", text: "World", isUser: false },
            ],
          },
        ],
        "two-sum",
      );
    });
  });

  describe("loadChats", () => {
    it("should return chats for a problem slug", async () => {
      const mockChats = [{ id: "chat1", messages: [] }];
      mockDb.get.mockResolvedValue(mockChats);
      const chats = await loadChats("two-sum");
      expect(chats).toEqual(mockChats);
      expect(mockDb.get).toHaveBeenCalledWith("chats", "two-sum");
    });

    it("should return an empty array if no chats are found", async () => {
      mockDb.get.mockResolvedValue(undefined);
      const chats = await loadChats("two-sum");
      expect(chats).toEqual([]);
    });
  });
});
