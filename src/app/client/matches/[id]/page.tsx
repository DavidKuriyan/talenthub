import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";
import JitsiMeeting from "@/components/video/JitsiMeeting";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MatchDetailsPage(props: PageProps) {
    const params = await props.params;
    const { id } = params;

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/login");
    }

    const userId = session.user.id;

    // Fetch Match with related data
    const { data: match, error } = await supabase
        .from("matches")
        .select(`
            id,
            score,
            status,
            requirements (
                id,
                title,
                client_id
            ),
            profiles (
                id,
                user_id,
                skills,
                experience_years
            )
        `)
        .eq("id", id)
        .single();

    if (error || !match) {
        console.error("Error fetching match:", error);
        return <div className="p-8">Match not found</div>;
    }

    // Type casting for join results (Supabase types can be tricky with joins)
    const requirement = match.requirements as any;
    const profile = match.profiles as any;

    // Security Check: Ensure current user is the Client
    if (requirement.client_id !== userId) {
        return <div className="p-8 text-red-500">Access Denied: You are not the client for this match.</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <Link href="/client/dashboard" className="text-sm text-zinc-500 hover:text-blue-600 mb-2 inline-block">
                            &larr; Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            Interview: {requirement.title}
                        </h1>
                        <p className="text-zinc-500">
                            Candidate Profile (Score: {match.score}%)
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Interaction Area: Video & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Room */}
                        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <h2 className="font-semibold">Video Interview</h2>
                            </div>
                            <div className="aspect-video bg-black">
                                <JitsiMeeting
                                    roomId={`talenthub-${match.id}`}
                                    userName="Client"
                                    height="100%"
                                />
                            </div>
                        </div>

                        {/* Candidate Details */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold mb-4">Candidate Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-zinc-500 block">Experience</span>
                                    <span className="font-medium">{profile.experience_years} Years</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 block">Skills</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {Array.isArray(profile.skills) && profile.skills.map((skill: any) => (
                                            <span key={skill} className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Chat */}
                    <div className="lg:col-span-1">
                        <ChatWindow
                            matchId={match.id}
                            currentUserId={userId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
