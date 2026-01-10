import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * @feature ENGINEER_INTERVIEWS
 * @aiNote Displays scheduled interviews for engineers with Jitsi video call integration.
 */
export default async function EngineerInterviewsPage() {
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

    // Fetch interviews for this engineer
    const { data: interviews, error } = await supabase
        .from("interviews")
        .select(`
            id,
            scheduled_at,
            jitsi_room_id,
            status,
            notes,
            created_at,
            matches!inner (
                id,
                score,
                requirements (
                    title
                )
            )
        `)
        .eq("matches.profile_id", profile.id)
        .order("scheduled_at", { ascending: true });

    if (error) {
        console.error("Error fetching interviews:", error);
    }

    type InterviewWithMatch = {
        id: string;
        scheduled_at: string;
        jitsi_room_id: string;
        status: string;
        notes: string | null;
        created_at: string;
        matches: {
            id: string;
            score: number;
            requirements: {
                title: string;
            };
        };
    };

    const typedInterviews = (interviews || []) as InterviewWithMatch[];

    const upcomingInterviews = typedInterviews.filter(i => i.status === 'scheduled' && new Date(i.scheduled_at) >= new Date());
    const pastInterviews = typedInterviews.filter(i => i.status !== 'scheduled' || new Date(i.scheduled_at) < new Date());

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">My Interviews</h1>
                        <p className="text-zinc-500 mt-1">Scheduled video interviews with recruiters</p>
                    </div>
                    <Link
                        href="/engineer/profile"
                        className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        ← Back to Profile
                    </Link>
                </div>

                {/* Upcoming Interviews */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Upcoming Interviews</h2>
                    {upcomingInterviews.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingInterviews.map((interview) => (
                                <div key={interview.id} className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{interview.matches.requirements.title}</h3>
                                            <p className="text-zinc-500 text-sm mt-1">
                                                📅 {new Date(interview.scheduled_at).toLocaleString()}
                                            </p>
                                            {interview.notes && (
                                                <p className="text-zinc-400 text-sm mt-2">💬 {interview.notes}</p>
                                            )}
                                        </div>
                                        <a
                                            href={`https://meet.jit.si/${interview.jitsi_room_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            🎥 Join Video Call
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                            <p className="text-zinc-500">No upcoming interviews scheduled</p>
                        </div>
                    )}
                </div>

                {/* Past Interviews */}
                {pastInterviews.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Interview History</h2>
                        <div className="space-y-3">
                            {pastInterviews.map((interview) => (
                                <div key={interview.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{interview.matches.requirements.title}</h3>
                                        <p className="text-zinc-400 text-sm">{new Date(interview.scheduled_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${interview.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            interview.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                        }`}>
                                        {interview.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
