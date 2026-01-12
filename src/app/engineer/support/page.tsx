"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EngineerSupportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/support');
            const data = await res.json();
            if (data.success) setTickets(data.tickets);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, description })
            });
            const data = await res.json();
            if (data.success) {
                setSubject("");
                setDescription("");
                fetchTickets();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="/engineer" className="text-emerald-600 hover:text-emerald-700 text-sm mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Help & Support</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Get assistance with your profile or matching</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-bold mb-4">Contact Support</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Issue Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent"
                                    placeholder="e.g. Profile visibility issue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Details</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent h-32"
                                    placeholder="Tell us what happened..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Request"}
                            </button>
                        </form>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-4">Recent Requests</h2>
                        <div className="space-y-4">
                            {fetching ? (
                                <p>Loading history...</p>
                            ) : tickets.length > 0 ? (
                                tickets.map((ticket) => (
                                    <div key={ticket.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-sm text-emerald-600">{ticket.subject}</h3>
                                            <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${ticket.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{ticket.description}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-12 text-slate-500 italic">No historical requests.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
