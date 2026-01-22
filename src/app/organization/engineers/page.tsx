import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * @feature ENGINEER_POOL
 * @aiNote View all engineers in the organization's pool
 */
export default async function EngineersPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/tenant/login");
    }

    const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

    if (!tenantId) {
        redirect("/organization/register");
    }

    // Fetch all engineers (profiles) in this tenant
    const { data: engineers } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <Link href="/organization/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Engineer Pool</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {engineers?.length || 0} engineers available
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {engineers && engineers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {engineers.map((engineer: {
                            id: string;
                            user_id: string;
                            experience_years: number;
                            skills: string[];
                            resume_url?: string;
                        }) => (
                            <div
                                key={engineer.id}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {engineer.user_id?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white">
                                            Engineer #{engineer.id.substring(0, 8)}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {engineer.experience_years} years exp
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-1">
                                        {engineer.skills?.slice(0, 4).map((skill: string) => (
                                            <span
                                                key={skill}
                                                className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded text-xs"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {engineer.skills?.length > 4 && (
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded text-xs">
                                                +{engineer.skills.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {engineer.resume_url && (
                                    <a
                                        href={engineer.resume_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium text-center"
                                    >
                                        View Resume →
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
                        <div className="text-6xl mb-4">👨‍💻</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            No Engineers Yet
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Engineers will appear here as they register and complete their profiles
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
