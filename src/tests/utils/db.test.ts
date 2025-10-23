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
    it("should add a new chat with timestamp if one does not exist", async () => {
      const mockTimestamp = 1234567890000;
      mockStore.get.mockResolvedValue([]);
      await saveChat(
        "two-sum",
        "chat1",
        [{ id: "msg1", text: "Hello", isUser: true, status: "succeeded" }],
        mockTimestamp,
      );

      expect(mockDb.transaction).toHaveBeenCalledWith("chats", "readwrite");
      expect(mockTx.objectStore).toHaveBeenCalledWith("chats");
      expect(mockStore.get).toHaveBeenCalledWith("two-sum");
      expect(mockStore.put).toHaveBeenCalledWith(
        [
          {
            id: "chat1",
            messages: [
              { id: "msg1", text: "Hello", isUser: true, status: "succeeded" },
            ],
            lastUpdated: mockTimestamp,
          },
        ],
        "two-sum",
      );
    });

    it("should use Date.now() as timestamp if not provided", async () => {
      const mockNow = 9876543210000;
      jest.spyOn(Date, "now").mockImplementation(() => mockNow);

      mockStore.get.mockResolvedValue([]);
      await saveChat("two-sum", "chat1", [
        { id: "msg1", text: "Hello", isUser: true, status: "succeeded" },
      ]);

      expect(mockStore.put).toHaveBeenCalledWith(
        [
          {
            id: "chat1",
            messages: [
              { id: "msg1", text: "Hello", isUser: true, status: "succeeded" },
            ],
            lastUpdated: mockNow,
          },
        ],
        "two-sum",
      );

      jest.restoreAllMocks();
    });

    it("should update an existing chat with new timestamp", async () => {
      const oldTimestamp = 1000000000000;
      const newTimestamp = 2000000000000;

      mockStore.get.mockResolvedValue([
        {
          id: "chat1",
          messages: [
            { id: "msg1", text: "Hello", isUser: true, status: "succeeded" },
          ],
          lastUpdated: oldTimestamp,
        },
      ]);
      await saveChat(
        "two-sum",
        "chat1",
        [
          { id: "msg1", text: "Hello", isUser: true, status: "succeeded" },
          { id: "msg2", text: "World", isUser: false, status: "succeeded" },
        ],
        newTimestamp,
      );

      expect(mockDb.transaction).toHaveBeenCalledWith("chats", "readwrite");
      expect(mockTx.objectStore).toHaveBeenCalledWith("chats");
      expect(mockStore.get).toHaveBeenCalledWith("two-sum");
      expect(mockStore.put).toHaveBeenCalledWith(
        [
          {
            id: "chat1",
            messages: [
              { id: "msg1", text: "Hello", isUser: true, status: "succeeded" },
              { id: "msg2", text: "World", isUser: false, status: "succeeded" },
            ],
            lastUpdated: newTimestamp,
          },
        ],
        "two-sum",
      );
    });

    it("should preserve other chats when updating one", async () => {
      const timestamp1 = 1000000000000;
      const timestamp2 = 2000000000000;
      const newTimestamp = 3000000000000;

      mockStore.get.mockResolvedValue([
        {
          id: "chat1",
          messages: [
            { id: "msg1", text: "Chat 1", isUser: true, status: "succeeded" },
          ],
          lastUpdated: timestamp1,
        },
        {
          id: "chat2",
          messages: [
            { id: "msg2", text: "Chat 2", isUser: true, status: "succeeded" },
          ],
          lastUpdated: timestamp2,
        },
      ]);

      await saveChat(
        "two-sum",
        "chat1",
        [
          { id: "msg1", text: "Chat 1", isUser: true, status: "succeeded" },
          {
            id: "msg3",
            text: "New message",
            isUser: false,
            status: "succeeded",
          },
        ],
        newTimestamp,
      );

      expect(mockStore.put).toHaveBeenCalledWith(
        [
          {
            id: "chat1",
            messages: [
              { id: "msg1", text: "Chat 1", isUser: true, status: "succeeded" },
              {
                id: "msg3",
                text: "New message",
                isUser: false,
                status: "succeeded",
              },
            ],
            lastUpdated: newTimestamp,
          },
          {
            id: "chat2",
            messages: [
              { id: "msg2", text: "Chat 2", isUser: true, status: "succeeded" },
            ],
            lastUpdated: timestamp2, // Unchanged
          },
        ],
        "two-sum",
      );
    });
  });

  describe("loadChats", () => {
    it("should return chats with timestamps for a problem slug", async () => {
      const mockTimestamp = 1234567890000;
      const mockChats = [
        { id: "chat1", messages: [], lastUpdated: mockTimestamp },
      ];
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

    it("should migrate old chats without lastUpdated timestamp", async () => {
      const mockNow = 9876543210000;
      jest.spyOn(Date, "now").mockImplementation(() => mockNow);

      const oldChats = [
        { id: "chat1", messages: [] }, // Missing lastUpdated
        { id: "chat2", messages: [] }, // Missing lastUpdated
      ];
      mockDb.get.mockResolvedValue(oldChats);

      const chats = await loadChats("two-sum");

      expect(chats).toEqual([
        { id: "chat1", messages: [], lastUpdated: mockNow },
        { id: "chat2", messages: [], lastUpdated: mockNow },
      ]);

      jest.restoreAllMocks();
    });

    it("should preserve existing lastUpdated timestamps", async () => {
      const timestamp1 = 1000000000000;
      const timestamp2 = 2000000000000;

      const chatsWithTimestamps = [
        { id: "chat1", messages: [], lastUpdated: timestamp1 },
        { id: "chat2", messages: [], lastUpdated: timestamp2 },
      ];
      mockDb.get.mockResolvedValue(chatsWithTimestamps);

      const chats = await loadChats("two-sum");

      expect(chats).toEqual(chatsWithTimestamps);
    });

    it("should handle mixed chats (some with, some without timestamps)", async () => {
      const mockNow = 9876543210000;
      jest.spyOn(Date, "now").mockImplementation(() => mockNow);

      const existingTimestamp = 1000000000000;
      const mixedChats = [
        { id: "chat1", messages: [], lastUpdated: existingTimestamp },
        { id: "chat2", messages: [] }, // Missing lastUpdated
      ];
      mockDb.get.mockResolvedValue(mixedChats);

      const chats = await loadChats("two-sum");

      expect(chats).toEqual([
        { id: "chat1", messages: [], lastUpdated: existingTimestamp },
        { id: "chat2", messages: [], lastUpdated: mockNow },
      ]);

      jest.restoreAllMocks();
    });
  });
});
