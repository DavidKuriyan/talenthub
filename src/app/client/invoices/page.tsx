"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/**
 * @feature CLIENT_INVOICES
 * @aiNote View and manage invoices with Razorpay payment integration.
 */
export default function ClientInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

            const { data, error } = await supabase
                .from("invoices")
                .select("*")
                .eq("tenant_id", tenantId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) setInvoices(data);
        } catch (err) {
            console.error("Error fetching invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    const handlePayment = async (invoiceId: string, amount: number) => {
        try {
            // Create Razorpay order via API
            const res = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, invoiceId }),
            });

            const data = await res.json();
            if (!data.orderId) throw new Error("Failed to create order");

            // Open Razorpay checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: amount,
                currency: "INR",
                name: "TalentHub",
                description: "Placement Fee",
                order_id: data.orderId,
                handler: async function (response: any) {
                    // Verify payment
                    await fetch("/api/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            invoiceId
                        }),
                    });
                    fetchInvoices();
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment error:", err);
            alert("Payment initialization failed");
        }
    };

    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);

    if (loading) return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Invoices & Payments</h1>
                        <p className="text-zinc-500 mt-1">Manage placement fee payments</p>
                    </div>
                    <Link
                        href="/client/dashboard"
                        className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        ← Dashboard
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                        <p className="text-indigo-100 text-sm">Total Paid</p>
                        <p className="text-3xl font-bold mt-1">₹{(totalPaid / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                        <p className="text-zinc-500 text-sm">Pending Payments</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-1">₹{(totalPending / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                        <p className="text-zinc-500 text-sm">Total Invoices</p>
                        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{invoices.length}</p>
                    </div>
                </div>

                {/* Invoices List */}
                {invoices.length > 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Invoice History</h2>
                        </div>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {invoices.map((invoice) => (
                                <div key={invoice.id} className="p-6 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                                            {invoice.description || "Placement Fee"}
                                        </p>
                                        <p className="text-sm text-zinc-400 mt-1">
                                            {new Date(invoice.created_at).toLocaleDateString()}
                                            {invoice.razorpay_payment_id && (
                                                <span className="ml-2 font-mono text-xs">#{invoice.razorpay_payment_id.slice(-8)}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-zinc-900 dark:text-zinc-50">₹{(invoice.amount / 100).toLocaleString()}</p>
                                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                            </span>
                                        </div>
                                        {invoice.status === 'pending' && (
                                            <button
                                                onClick={() => handlePayment(invoice.id, invoice.amount)}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                        {invoice.status === 'paid' && (
                                            <button className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                📥 Receipt
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mx-auto mb-4">📃</div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No Invoices Yet</h3>
                        <p className="text-zinc-500 mt-2">Invoices will appear here after successful placements.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
