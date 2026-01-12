import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * @feature ENGINEER_JOBS
 * @aiNote Displays matched job requirements for engineers.
 * Engineers can view, accept, or reject interview requests.
 */
export default async function EngineerJobsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/engineer/login");
    }

    // Get engineer's profile
    const { data: profile } = await (supabase
        .from("profiles") as any)
        .select("id, skills, availability")
        .eq("user_id", session.user.id)
        .maybeSingle();

    if (!profile || !profile.skills || (profile.skills as string[]).length === 0) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Complete Your Profile First</h1>
                    <p className="text-zinc-500 mt-2 mb-6">You need to set up your skills and profile before viewing job matches.</p>
                    <Link href="/engineer/profile" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                        Set Up Profile →
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch matches for this engineer's profile
    const { data: matches, error } = await (supabase
        .from("matches") as any)
        .select(`
            id,
            score,
            status,
            created_at,
            requirements (
                id,
                title,
                skills,
                budget,
                status
            )
        `)
        .eq("profile_id", (profile as any).id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching matches:", error);
    }

    type MatchWithRequirement = {
        id: string;
        score: number;
        status: string;
        created_at: string;
        requirements: {
            id: string;
            title: string;
            skills: string[];
            budget: number | null;
            status: string;
        };
    };

    const typedMatches = (matches || []) as MatchWithRequirement[];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'interview_scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'hired': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Matched Jobs</h1>
                        <p className="text-zinc-500 mt-1">Job opportunities matched to your skills</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/engineer/profile"
                            className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            ← Back to Profile
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Total Matches</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{typedMatches.length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{typedMatches.filter(m => m.status === 'pending').length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Interviews</p>
                        <p className="text-2xl font-bold text-blue-600">{typedMatches.filter(m => m.status === 'interview_scheduled').length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Hired</p>
                        <p className="text-2xl font-bold text-emerald-600">{typedMatches.filter(m => m.status === 'hired').length}</p>
                    </div>
                </div>

                {/* Job Matches List */}
                {typedMatches.length > 0 ? (
                    <div className="space-y-4">
                        {typedMatches.map((match) => (
                            <div key={match.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{match.requirements.title}</h2>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(match.status)}`}>
                                                {match.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {match.requirements.skills && Array.isArray(match.requirements.skills) && match.requirements.skills.map((skill: string) => (
                                                <span key={skill} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-lg text-xs font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <span className="font-semibold text-emerald-600">{match.score}%</span> match
                                            </span>
                                            {match.requirements.budget && (
                                                <span>Budget: ₹{(match.requirements.budget / 100).toLocaleString()}</span>
                                            )}
                                            <span>Matched: {new Date(match.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {match.status === 'pending' && (
                                            <>
                                                <form action={`/api/matches/${match.id}/accept`} method="POST">
                                                    <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                                                        Accept
                                                    </button>
                                                </form>
                                                <form action={`/api/matches/${match.id}/reject`} method="POST">
                                                    <button type="submit" className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                                                        Decline
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                        {match.status === 'interview_scheduled' && (
                                            <Link href="/engineer/interviews" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                                                View Interview
                                            </Link>
                                        )}
                                        {match.status === 'hired' && (
                                            <Link href="/engineer/offers" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                                                View Offer
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mx-auto mb-4">🔍</div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No Matches Yet</h3>
                        <p className="text-zinc-500 mt-2 max-w-md mx-auto">
                            Complete your profile with relevant skills to start receiving job matches from recruiters.
                        </p>
                        <Link href="/engineer/profile" className="inline-block mt-6 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                            Update Profile
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
