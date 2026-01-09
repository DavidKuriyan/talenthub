"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AVAILABLE_SKILLS = [
    "React", "Node.js", "Python", "Java", "SQL",
    "DevOps", "Cybersecurity", "Mobile Dev", "UI/UX"
];

/**
 * @feature ENGINEER_MODULE
 * @aiNote Profile editor for engineers. Fetches current profile on mount.
 */
export default function EngineerProfilePage() {
    const [skills, setSkills] = useState<string[]>([]);
    const [experience, setExperience] = useState(0);
    const [resumeUrl, setResumeUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profiles");
            if (res.ok) {
                const data = await res.json();
                if (data.id) { // If profile exists
                    setSkills(data.skills || []);
                    setExperience(data.experience_years || 0);
                    setResumeUrl(data.resume_url || "");
                }
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleSkill = (skill: string) => {
        if (skills.includes(skill)) {
            setSkills(skills.filter(s => s !== skill));
        } else {
            setSkills([...skills, skill]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch("/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skills,
                    experience_years: Number(experience),
                    resume_url: resumeUrl
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(JSON.stringify(data.error) || "Failed to save profile");
            }

            setMessage({ type: 'success', text: "Profile updated successfully!" });
            router.refresh();

        } catch (err: any) {
            console.error("Save Error:", err);
            setMessage({ type: 'error', text: err.message || "An unexpected error occurred" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 flex justify-center">
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Engineer Profile</h1>
                <p className="text-zinc-500 mb-6">Update your skills and experience to get matched with jobs.</p>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">My Skills</label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SKILLS.map(skill => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${skills.includes(skill)
                                            ? "bg-blue-600 text-white shadow-md transform scale-105"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Experience */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Years of Experience</label>
                        <input
                            type="number"
                            value={experience}
                            onChange={(e) => setExperience(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            min="0"
                            max="50"
                            required
                        />
                    </div>

                    {/* Resume URL */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Resume / Portfolio URL</label>
                        <input
                            type="text"
                            value={resumeUrl}
                            onChange={(e) => setResumeUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            placeholder="https://linkedin.com/in/..."
                        />
                    </div>

                    {/* Submit */}
                    <div className="pt-4 flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                        >
                            {saving ? "Saving..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
