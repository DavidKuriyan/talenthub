"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function CartSummary() {
    const { items, totalPrice, totalItems, removeFromCart, clearCart } = useCart();
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

    const handleCheckout = async () => {
        setIsCheckoutLoading(true);
        // @aiNote Razorpay integration will call our API route to create an order.
        try {
            // Step 1: Create order via our API
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, total: totalPrice }),
            });

            if (!response.ok) {
                throw new Error("Failed to create order");
            }

            const order = await response.json();

            // Step 2: Open Razorpay checkout modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
                amount: order.amount,
                currency: order.currency,
                name: "TalentHub Solutions",
                description: "Placement Service Fee",
                order_id: order.id,
                handler: async function (response: any) {
                    // Step 3: Verify payment on our backend
                    try {
                        const verifyRes = await fetch("/api/checkout/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                items,
                            }),
                        });

                        if (verifyRes.ok) {
                            alert("Payment successful! Order confirmed.");
                            clearCart();
                        } else {
                            throw new Error("Payment verification failed");
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: "Customer",
                    email: "customer@example.com",
                },
                theme: {
                    color: "#18181b", // zinc-900
                },
            };

            // @ts-ignore - Razorpay is loaded via script tag
            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response: any) {
                alert(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Checkout failed. Please try again.");
        } finally {
            setIsCheckoutLoading(false);
        }
    };

    if (totalItems === 0) return null;

    return (
        <div className="fixed bottom-8 right-8 z-50 w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Your Cart</h2>
                <button
                    onClick={clearCart}
                    className="text-sm text-zinc-500 hover:text-red-500 transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</span>
                            <span className="text-xs text-zinc-500">Qty: {item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                                ₹{(item.price * item.quantity / 100).toLocaleString()}
                            </span>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-600 dark:text-zinc-400">Total Placement Fee</span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        ₹{(totalPrice / 100).toLocaleString()}
                    </span>
                </div>
            </div>

            <button
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
                className="w-full flex items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-50 px-5 py-4 text-sm font-bold text-white dark:text-zinc-900 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
                {isCheckoutLoading ? "Processing..." : "Complete Purchase"}
            </button>
        </div>
    );
}
