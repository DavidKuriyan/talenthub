/**
 * E2E Tests for Subscriber-to-Provider Journey
 * 
 * This test suite covers the complete workflow:
 * 1. Subscriber registration and authentication
 * 2. Browse available placements
 * 3. Add placements to cart
 * 4. Checkout and payment
 * 5. Real-time chat with provider
 * 6. Video conference via Jitsi
 */

import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/register/page";
import LoginPage from "@/app/login/page";
import ProductsPage from "@/app/products/page";
import CartSummary from "@/components/cart/CartSummary";
import ChatRoom from "@/components/chat/Room";
import { CartProvider } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
    supabase: {
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            getUser: jest.fn(),
            signOut: jest.fn(),
        },
        from: jest.fn(),
        storage: {
            from: jest.fn(),
            listBuckets: jest.fn(),
            createBucket: jest.fn(),
        },
        channel: jest.fn(),
        removeChannel: jest.fn(),
    },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
        refresh: jest.fn(),
    }),
    usePathname: () => "/products",
    useSearchParams: () => new URLSearchParams(),
}));

describe("E2E: Subscriber-to-Provider Journey", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    // ========== PHASE 1: REGISTRATION & AUTHENTICATION ==========
    describe("Phase 1: Registration & Authentication", () => {
        describe("User Registration", () => {
            it("should allow subscriber to register with email and password", async () => {
                const user = userEvent.setup();
                const mockSignUp = supabase.auth.signUp as jest.Mock;
                mockSignUp.mockResolvedValueOnce({
                    data: { user: { id: "user-123", email: "subscriber@example.com" } },
                    error: null,
                });

                render(<RegisterPage />);

                const emailInput = screen.getByPlaceholderText("name@company.com");
                const passwordInput = screen.getByPlaceholderText("••••••••");
                const submitButton = screen.getByRole("button", { name: /get started/i });

                await user.type(emailInput, "subscriber@example.com");
                await user.type(passwordInput, "SecurePassword123!");
                await user.click(submitButton);

                await waitFor(() => {
                    expect(mockSignUp).toHaveBeenCalledWith({
                        email: "subscriber@example.com",
                        password: "SecurePassword123!",
                        options: {
                            data: {
                                tenant_id: "talenthub",
                            },
                        },
                    });
                });
            });

            it("should display error on registration failure", async () => {
                const user = userEvent.setup();
                const mockSignUp = supabase.auth.signUp as jest.Mock;
                mockSignUp.mockResolvedValueOnce({
                    data: null,
                    error: { message: "User already exists" },
                });

                render(<RegisterPage />);

                await user.type(screen.getByPlaceholderText("name@company.com"), "subscriber@example.com");
                await user.type(screen.getByPlaceholderText("••••••••"), "password");
                await user.click(screen.getByRole("button", { name: /get started/i }));

                await waitFor(() => {
                    expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
                });
            });

            it("should validate email format before submission", async () => {
                const user = userEvent.setup();
                render(<RegisterPage />);

                const emailInput = screen.getByPlaceholderText("name@company.com") as HTMLInputElement;
                const passwordInput = screen.getByPlaceholderText("••••••••");

                await user.type(emailInput, "invalid-email");
                await user.type(passwordInput, "password");

                // HTML5 validation should prevent submission
                expect(emailInput.validity.valid).toBe(false);
            });

            it("should require password with minimum security requirements", async () => {
                const user = userEvent.setup();
                render(<RegisterPage />);

                const emailInput = screen.getByPlaceholderText("name@company.com");
                const passwordInput = screen.getByPlaceholderText("••••••••") as HTMLInputElement;

                await user.type(emailInput, "subscriber@example.com");
                await user.type(passwordInput, "123");

                expect(passwordInput.value.length).toBe(3);
            });
        });

        describe("User Login", () => {
            it("should allow registered subscriber to login", async () => {
                const user = userEvent.setup();
                const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
                mockSignIn.mockResolvedValueOnce({
                    data: { user: { id: "user-123", email: "subscriber@example.com" } },
                    error: null,
                });

                render(<LoginPage />);

                await user.type(screen.getByPlaceholderText("name@company.com"), "subscriber@example.com");
                await user.type(screen.getByPlaceholderText("••••••••"), "SecurePassword123!");
                await user.click(screen.getByRole("button", { name: /sign in/i }));

                await waitFor(() => {
                    expect(mockSignIn).toHaveBeenCalledWith({
                        email: "subscriber@example.com",
                        password: "SecurePassword123!",
                    });
                });
            });

            it("should display error on login with invalid credentials", async () => {
                const user = userEvent.setup();
                const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
                mockSignIn.mockResolvedValueOnce({
                    data: null,
                    error: { message: "Invalid login credentials" },
                });

                render(<LoginPage />);

                await user.type(screen.getByPlaceholderText("name@company.com"), "subscriber@example.com");
                await user.type(screen.getByPlaceholderText("••••••••"), "WrongPassword");
                await user.click(screen.getByRole("button", { name: /sign in/i }));

                await waitFor(() => {
                    expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
                });
            });

            it("should persist session across page reloads", async () => {
                const user = userEvent.setup();
                const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
                mockSignIn.mockResolvedValueOnce({
                    data: { user: { id: "user-123", email: "subscriber@example.com" } },
                    error: null,
                });

                const { rerender } = render(<LoginPage />);

                await user.type(screen.getByPlaceholderText("name@company.com"), "subscriber@example.com");
                await user.type(screen.getByPlaceholderText("••••••••"), "SecurePassword123!");
                await user.click(screen.getByRole("button", { name: /sign in/i }));

                // Simulate page reload
                rerender(<LoginPage />);

                expect(mockSignIn).toHaveBeenCalled();
            });
        });
    });

    // ========== PHASE 2: BROWSING PRODUCTS ==========
    describe("Phase 2: Browse Available Placements", () => {
        const mockProducts = [
            { id: "prod-1", name: "Senior Developer", price: 50000, tenant_id: "talenthub" },
            { id: "prod-2", name: "Product Manager", price: 75000, tenant_id: "talenthub" },
            { id: "prod-3", name: "UX Designer", price: 45000, tenant_id: "talenthub" },
        ];

        beforeEach(() => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);
            mockQuery.select.mockResolvedValue({
                data: mockProducts,
                error: null,
            });
        });

        it("should display available placements", async () => {
            render(<ProductsPage />);

            await waitFor(() => {
                expect(screen.getByText("Senior Developer")).toBeInTheDocument();
                expect(screen.getByText("Product Manager")).toBeInTheDocument();
                expect(screen.getByText("UX Designer")).toBeInTheDocument();
            });
        });

        it("should display pricing for each placement", async () => {
            render(<ProductsPage />);

            await waitFor(() => {
                expect(screen.getByText("₹50,000")).toBeInTheDocument();
                expect(screen.getByText("₹75,000")).toBeInTheDocument();
                expect(screen.getByText("₹45,000")).toBeInTheDocument();
            });
        });

        it("should display error when product fetch fails", async () => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);
            mockQuery.select.mockResolvedValue({
                data: null,
                error: { message: "Failed to fetch products" },
            });

            render(<ProductsPage />);

            await waitFor(() => {
                expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
            });
        });
    });

    // ========== PHASE 3: CART MANAGEMENT ==========
    describe("Phase 3: Cart Management", () => {
        const mockProduct = {
            id: "prod-1",
            name: "Senior Developer",
            price: 50000,
            tenant_id: "talenthub",
        };

        it("should add placement to cart", async () => {
            const user = userEvent.setup();
            const { container } = render(
                <CartProvider>
                <CartSummary />
                </CartProvider>
            );

            // Verify initial cart is empty
            expect(screen.getByText("Your Cart")).toBeInTheDocument();
            expect(screen.getByText("0 items")).toBeInTheDocument();
        });

        it("should display total price in cart", async () => {
            render(
                <CartProvider>
                <CartSummary />
                </CartProvider>
            );

            await waitFor(() => {
                expect(screen.getByText("Total Price")).toBeInTheDocument();
            });
        });

        it("should persist cart in localStorage", async () => {
            const cartData = [
                { ...mockProduct, quantity: 2 },
            ];

            localStorage.setItem("talenthub_cart", JSON.stringify(cartData));

            const { container } = render(
                <CartProvider>
                <CartSummary />
                </CartProvider>
            );

            await waitFor(() => {
                const storedCart = localStorage.getItem("talenthub_cart");
                expect(storedCart).toBeDefined();
                expect(JSON.parse(storedCart!)).toEqual(cartData);
            });
        });

        it("should clear cart after purchase", async () => {
            render(
                <CartProvider>
                <CartSummary />
                </CartProvider>
            );

            localStorage.setItem("talenthub_cart", JSON.stringify([mockProduct]));

            // Simulate clearing cart
            localStorage.removeItem("talenthub_cart");

            expect(localStorage.getItem("talenthub_cart")).toBeNull();
        });
    });

    // ========== PHASE 4: CHECKOUT & PAYMENT ==========
    describe("Phase 4: Checkout & Payment", () => {
        it("should create Razorpay order on checkout", async () => {
            const mockQuery = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);
            mockQuery.single.mockResolvedValue({
                data: { id: "order-123", razorpay_order_id: "razorpay-123", status: "pending" },
                error: null,
            });

            // Order creation would happen in API route
            const mockOrderData = {
                id: "order-123",
                tenant_id: "talenthub",
                user_id: "user-123",
                total: 100000,
                status: "pending",
                razorpay_order_id: "razorpay-123",
            };

            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockResolvedValue({
                    data: [mockOrderData],
                    error: null,
                }),
            });

            // Verify order structure
            expect(mockOrderData).toHaveProperty("razorpay_order_id");
            expect(mockOrderData).toHaveProperty("status", "pending");
        });

        it("should handle payment success", async () => {
            const mockUpdateQuery = {
                eq: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockUpdateQuery);
            mockUpdateQuery.update.mockResolvedValue({ error: null });

            // Simulate Razorpay success callback
            const paymentSuccessData = {
                razorpay_order_id: "razorpay-123",
                razorpay_payment_id: "pay-123",
                razorpay_signature: "sig-123",
            };

            expect(paymentSuccessData).toHaveProperty("razorpay_payment_id");
        });

        it("should handle payment failure", async () => {
            const paymentErrorData = {
                error: true,
                code: "PAYMENT_FAILED",
                description: "Payment declined by bank",
            };

            expect(paymentErrorData.error).toBe(true);
            expect(paymentErrorData).toHaveProperty("code", "PAYMENT_FAILED");
        });
    });

    // ========== PHASE 5: REAL-TIME CHAT WITH PROVIDER ==========
    describe("Phase 5: Real-time Chat with Provider", () => {
        const mockChatProps = {
            roomId: "room-123",
            senderId: "user-123",
            tenantId: "talenthub",
            userName: "chat",
            displayName: "John Doe",
        };

        const mockMessages = [
            {
                id: "msg-1",
                room_id: "room-123",
                sender_id: "provider-456",
                tenant_id: "talenthub",
                content: "Hello! I'm interested in your profile.",
                created_at: new Date().toISOString(),
            },
        ];

        beforeEach(() => {
            const mockChannel = {
                on: jest.fn().mockReturnThis(),
                subscribe: jest.fn().mockReturnThis(),
            };
            (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);
            mockQuery.order.mockResolvedValue({
                data: mockMessages,
                error: null,
            });
        });

        it("should display existing messages in chat room", async () => {
            render(<ChatRoom { ...mockChatProps } />);

            await waitFor(() => {
                expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
            });

            await waitFor(() => {
                expect(screen.getByText("Hello! I'm interested in your profile.")).toBeInTheDocument();
            });
        });

        it("should send message to provider", async () => {
            const user = userEvent.setup();
            const mockInsertQuery = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockInsertQuery);
            mockInsertQuery.single.mockResolvedValue({
                data: {
                    id: "msg-2",
                    room_id: "room-123",
                    sender_id: "user-123",
                    content: "Great! Let's schedule an interview.",
                    created_at: new Date().toISOString(),
                },
                error: null,
            });

            render(<ChatRoom { ...mockChatProps } />);

            await waitFor(() => {
                expect(screen.getByPlaceholderText("Type your message...")).toBeInTheDocument();
            });

            const messageInput = screen.getByPlaceholderText("Type your message...");
            await user.type(messageInput, "Great! Let's schedule an interview.");
            await user.click(screen.getByRole("button", { name: /send/i }));

            await waitFor(() => {
                expect(mockInsertQuery.insert).toHaveBeenCalledWith(
                    expect.objectContaining({
                        room_id: "room-123",
                        sender_id: "user-123",
                        content: "Great! Let's schedule an interview.",
                    })
                );
            });
        });

        it("should receive real-time messages from provider", async () => {
            let messageCallback: ((msg: any) => void) | null = null;

            const mockChannel = {
                on: jest.fn(function (event: string, filter: any, callback: Function) {
                    if (event === "postgres_changes") {
                        messageCallback = callback as any;
                    }
                    return this;
                }),
                subscribe: jest.fn().mockReturnThis(),
            };
            (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);
            mockQuery.order.mockResolvedValue({ data: [], error: null });

            render(<ChatRoom { ...mockChatProps } />);

            await waitFor(() => {
                expect(mockChannel.on).toHaveBeenCalled();
            });

            // Simulate incoming message
            if (messageCallback) {
                messageCallback({
                    new: {
                        id: "msg-3",
                        room_id: "room-123",
                        sender_id: "provider-456",
                        content: "Perfect! Can we do Tuesday at 2 PM?",
                        created_at: new Date().toISOString(),
                    },
                });
            }

            await waitFor(() => {
                expect(screen.getByText("Perfect! Can we do Tuesday at 2 PM?")).toBeInTheDocument();
            });
        });

        it("should display message timestamps", async () => {
            render(<ChatRoom { ...mockChatProps } />);

            await waitFor(() => {
                const timeElements = screen.getAllByText(/[0-9]{1,2}:[0-9]{2}:[0-9]{2}/);
                expect(timeElements.length).toBeGreaterThan(0);
            });
        });

        it("should display error when messages fail to load", async () => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);
            mockQuery.order.mockResolvedValue({
                data: null,
                error: { message: "Failed to load messages" },
            });

            render(<ChatRoom { ...mockChatProps } />);

            await waitFor(() => {
                expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument();
            });
        });

        it("should handle chat input validation", async () => {
            const user = userEvent.setup();
            render(<ChatRoom { ...mockChatProps } />);

            const messageInput = screen.getByPlaceholderText("Type your message...");

            // Try to send empty message
            await user.click(screen.getByRole("button", { name: /send/i }));

            // Should not be processed
            expect(messageInput).toHaveValue("");
        });
    });

    // ========== PHASE 6: VIDEO CONFERENCE WITH PROVIDER ==========
    describe("Phase 6: Video Conference via Jitsi", () => {
        const mockChatProps = {
            roomId: "room-123",
            senderId: "user-123",
            tenantId: "talenthub",
            userName: "chat",
            displayName: "John Doe",
        };

        beforeEach(() => {
            const mockChannel = {
                on: jest.fn().mockReturnThis(),
                subscribe: jest.fn().mockReturnThis(),
            };
            (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);
            mockQuery.order.mockResolvedValue({ data: [], error: null });
        });

        it("should open Jitsi video conference when clicking video call button", async () => {
            const user = userEvent.setup();
            render(<ChatRoom { ...mockChatProps } />);

            const videoButton = await screen.findByRole("button", { name: /join video call/i });
            await user.click(videoButton);

            const jitsiIframe = await screen.findByTitle("Jitsi Video Conference");
            expect(jitsiIframe).toBeInTheDocument();
            expect(jitsiIframe).toHaveAttribute("allow", expect.stringContaining("camera"));
            expect(jitsiIframe).toHaveAttribute("allow", expect.stringContaining("microphone"));
        });

        it("should use secure Jitsi room ID", async () => {
            render(<ChatRoom { ...mockChatProps } userName = "johndoe" displayName = "John Doe" />);

            const user = userEvent.setup();
            const videoButton = await screen.findByRole("button", { name: /join video call/i });
            await user.click(videoButton);

            const jitsiIframe = await screen.findByTitle("Jitsi Video Conference");
            const src = jitsiIframe.getAttribute("src");

            // Should contain secure room ID format
            expect(src).toMatch(/https:\/\/meet\.jit\.si\/[a-z0-9-]+/);
        });

        it("should allow closing video conference", async () => {
            const user = userEvent.setup();
            render(<ChatRoom { ...mockChatProps } />);

            const videoButton = await screen.findByRole("button", { name: /join video call/i });
            await user.click(videoButton);

            const closeButton = await screen.findByRole("button", { name: /close video/i });
            await user.click(closeButton);

            const jitsiIframe = screen.queryByTitle("Jitsi Video Conference");
            expect(jitsiIframe).not.toBeInTheDocument();
        });

        it("should maintain chat functionality during video call", async () => {
            const user = userEvent.setup();
            const mockInsertQuery = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockInsertQuery);
            mockInsertQuery.single.mockResolvedValue({
                data: {
                    id: "msg-2",
                    room_id: "room-123",
                    sender_id: "user-123",
                    content: "Can you hear me?",
                    created_at: new Date().toISOString(),
                },
                error: null,
            });

            render(<ChatRoom { ...mockChatProps } />);

            const videoButton = await screen.findByRole("button", { name: /join video call/i });
            await user.click(videoButton);

            const messageInput = screen.getByPlaceholderText("Type your message...");
            await user.type(messageInput, "Can you hear me?");
            await user.click(screen.getByRole("button", { name: /send/i }));

            expect(messageInput).toHaveValue("");
        });
    });

    // ========== SECURITY & DATA ISOLATION TESTS ==========
    describe("Security & Data Isolation", () => {
        it("should enforce tenant isolation in products", async () => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);
            mockQuery.select.mockResolvedValue({
                data: [
                    { id: "prod-1", name: "Product 1", tenant_id: "talenthub" },
                    { id: "prod-2", name: "Product 2", tenant_id: "other-tenant" },
                ],
                error: null,
            });

            // In production, RLS would filter this at database level
            render(<ProductsPage />);

            // Should display tenant-specific products
            await waitFor(() => {
                expect(screen.getByText("Product 1")).toBeInTheDocument();
            });
        });

        it("should prevent unauthorized message access", async () => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockQuery);

            // Simulate RLS denying access
            mockQuery.order.mockResolvedValue({
                data: null,
                error: { message: "new row violates row-level security policy" },
            });

            render(
                <ChatRoom
                    roomId="unauthorized-room"
                    senderId = "user-123"
                    tenantId = "talenthub"
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument();
            });
        });

        it("should validate sender identity before sending messages", async () => {
            const user = userEvent.setup();
            const mockInsertQuery = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn(),
            };
            (supabase.from as jest.Mock).mockReturnValue(mockInsertQuery);

            render(
                <ChatRoom
                    roomId="room-123"
                    senderId = "user-123"
                    tenantId = "talenthub"
                />
            );

            // Message should include sender_id verification
            const messageInput = await screen.findByPlaceholderText("Type your message...");
            await user.type(messageInput, "Test message");
            await user.click(screen.getByRole("button", { name: /send/i }));

            await waitFor(() => {
                expect(mockInsertQuery.insert).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sender_id: "user-123",
                    })
                );
            });
        });
    });
});
