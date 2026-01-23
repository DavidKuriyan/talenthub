"use client";

import { useState } from "react";

interface EliteUpgradeProps {
    onSuccess?: () => void;
}

export default function EliteUpgrade({ onSuccess }: EliteUpgradeProps) {
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleUpgrade = async () => {
        setProcessing(true);

        try {
            // Create mock order
            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 9999, // ₹9,999 for Elite plan
                    description: 'TalentHub Elite Upgrade'
                })
            });

            const orderData = await orderRes.json();

            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock verification (always succeeds in test mode)
            const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: orderData.orderId,
                    razorpay_payment_id: `pay_mock_${Date.now()}`,
                    razorpay_signature: 'mock_signature',
                    invoiceId: null
                })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
                setSuccess(true);
                onSuccess?.();
                // Keep success animation visible for 3 seconds
                setTimeout(() => {
                    setShowModal(false);
                    setSuccess(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Payment error:', error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs hover:bg-zinc-100 transition-colors relative z-10"
            >
                UPGRADE PLAN
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-3xl p-8 max-w-md w-full border border-white/10 relative overflow-hidden">
                        {/* Background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />

                        {success ? (
                            // Success Animation
                            <div className="relative z-10 text-center py-8">
                                <div className="relative inline-block mb-6">
                                    {/* Confetti-like particles */}
                                    <div className="absolute -inset-8 flex items-center justify-center">
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-2 h-2 rounded-full animate-ping"
                                                style={{
                                                    backgroundColor: ['#818cf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'][i % 5],
                                                    transform: `rotate(${i * 30}deg) translateY(-40px)`,
                                                    animationDelay: `${i * 0.1}s`,
                                                    animationDuration: '1s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {/* Success checkmark */}
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-bounce">
                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Welcome to Elite! 🎉</h3>
                                <p className="text-zinc-400 text-sm">Your organization has been upgraded successfully.</p>
                                <div className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl inline-block">
                                    <span className="text-emerald-400 text-xs font-bold">Payment ID: pay_mock_{Date.now().toString().slice(-8)}</span>
                                </div>
                            </div>
                        ) : (
                            // Payment Form
                            <div className="relative z-10">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                                        ✦
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-1">Upgrade to Elite</h3>
                                    <p className="text-zinc-400 text-sm">Unlock premium recruitment features</p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-emerald-400">✓</span>
                                        <span className="text-zinc-300">Curated Talent Pipeline</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-emerald-400">✓</span>
                                        <span className="text-zinc-300">Direct Source Integration</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-emerald-400">✓</span>
                                        <span className="text-zinc-300">Priority Support 24/7</span>
                                    </div>
                                </div>

                                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 text-sm">Elite Plan (Annual)</span>
                                        <span className="text-2xl font-black text-white">₹9,999</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">Razorpay Test Mode - No real charges</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={processing}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>Pay with Razorpay</>
                                        )}
                                    </button>
                                </div>

                                <p className="text-center text-xs text-zinc-600 mt-4">
                                    🔒 Secured by Razorpay (Test Mode)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
