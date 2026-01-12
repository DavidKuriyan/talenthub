"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * @feature POST_JOB_REQUIREMENT
 * @aiNote Organization portal - post new job requirements
 */
export default function PostRequirementPage() {
    const [formData, setFormData] = useState({
        title: "",
        role: "",
        skills: [] as string[],
        experience_min: 0,
        experience_max: 10,
        salary_min: 0,
        salary_max: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const availableSkills = [
        "React", "Node.js", "Python", "Java", "TypeScript", "AWS", "Docker",
        "Kubernetes", "MongoDB", "PostgreSQL", "GraphQL", "Next.js", "Vue.js",
        "Angular", "Django", "Flask", "Spring Boot", "Microservices", "DevOps",
        "Machine Learning", "AI", "Data Science", "Cybersecurity", "Blockchain"
    ];

    const toggleSkill = (skill: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get current user and tenant
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
            if (!tenantId) throw new Error("No tenant assigned");

            // Create requirement via API
            const res = await fetch("/api/requirements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to post requirement");
            }

            setSuccess(true);
            setTimeout(() => router.push("/organization/requirements"), 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 text-center max-w-md">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Requirement Posted!</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">Redirecting to requirements list...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-5xl mx-auto">
                    <Link href="/organization/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Post New Requirement</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Create a new job requirement to find matching engineers</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Job Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="Senior Full Stack Developer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Role/Position <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="Full Stack Developer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Min Experience (years)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.experience_min}
                                    onChange={(e) => setFormData({ ...formData, experience_min: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Max Experience (years)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.experience_max}
                                    onChange={(e) => setFormData({ ...formData, experience_max: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Min Salary (₹/year)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="10000"
                                value={formData.salary_min}
                                onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="500000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Max Salary (₹/year)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="10000"
                                value={formData.salary_max}
                                onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="1200000"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Required Skills <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {availableSkills.map((skill) => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.skills.includes(skill)
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Selected: {formData.skills.length} skills
                        </p>
                    </div>



                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading || formData.skills.length === 0}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Posting..." : "Post Requirement"}
                        </button>
                        <Link
                            href="/organization/requirements"
                            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
