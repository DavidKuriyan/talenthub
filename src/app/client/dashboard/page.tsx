"use client";

import { supabase } from "@/lib/supabase"; // Use browser client
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRealtime } from "@/providers/RealtimeProvider";

/**
 * @feature CLIENT_DASHBOARD
 * @aiNote Displays client's active job requirements and allows posting new ones.
 * @aiNote Realtime enabled: Listens for matches and requirement updates.
 */
export default function ClientDashboard() {
    const [matches, setMatches] = useState<any[]>([]);
    const [requirements, setRequirements] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { subscribe } = useRealtime();

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push("/login");
                return;
            }
            setUser(session.user);
            await fetchData(session.user.id);
            setLoading(false);
        };
        init();
    }, [router]);

    const fetchData = async (userId: string) => {
        // Fetch Matches
        const { data: matchesData } = await supabase
            .from("matches")
            .select(`
                id, score, status, created_at,
                requirements!inner ( id, title, client_id ),
                profiles ( id, skills, experience_years, user_id )
            `)
            .eq("requirements.client_id", userId)
            .neq("status", "rejected")
            .order("created_at", { ascending: false });

        if (matchesData) setMatches(matchesData);

        // Fetch Requirements
        const { data: reqData } = await supabase
            .from("requirements")
            .select("*")
            .eq("client_id", userId)
            .order("created_at", { ascending: false });

        if (reqData) setRequirements(reqData);
    };

    // Global Sync
    useEffect(() => {
        if (!user) return;

        // Listen for new matches/interviews
        subscribe({
            table: 'matches',
            // Ideally filter by tenant or client, but for now filtered by tenant implies global availability within tenant
            // Since we can't easily filter by "requirements.client_id" in realtime filter syntax without join, we listen to all matches 
            // and maybe filter in memory or just indiscriminate refresh. Indiscriminate refresh is safer for data consistency.
            onChange: () => fetchData(user.id)
        });

        // Listen for requirement updates
        subscribe({
            table: 'requirements',
            filter: `client_id=eq.${user.id}`,
            onChange: () => fetchData(user.id)
        });

    }, [user, subscribe]);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    // ... rest of render logic
    const role = user.user_metadata?.role || user.app_metadata?.role;
    // ...


    // Type assertions for query results
    type RequirementRow = {
        id: string;
        title: string;
        skills: string[] | null;
        budget: number | null;
        status: string;
        created_at: string;
    };
    const typedRequirements = (requirements || []) as RequirementRow[];

    // Type casting needed for joined data
    type MatchWithJoins = {
        id: string;
        score: number;
        status: string;
        created_at: string;
        requirements: { id: string; title: string; client_id: string };
        profiles: { id: string; skills: string[]; experience_years: number; user_id: string };
    };
    const typedMatches = ((matches || []) as any[]).map((m: any) => ({
        ...m,
        requirements: m.requirements,
        profiles: m.profiles
    })) as MatchWithJoins[];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Client Dashboard</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your hiring requirements</p>
                    </div>
                    <Link
                        href="/client/requirements/new"
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        + Post Requirement
                    </Link>
                </div>

                {/* Matches / Interviews Section */}
                {typedMatches.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-zinc-900">Active Interviews & Matches</h2>
                        <div className="grid gap-4">
                            {typedMatches.map((match) => (
                                <div key={match.id} className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/30 p-6 rounded-xl hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-lg">{match.requirements.title}</h3>
                                            <p className="text-zinc-500 text-sm">Candidate with {match.profiles.experience_years} years exp.</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                    {match.score}% Match
                                                </span>
                                                <span className="text-xs text-zinc-400 flex items-center">
                                                    Matched on {new Date(match.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/client/matches/${match.id}`}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                                        >
                                            Open Interview Room
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t pt-8">
                    <h2 className="text-xl font-semibold text-zinc-900 mb-4">Your Requirements</h2>
                    {/* Requirements Grid */}
                    {typedRequirements && typedRequirements.length > 0 ? (
                        <div className="grid gap-4">
                            {typedRequirements.map((req) => (
                                <div key={req.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{req.title}</h2>
                                            <div className="flex gap-2 mt-2">
                                                {req.skills && Array.isArray(req.skills) && req.skills.map((skill: string) => (
                                                    <span key={skill} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded text-xs font-medium">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${req.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            req.status === 'fulfilled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}>
                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
                                        <span>Budget: ₹{(req.budget || 0).toLocaleString()}</span>
                                        <span>Posted: {new Date(req.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">No requirements posted yet</h3>
                            <p className="text-zinc-500 mt-2 mb-6">Start by posting your first job requirement to find engineers.</p>
                            <Link
                                href="/client/requirements/new"
                                className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 rounded-lg font-medium"
                            >
                                Create Requirement
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
