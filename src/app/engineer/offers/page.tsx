import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * @feature ENGINEER_OFFERS
 * @aiNote Displays offer letters for engineers with accept/reject actions.
 */
export default async function EngineerOffersPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/engineer/login");
    }

    // Get engineer's profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

    if (!profile) {
        redirect("/engineer/profile");
    }

    // Fetch offer letters for this engineer
    const { data: offers, error } = await supabase
        .from("offer_letters")
        .select(`
            id,
            salary,
            start_date,
            document_url,
            status,
            created_at,
            matches!inner (
                id,
                requirements (
                    title
                )
            )
        `)
        .eq("matches.profile_id", profile.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching offers:", error);
    }

    type OfferWithMatch = {
        id: string;
        salary: number;
        start_date: string;
        document_url: string | null;
        status: string;
        created_at: string;
        matches: {
            id: string;
            requirements: {
                title: string;
            };
        };
    };

    const typedOffers = (offers || []) as OfferWithMatch[];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'accepted': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Offer Letters</h1>
                        <p className="text-zinc-500 mt-1">Review and respond to job offers</p>
                    </div>
                    <Link
                        href="/engineer/profile"
                        className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        ← Back to Profile
                    </Link>
                </div>

                {/* Offers List */}
                {typedOffers.length > 0 ? (
                    <div className="space-y-4">
                        {typedOffers.map((offer) => (
                            <div key={offer.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{offer.matches.requirements.title}</h2>
                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(offer.status)}`}>
                                            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                                        </span>
                                    </div>
                                    {offer.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <form action={`/api/offers/${offer.id}/accept`} method="POST">
                                                <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
                                                    Accept Offer
                                                </button>
                                            </form>
                                            <form action={`/api/offers/${offer.id}/reject`} method="POST">
                                                <button type="submit" className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                                                    Decline
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <div>
                                        <p className="text-sm text-zinc-500">Salary Offered</p>
                                        <p className="text-lg font-bold text-emerald-600">₹{(offer.salary / 100).toLocaleString()}/month</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500">Start Date</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{new Date(offer.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500">Received On</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{new Date(offer.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {offer.document_url && (
                                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                        <a
                                            href={offer.document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                        >
                                            📄 Download Offer Letter
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mx-auto mb-4">📄</div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No Offer Letters Yet</h3>
                        <p className="text-zinc-500 mt-2 max-w-md mx-auto">
                            Once you successfully complete interviews, you&apos;ll receive offer letters here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
