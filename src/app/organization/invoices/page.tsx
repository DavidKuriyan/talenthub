import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Invoice {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    engineer_id?: string;
}

/**
 * @feature ORGANIZATION_INVOICES
 * @aiNote Manage invoices and payments
 */
export default async function InvoicesPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/tenant/login");
    }

    const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

    if (!tenantId) {
        redirect("/organization/register");
    }

    // Fetch invoices for this organization
    const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

    const invoices = (invoicesData || []) as Invoice[];

    const totalRevenue = invoices.reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0) || 0;
    const paidCount = invoices.filter((i: Invoice) => i.status === 'paid').length || 0;
    const pendingCount = invoices.filter((i: Invoice) => i.status === 'pending').length || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <Link href="/organization/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices & Payments</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Track payments to engineers
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                        + Generate Invoice
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-green-600">₹{(totalRevenue / 100000).toFixed(1)}L</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Total Invoices</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{invoices?.length || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Paid</p>
                        <p className="text-3xl font-bold text-green-600">{paidCount}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Pending</p>
                        <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                    </div>
                </div>

                {invoices && invoices.length > 0 ? (
                    <div className="space-y-4">
                        {invoices.map((invoice: Invoice) => (
                            <div key={invoice.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                            Invoice #{invoice.id.substring(0, 8)}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Engineer: {invoice.engineer_id?.substring(0, 8)}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(invoice.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            ₹{(invoice.amount / 100).toLocaleString()}
                                        </p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : invoice.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                </div>

                                {invoice.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                                            💳 Pay via Razorpay
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                                        >
                                            📄 Print Receipt
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
                        <div className="text-6xl mb-4">💰</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            No Invoices Yet
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Invoices will be generated after successful placements
                        </p>
                    </div>
                )}

                {/* Razorpay Integration Notice */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                    <p className="text-blue-800 dark:text-blue-300 text-sm">
                        💡 <strong>Razorpay Integration:</strong> Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_SECRET in environment variables to enable instant payments
                    </p>
                </div>
            </div>
        </div>
    );
}
