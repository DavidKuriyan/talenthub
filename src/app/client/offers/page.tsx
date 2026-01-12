"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/**
 * @feature CLIENT_OFFERS
 * @aiNote Create and send offer letters to matched engineers.
 */
export default function ClientOffersPage() {
    const [offers, setOffers] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<string>("");
    const [salary, setSalary] = useState("");
    const [startDate, setStartDate] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Fetch offers
            const { data: offerData } = await supabase
                .from("offer_letters")
                .select(`
                    id,
                    salary,
                    start_date,
                    document_url,
                    status,
                    created_at,
                    matches (
                        id,
                        profiles (
                            skills,
                            experience_years
                        ),
                        requirements (
                            title
                        )
                    )
                `)
                .order("created_at", { ascending: false });

            if (offerData) {
                setOffers(offerData);
            }

            // Fetch hired matches for creating offers
            const { data: matchData } = await supabase
                .from("matches")
                .select(`
                    id,
                    score,
                    requirements!inner (
                        title,
                        client_id
                    ),
                    profiles (
                        skills,
                        experience_years
                    )
                `)
                .eq("requirements.client_id", session.user.id)
                .in("status", ["interview_scheduled", "pending"]);

            if (matchData) {
                setMatches(matchData);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const createOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatch || !salary || !startDate) return;

        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("Not authenticated");

            const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

            const { error } = await (supabase
                .from("offer_letters") as any)
                .insert({
                    tenant_id: tenantId,
                    match_id: selectedMatch,
                    salary: parseInt(salary) * 100, // Convert to paise
                    start_date: startDate,
                    status: "pending"
                });

            if (error) throw error;

            // Update match status to hired
            await (supabase
                .from("matches") as any)
                .update({ status: "hired" })
                .eq("id", selectedMatch);

            setShowCreateModal(false);
            setSelectedMatch("");
            setSalary("");
            setStartDate("");
            fetchData();
        } catch (err: any) {
            console.error("Error creating offer:", err);
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'accepted': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

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
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Offer Letters</h1>
                        <p className="text-zinc-500 mt-1">Create and track offer letters to engineers</p>
                    </div>
                    <div className="flex gap-3">
                        {matches.length > 0 && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                            >
                                + Create Offer
                            </button>
                        )}
                        <Link
                            href="/client/dashboard"
                            className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Total Offers</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{offers.length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{offers.filter(o => o.status === 'pending').length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Accepted</p>
                        <p className="text-2xl font-bold text-emerald-600">{offers.filter(o => o.status === 'accepted').length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Rejected</p>
                        <p className="text-2xl font-bold text-red-600">{offers.filter(o => o.status === 'rejected').length}</p>
                    </div>
                </div>

                {/* Offers List */}
                {offers.length > 0 ? (
                    <div className="space-y-4">
                        {offers.map((offer) => (
                            <div key={offer.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                                            {offer.matches?.requirements?.title || "Offer"}
                                        </h2>
                                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(offer.status)}`}>
                                            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                                        </span>
                                    </div>
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
                                        <p className="text-sm text-zinc-500">Sent On</p>
                                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{new Date(offer.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mx-auto mb-4">📄</div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No Offer Letters Yet</h3>
                        <p className="text-zinc-500 mt-2">Create an offer letter after interviewing matched candidates.</p>
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Create Offer Letter</h2>
                            <form onSubmit={createOffer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Select Candidate</label>
                                    <select
                                        value={selectedMatch}
                                        onChange={(e) => setSelectedMatch(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        required
                                    >
                                        <option value="">Select a candidate...</option>
                                        {matches.map((match) => (
                                            <option key={match.id} value={match.id}>
                                                {match.requirements.title} - {match.score}% match
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Monthly Salary (₹)</label>
                                    <input
                                        type="number"
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        placeholder="e.g., 75000"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {creating ? "Creating..." : "Send Offer"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
