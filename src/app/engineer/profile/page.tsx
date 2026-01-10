"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AVAILABLE_SKILLS = [
    "React", "Node.js", "Python", "Java", "SQL",
    "DevOps", "Cybersecurity", "Mobile Dev", "UI/UX",
    "TypeScript", "AWS", "Docker", "Kubernetes"
];

const AVAILABILITY_OPTIONS = [
    { value: "available", label: "Available", color: "emerald" },
    { value: "busy", label: "Busy (Limited)", color: "yellow" },
    { value: "unavailable", label: "Not Available", color: "red" }
];

/**
 * @feature ENGINEER_MODULE
 * @aiNote Enhanced profile editor for engineers with availability and resume upload.
 */
export default function EngineerProfilePage() {
    const [skills, setSkills] = useState<string[]>([]);
    const [experience, setExperience] = useState(0);
    const [resumeUrl, setResumeUrl] = useState("");
    const [availability, setAvailability] = useState<"available" | "busy" | "unavailable">("available");
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
                if (data.id) {
                    setSkills(data.skills || []);
                    setExperience(data.experience_years || 0);
                    setResumeUrl(data.resume_url || "");
                    setAvailability(data.availability || "available");
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
                    resume_url: resumeUrl,
                    availability
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

    if (loading) return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-zinc-500">Loading profile...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Engineer Profile</h1>
                        <p className="text-zinc-500 mt-1">Update your skills and experience to get matched with jobs</p>
                    </div>
                    <Link
                        href="/engineer/jobs"
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                        View Matched Jobs →
                    </Link>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm space-y-8">
                            {/* Skills */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">My Skills</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_SKILLS.map(skill => (
                                        <button
                                            key={skill}
                                            type="button"
                                            onClick={() => toggleSkill(skill)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${skills.includes(skill)
                                                ? "bg-emerald-600 text-white shadow-md transform scale-105"
                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                                }`}
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-400 mt-2">Selected: {skills.length} skills</p>
                            </div>

                            {/* Experience */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Years of Experience</label>
                                <input
                                    type="number"
                                    value={experience}
                                    onChange={(e) => setExperience(Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                                    min="0"
                                    max="50"
                                    required
                                />
                            </div>

                            {/* Resume URL */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Resume / Portfolio URL</label>
                                <input
                                    type="text"
                                    value={resumeUrl}
                                    onChange={(e) => setResumeUrl(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                                    placeholder="https://linkedin.com/in/..."
                                />
                                <p className="text-xs text-zinc-400 mt-2">Link to your LinkedIn, GitHub, or portfolio site</p>
                            </div>

                            {/* Submit */}
                            <div className="pt-4 flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                                >
                                    {saving ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Availability Card */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4">Availability Status</h3>
                            <div className="space-y-2">
                                {AVAILABILITY_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setAvailability(opt.value as any)}
                                        className={`w-full p-3 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3 ${availability === opt.value
                                            ? opt.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-2 ring-emerald-500'
                                                : opt.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ring-2 ring-yellow-500'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-2 ring-red-500'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        <span className={`w-3 h-3 rounded-full ${opt.color === 'emerald' ? 'bg-emerald-500' :
                                                opt.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}></span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 mb-4">Quick Links</h3>
                            <div className="space-y-2">
                                <Link href="/engineer/jobs" className="block p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium">
                                    📋 View Matched Jobs
                                </Link>
                                <Link href="/engineer/interviews" className="block p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium">
                                    🎥 Scheduled Interviews
                                </Link>
                                <Link href="/engineer/offers" className="block p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium">
                                    📄 Offer Letters
                                </Link>
                                <Link href="/engineer/payments" className="block p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium">
                                    💰 Payment Status
                                </Link>
                                <Link href="/chat" className="block p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium">
                                    💬 Messages
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
