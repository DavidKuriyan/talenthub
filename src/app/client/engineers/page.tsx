import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * @feature CLIENT_ENGINEERS
 * @aiNote View engineer pool (skills, availability) for recruiters.
 * Allows filtering and manual matching.
 */
export default async function ClientEngineersPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/tenant/login");
    }

    // Fetch all active engineer profiles
    const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
            id,
            skills,
            experience_years,
            availability,
            resume_url,
            created_at,
            users!inner (
                id,
                email
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching profiles:", error);
    }

    type ProfileWithUser = {
        id: string;
        skills: string[];
        experience_years: number;
        availability: string;
        resume_url: string | null;
        created_at: string;
        users: {
            id: string;
            email: string;
        };
    };

    const typedProfiles = (profiles || []) as ProfileWithUser[];

    const availableCount = typedProfiles.filter(p => p.availability === 'available').length;
    const busyCount = typedProfiles.filter(p => p.availability === 'busy').length;

    const getAvailabilityBadge = (availability: string) => {
        switch (availability) {
            case 'available': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'busy': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'unavailable': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Engineer Pool</h1>
                        <p className="text-zinc-500 mt-1">Browse and match with available engineers</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/client/requirements/new"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                            + Post Requirement
                        </Link>
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
                        <p className="text-sm text-zinc-500">Total Engineers</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{typedProfiles.length}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Available</p>
                        <p className="text-2xl font-bold text-emerald-600">{availableCount}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Busy</p>
                        <p className="text-2xl font-bold text-yellow-600">{busyCount}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <p className="text-sm text-zinc-500">Avg. Experience</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            {typedProfiles.length > 0 ? Math.round(typedProfiles.reduce((sum, p) => sum + p.experience_years, 0) / typedProfiles.length) : 0} yrs
                        </p>
                    </div>
                </div>

                {/* Engineer Grid */}
                {typedProfiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {typedProfiles.map((profile) => (
                            <div key={profile.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                        {profile.users.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityBadge(profile.availability)}`}>
                                        {profile.availability}
                                    </span>
                                </div>

                                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-1">{profile.users.email.split('@')[0]}</h3>
                                <p className="text-sm text-zinc-500 mb-3">{profile.experience_years} years experience</p>

                                <div className="flex flex-wrap gap-1 mb-4">
                                    {profile.skills && Array.isArray(profile.skills) && profile.skills.slice(0, 4).map((skill: string) => (
                                        <span key={skill} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded text-xs">
                                            {skill}
                                        </span>
                                    ))}
                                    {profile.skills && profile.skills.length > 4 && (
                                        <span className="text-zinc-400 text-xs">+{profile.skills.length - 4} more</span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/chat?user=${profile.users.id}`}
                                        className="flex-1 text-center py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        💬 Message
                                    </Link>
                                    {profile.resume_url && (
                                        <a
                                            href={profile.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            📄
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mx-auto mb-4">👷</div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No Engineers Available</h3>
                        <p className="text-zinc-500 mt-2">Wait for engineers to register and complete their profiles.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
