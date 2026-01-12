import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * @feature ENGINEER_OFFERS
 * @aiNote View offer letters for the engineer
 */
export default async function EngineerOffersPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/engineer/login");
    }

    // Get engineer's profile first
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

    let offers: any[] = [];
    if (profile && (profile as any).id) {
        // Fetch offers via matches linked to this profile
        const { data } = await supabase
            .from("offer_letters")
            .select(`
                *,
                matches!inner (
                    id,
                    profile_id,
                    requirements (
                        title
                    )
                )
            `)
            .eq("matches.profile_id", (profile as any).id)
            .order("created_at", { ascending: false });

        offers = data || [];
    }

    const pendingOffers = (offers as any[]).filter(o => o.status === 'pending') || [];
    const acceptedOffers = (offers as any[]).filter(o => o.status === 'accepted') || [];
    const rejectedOffers = (offers as any[]).filter(o => o.status === 'rejected') || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 p-6">
            <div className="max-w-5xl mx-auto">
                <Link href="/engineer/profile" className="text-emerald-300 hover:text-emerald-100 text-sm mb-4 inline-block">
                    ← Back to Profile
                </Link>

                <h1 className="text-3xl font-bold text-white mb-2">Offer Letters</h1>
                <p className="text-emerald-200 mb-8">
                    Review and manage your job offers
                </p>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30">
                        <p className="text-emerald-400 text-sm mb-1">Total Offers</p>
                        <p className="text-3xl font-bold text-white">{offers?.length || 0}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30">
                        <p className="text-emerald-400 text-sm mb-1">Pending</p>
                        <p className="text-3xl font-bold text-yellow-300">{pendingOffers.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30">
                        <p className="text-emerald-400 text-sm mb-1">Accepted</p>
                        <p className="text-3xl font-bold text-green-300">{acceptedOffers.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30">
                        <p className="text-emerald-400 text-sm mb-1">Declined</p>
                        <p className="text-3xl font-bold text-red-300">{rejectedOffers.length}</p>
                    </div>
                </div>

                {offers && offers.length > 0 ? (
                    <div className="space-y-4">
                        {offers.map((offer: any) => (
                            <div
                                key={offer.id}
                                className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-1">
                                            {offer.position} at {offer.company_name}
                                        </h3>
                                        <p className="text-emerald-200 text-sm">
                                            💰 ₹{(offer.salary / 100000).toFixed(1)}L per annum
                                        </p>
                                        <p className="text-emerald-200 text-sm">
                                            📅 Joining Date: {new Date(offer.joining_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${offer.status === 'pending'
                                        ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/50'
                                        : offer.status === 'accepted'
                                            ? 'bg-green-500/20 text-green-200 border border-green-500/50'
                                            : 'bg-red-500/20 text-red-200 border border-red-500/50'
                                        }`}>
                                        {offer.status}
                                    </span>
                                </div>

                                {offer.description && (
                                    <p className="text-emerald-200 text-sm mb-4">
                                        {offer.description}
                                    </p>
                                )}

                                {offer.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                                            ✓ Accept Offer
                                        </button>
                                        <button className="px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                                            ✗ Decline Offer
                                        </button>
                                        {offer.letter_url && (
                                            <a
                                                href={offer.letter_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors font-medium"
                                            >
                                                📄 View Letter
                                            </a>
                                        )}
                                    </div>
                                )}

                                {offer.status === 'accepted' && (
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-200 text-sm">
                                        ✓ You have accepted this offer. The organization will contact you with next steps.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/10 backdrop-blur-xl p-12 rounded-2xl border border-emerald-700/30 text-center">
                        <div className="text-6xl mb-4">📧</div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            No Offer Letters Yet
                        </h3>
                        <p className="text-emerald-200 mb-6">
                            Offer letters from organizations will appear here after successful interviews
                        </p>
                        <Link
                            href="/engineer/jobs"
                            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                            View Matched Jobs
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
