/**
 * Unit Tests for Realtime Messaging Library
 */
import { sendMessage, deleteMessage, subscribeToMessages, fetchMessageHistory } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(),
        rpc: jest.fn(),
        auth: {
            getSession: jest.fn().mockResolvedValue({
                data: { session: { user: { id: "user-123", app_metadata: { tenant_id: "talenthub" } } } },
                error: null
            })
        },
        channel: jest.fn().mockReturnValue({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis()
        }),
        removeChannel: jest.fn().mockResolvedValue(null)
    }
}));

describe("Realtime Messaging Library", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("sendMessage", () => {
        it("should call supabase insert with correct parameters", async () => {
            const mockInsert = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: { id: "msg-1" }, error: null });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: mockInsert,
                select: mockSelect,
                single: mockSingle
            });

            await sendMessage("match-1", "user-123", "Hello world", "organization");

            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                match_id: "match-1",
                sender_id: "user-123",
                content: "Hello world",
                sender_role: "organization",
                tenant_id: "talenthub"
            }));
        });

        it("should throw error if content is empty", async () => {
            await expect(sendMessage("match-1", "user-123", "   "))
                .rejects.toThrow("Message content cannot be empty");
        });
    });

    describe("deleteMessage", () => {
        it("should call soft_delete_message RPC", async () => {
            (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });

            await deleteMessage("msg-1", "user-123");

            expect(supabase.rpc).toHaveBeenCalledWith("soft_delete_message", {
                message_id: "msg-1",
                user_id: "user-123"
            });
        });
    });

    describe("fetchMessageHistory", () => {
        it("should fetch history with tenant filtering", async () => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: [], error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            await fetchMessageHistory("match-1");

            expect(mockQuery.eq).toHaveBeenCalledWith("match_id", "match-1");
            expect(mockQuery.not).toHaveBeenCalledWith("deleted_by", "cs", "{user-123}");
        });
    });
});
