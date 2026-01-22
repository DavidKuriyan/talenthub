import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";

/**
 * @feature VIEW_REQUIREMENTS
 * @aiNote List all job requirements for the organization
 */
export default async function RequirementsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/tenant/login");
    }

    const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

    if (!tenantId) {
        redirect("/organization/register");
    }

    // Fetch requirements
    const { data: requirements } = await supabase
        .from("requirements")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <Link href="/organization/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Requirements</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Manage your hiring requirements
                        </p>
                    </div>
                    <Link
                        href="/organization/requirements/post"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                        + Post New Requirement
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {requirements && requirements.length > 0 ? (
                    <div className="grid gap-4">
                        {requirements.map((req: {
                            id: string;
                            title: string;
                            role: string;
                            status: string;
                            experience_min: number;
                            experience_max: number;
                            salary_min: number;
                            salary_max: number;
                            required_skills: string[];
                        }) => (
                            <div
                                key={req.id}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                            {req.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {req.role}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.status === 'open'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Experience</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {req.experience_min} - {req.experience_max} years
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Salary Range</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            ₹{(req.salary_min / 100000).toFixed(1)}L - ₹{(req.salary_max / 100000).toFixed(1)}L
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Required Skills</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {req.required_skills?.length || 0} skills
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {req.required_skills?.slice(0, 5).map((skill: string) => (
                                        <span
                                            key={skill}
                                            className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg text-xs"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                    {req.required_skills?.length > 5 && (
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs">
                                            +{req.required_skills.length - 5} more
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        href={`/organization/matching?requirement_id=${req.id}`}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                    >
                                        View Matches
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to close this requirement?")) {
                                                await fetch('/api/requirements/status', {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ id: req.id, status: 'closed' })
                                                });
                                                window.location.reload();
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                                    >
                                        Close
                                    </button>
                                    <Link
                                        href={`/organization/requirements/${req.id}`}
                                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            No Requirements Yet
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Start by posting your first job requirement
                        </p>
                        <Link
                            href="/organization/requirements/post"
                            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Post Your First Requirement
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
