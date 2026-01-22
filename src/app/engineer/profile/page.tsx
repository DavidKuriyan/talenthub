"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AVAILABLE_SKILLS = [
    "React", "Node.js", "Python", "Java", "SQL",
    "DevOps", "Cybersecurity", "Mobile Dev", "UI/UX",
    "TypeScript", "AWS", "Docker", "Kubernetes"
];

type ProfileData = {
    id?: string;
    skills: string[];
    experience_years: number;
    resume_url: string;
    address: string;
    city: string;
    country: string;
    education: string;
    degree: string;
    university: string;
    graduation_year: number;
};

export default function EngineerProfilePage() {
    const [profileData, setProfileData] = useState<ProfileData>({
        skills: [],
        experience_years: 0,
        resume_url: "",
        address: "",
        city: "",
        country: "",
        education: "",
        degree: "",
        university: "",
        graduation_year: new Date().getFullYear()
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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
                    setProfileData({
                        id: data.id,
                        skills: data.skills || [],
                        experience_years: data.experience_years || 0,
                        resume_url: data.resume_url || "",
                        address: data.address || "",
                        city: data.city || "",
                        country: data.country || "",
                        education: data.education || "",
                        degree: data.degree || "",
                        university: data.university || "",
                        graduation_year: data.graduation_year || new Date().getFullYear()
                    });
                } else {
                    setIsEditing(true); // New profile
                }
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
            setIsEditing(true);
        } finally {
            setLoading(false);
        }
    };

    const toggleSkill = (skill: string) => {
        setProfileData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
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
                    skills: profileData.skills,
                    experience_years: Number(profileData.experience_years),
                    resume_url: profileData.resume_url,
                    address: profileData.address,
                    city: profileData.city,
                    country: profileData.country,
                    education: profileData.education,
                    degree: profileData.degree,
                    university: profileData.university,
                    graduation_year: Number(profileData.graduation_year)
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(JSON.stringify(data.error) || "Failed to save profile");
            }

            const updatedData = await res.json();
            setProfileData({
                id: updatedData.id,
                skills: updatedData.skills || [],
                experience_years: updatedData.experience_years || 0,
                resume_url: updatedData.resume_url || "",
                address: updatedData.address || "",
                city: updatedData.city || "",
                country: updatedData.country || "",
                education: updatedData.education || "",
                degree: updatedData.degree || "",
                university: updatedData.university || "",
                graduation_year: updatedData.graduation_year || new Date().getFullYear()
            });
            setMessage({ type: 'success', text: profileData.id ? "Profile updated successfully!" : "Profile created successfully!" });
            setIsEditing(false);
            router.refresh();

        } catch (err: unknown) {
            const error = err as Error;
            console.error("Save Error:", error);
            setMessage({ type: 'error', text: error.message || "An unexpected error occurred" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-zinc-400 font-medium tracking-tight">Accessing Secure Records...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-zinc-50 to-teal-50 dark:from-black dark:via-zinc-950 dark:to-emerald-950/20 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tighter">
                            {profileData.id ? "My Profile" : "Create Profile"}
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
                            {isEditing ? "Complete your profile to get matched with opportunities" : "View and manage your professional information"}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {profileData.id && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                            >
                                ✏️ Edit Profile
                            </button>
                        )}
                        <Link
                            href="/engineer/jobs"
                            className="bg-white dark:bg-zinc-900 text-emerald-600 border-2 border-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all hover:scale-105 shadow-lg"
                        >
                            View Jobs →
                        </Link>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl mb-6 text-sm font-bold shadow-lg animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-400 dark:border-green-800'
                        : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200 dark:from-red-900/20 dark:to-rose-900/20 dark:text-red-400 dark:border-red-800'
                        }`}>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
                            {message.text}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Skills Section */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl">🎯</span>
                                    <div>
                                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Technical Skills</h2>
                                        <p className="text-sm text-zinc-500 font-medium">Select your expertise areas</p>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {AVAILABLE_SKILLS.map((skill) => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => toggleSkill(skill)}
                                                className={`p-4 rounded-xl text-sm font-bold transition-all ${profileData.skills.includes(skill)
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                    }`}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.skills.length > 0 ? (
                                            profileData.skills.map(skill => (
                                                <span key={skill} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-zinc-500 italic font-medium">No skills added yet</p>
                                        )}
                                    </div>
                                )}
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-4 font-black uppercase tracking-widest">
                                    {profileData.skills.length} technical skill{profileData.skills.length !== 1 ? "s" : ""} verified
                                </p>
                            </div>

                            {/* Education Section */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl">🎓</span>
                                    <div>
                                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Education Background</h2>
                                        <p className="text-sm text-zinc-500 font-medium">Your academic foundations</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Institution/University</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.university}
                                                onChange={(e) => setProfileData({ ...profileData, university: e.target.value })}
                                                placeholder="e.g. Stanford University"
                                                className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                                            />
                                        ) : (
                                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{profileData.university || "Not specified"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Degree/Major</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.degree}
                                                onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                                                placeholder="e.g. B.S. Computer Science"
                                                className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                                            />
                                        ) : (
                                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{profileData.degree || "Not specified"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Graduation Year</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={profileData.graduation_year}
                                                onChange={(e) => setProfileData({ ...profileData, graduation_year: Number(e.target.value) })}
                                                className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                                            />
                                        ) : (
                                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{profileData.graduation_year}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl">📍</span>
                                    <div>
                                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Location Details</h2>
                                        <p className="text-sm text-zinc-500 font-medium">Where you&apos;re based</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Address</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.address}
                                                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                                placeholder="Street address"
                                                className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                                            />
                                        ) : (
                                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{profileData.address || "Not specified"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">City</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.city}
                                                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                                            />
                                        ) : (
                                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{profileData.city || "Not specified"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Country</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profileData.country}
                                                onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                                            />
                                        ) : (
                                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{profileData.country || "Not specified"}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Experience & Resume */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-3xl">💼</span>
                                    <div>
                                        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Experience & Meta</h2>
                                        <p className="text-sm text-zinc-500 font-medium">Your professional footprint</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                            Years of Experience
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                min="0"
                                                max="50"
                                                value={profileData.experience_years}
                                                onChange={(e) => setProfileData({ ...profileData, experience_years: Number(e.target.value) })}
                                                className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                                            />
                                        ) : (
                                            <p className="text-3xl font-black text-emerald-600 tracking-tighter">{profileData.experience_years} years</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                            Digital Presence (Portfolio/Resume)
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="url"
                                                value={profileData.resume_url}
                                                onChange={(e) => setProfileData({ ...profileData, resume_url: e.target.value })}
                                                placeholder="https://peerlist.io/yourusername"
                                                className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all font-bold"
                                            />
                                        ) : (
                                            profileData.resume_url ? (
                                                <a href={profileData.resume_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-emerald-500 hover:text-emerald-600 underline font-bold tracking-tight">
                                                    {profileData.resume_url}
                                                </a>
                                            ) : (
                                                <p className="text-zinc-500 italic font-medium">Link your digit presence</p>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving || profileData.skills.length === 0}
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20"
                                    >
                                        {saving ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Saving Records...
                                            </span>
                                        ) : (
                                            `Update System Profile`
                                        )}
                                    </button>
                                    {profileData.id && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                fetchProfile();
                                            }}
                                            className="px-8 py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                                        >
                                            Discard Changes
                                        </button>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Links */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-black text-zinc-900 dark:text-zinc-50 mb-6 text-sm uppercase tracking-widest text-center">System Access</h3>
                            <div className="space-y-3">
                                <SidebarLink href="/engineer/jobs" icon="🎯" title="Matched Jobs" />
                                <SidebarLink href="/engineer/interviews" icon="📅" title="Interviews" />
                                <SidebarLink href="/engineer/offers" icon="📄" title="Offer Letters" />
                                <SidebarLink href="/engineer/messages" icon="💬" title="Direct Chat" />
                            </div>
                        </div>

                        {/* Profile Completion */}
                        {profileData.id && (
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
                                <h3 className="font-black mb-6 text-xs uppercase tracking-[0.2em] relative z-10">Data Integrity</h3>
                                <div className="space-y-4 relative z-10">
                                    <CompletionItem label="Core Skills" filled={profileData.skills.length > 0} />
                                    <CompletionItem label="Experience" filled={profileData.experience_years > 0} />
                                    <CompletionItem label="Education" filled={!!profileData.university} />
                                    <CompletionItem label="Location" filled={!!profileData.city} />
                                    <CompletionItem label="Digital Link" filled={!!profileData.resume_url} />
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/20 relative z-10">
                                    <div className="text-4xl font-black tracking-tighter">
                                        {Math.round((
                                            [
                                                profileData.skills.length > 0,
                                                profileData.experience_years > 0,
                                                !!profileData.university,
                                                !!profileData.city,
                                                !!profileData.resume_url
                                            ].filter(Boolean).length / 5) * 100)}%
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Complete</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarLink({ href, icon, title }: { href: string, icon: string, title: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all border border-transparent hover:border-emerald-400 group"
        >
            <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
            <span className="font-bold text-sm tracking-tight">{title}</span>
            <span className="ml-auto opacity-20 group-hover:opacity-100 italic text-[10px]">VISIT</span>
        </Link>
    );
}

function CompletionItem({ label, filled }: { label: string, filled: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs font-bold opacity-80">{label}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-black">{filled ? 'VERIFIED' : 'PENDING'}</span>
        </div>
    );
}
