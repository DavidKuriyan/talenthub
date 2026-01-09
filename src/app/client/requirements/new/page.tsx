"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AVAILABLE_SKILLS = [
    "React", "Node.js", "Python", "Java", "SQL",
    "DevOps", "Cybersecurity", "Mobile Dev", "UI/UX"
];

/**
 * @feature CLIENT_MODULE
 * @aiNote Client-side form to create new requirements. Validates input and calls /api/requirements.
 */
export default function NewRequirementPage() {
    const [title, setTitle] = useState("");
    const [budget, setBudget] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/requirements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    budget: parseFloat(budget) * 100, // Convert to paise? No, schema comment said paise, but UI is rupees. 
                    // Let's assume input is Rupees. Budget in DB is integer. 
                    // If budget is large, *100 might overflow if not careful, but BigInt is needed for very large.
                    // Let's store in Rupees for simplicity in this MVP section or stick to paise. 
                    // Re-reading schema: "budget INTEGER -- in paise".
                    // So, input * 100.
                    skills: selectedSkills,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(JSON.stringify(data.error) || "Failed to create requirement");
            }

            router.push("/client/dashboard");
            router.refresh();

        } catch (err: any) {
            console.error("Form Error:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 flex justify-center">
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Post New Requirement</h1>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Job Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                            placeholder="e.g. Senior React Developer"
                            required
                        />
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Required Skills</label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SKILLS.map(skill => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedSkills.includes(skill)
                                            ? "bg-black dark:bg-white text-white dark:text-black shadow-md transform scale-105"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                        {selectedSkills.length === 0 && (
                            <p className="text-xs text-red-500 mt-2">Please select at least one skill.</p>
                        )}
                    </div>

                    {/* Budget */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Budget (₹)</label>
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                            placeholder="e.g. 50000"
                            min="100"
                            required
                        />
                    </div>

                    {/* Submit */}
                    <div className="pt-4 flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 font-medium text-sm px-4"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || selectedSkills.length === 0}
                            className="bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Posting..." : "Post Requirement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
