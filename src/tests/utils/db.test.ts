jest.mock("idb");
import { openDB } from "idb";
import { saveChat, loadChats } from "@/utils/db";

// Cast the imported openDB to a mock function
const mockOpenDB = openDB as jest.Mock;

describe("db utils", () => {
  const mockStore = {
    get: jest.fn(),
    put: jest.fn(),
  };

  const mockTx = {
    objectStore: jest.fn().mockReturnValue(mockStore),
    done: Promise.resolve(),
  };

  const mockDb = {
    transaction: jest.fn().mockReturnValue(mockTx),
    get: jest.fn(), // for loadChats
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.get.mockReset();
    mockStore.put.mockReset();
    mockDb.get.mockReset();
    mockDb.transaction.mockClear();
    mockTx.objectStore.mockClear();
    mockOpenDB.mockResolvedValue(mockDb);
  });

  describe("saveChat", () => {
    it("should add a new chat if one does not exist", async () => {
      mockStore.get.mockResolvedValue([]);
      await saveChat("two-sum", "chat1", [
        { id: "msg1", text: "Hello", isUser: true },
      ]);

      expect(mockDb.transaction).toHaveBeenCalledWith("chats", "readwrite");
      expect(mockTx.objectStore).toHaveBeenCalledWith("chats");
      expect(mockStore.get).toHaveBeenCalledWith("two-sum");
      expect(mockStore.put).toHaveBeenCalledWith(
        [
          {
            id: "chat1",
            messages: [{ id: "msg1", text: "Hello", isUser: true }],
          },
        ],
        "two-sum",
      );
    });

    it("should update an existing chat", async () => {
      mockStore.get.mockResolvedValue([
        {
          id: "chat1",
          messages: [{ id: "msg1", text: "Hello", isUser: true }],
        },
      ]);
      await saveChat("two-sum", "chat1", [
        { id: "msg1", text: "Hello", isUser: true },
        { id: "msg2", text: "World", isUser: false },
      ]);

      expect(mockDb.transaction).toHaveBeenCalledWith("chats", "readwrite");
      expect(mockTx.objectStore).toHaveBeenCalledWith("chats");
      expect(mockStore.get).toHaveBeenCalledWith("two-sum");
      expect(mockStore.put).toHaveBeenCalledWith(
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
