import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * @feature ENGINEER_PAYMENTS
 * @aiNote Displays payment status and history for engineers.
 */
export default async function EngineerPaymentsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/engineer/login");
    }

    // Fetch payments for this engineer
    const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("engineer_id", session.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching invoices:", error);
    }

    type Invoice = {
        id: string;
        amount: number;
        status: string;
        description: string | null;
        razorpay_payment_id: string | null;
        created_at: string;
    };

    const typedInvoices = (invoices || []) as Invoice[];

    const totalEarnings = typedInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = typedInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Payment Status</h1>
                        <p className="text-zinc-500 mt-1">Track your earnings and payment history</p>
                    </div>
                    <Link
                        href="/engineer/profile"
                        className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        ← Back to Profile
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                        <p className="text-emerald-100 text-sm">Total Earnings</p>
                        <p className="text-3xl font-bold mt-1">₹{(totalEarnings / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                        <p className="text-zinc-500 text-sm">Pending Payments</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-1">₹{(pendingAmount / 100).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                        <p className="text-zinc-500 text-sm">Total Transactions</p>
                        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{typedInvoices.length}</p>
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Payment History</h2>
                    </div>

                    {typedInvoices.length > 0 ? (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {typedInvoices.map((invoice) => (
                                <div key={invoice.id} className="p-6 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                                            {invoice.description || "Placement Payment"}
                                        </p>
                                        <p className="text-sm text-zinc-400 mt-1">
                                            {new Date(invoice.created_at).toLocaleDateString()}
                                            {invoice.razorpay_payment_id && (
                                                <span className="ml-2 font-mono text-xs">#{invoice.razorpay_payment_id.slice(-8)}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-zinc-900 dark:text-zinc-50">₹{(invoice.amount / 100).toLocaleString()}</p>
                                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-zinc-400">
                            No payment history yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
