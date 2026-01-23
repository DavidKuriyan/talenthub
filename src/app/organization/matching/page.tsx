"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Requirement {
    id: string;
    title: string;
    role: string;
    required_skills: string[];
    experience_min: number;
    experience_max: number;
    salary_min: number;
    salary_max: number;
    status: string;
    tenant_id: string;
}

interface EngineerProfile {
    id: string;
    full_name: string;
    skills: string[];
    experience_years: number;
    tenant_id: string;
}

interface Match {
    id: string;
    requirement_id: string;
    engineer_id: string;
    score: number;
    status: string;
    profiles?: EngineerProfile;
}

function MatchingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requirementId = searchParams.get("requirement_id");

    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [engineers, setEngineers] = useState<EngineerProfile[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/organization/login");
                return;
            }

            const tid = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
            if (!tid) {
                router.push("/organization/register");
                return;
            }
            setTenantId(tid);
            fetchData(tid);
        };

        checkSession();
    }, [router]);

    const fetchData = async (tid: string) => {
        setLoading(true);
        try {
            // Fetch requirements
            const { data: reqs } = await supabase
                .from("requirements")
                .select("*")
                .eq("tenant_id", tid)
                .eq("status", "open")
                .order("created_at", { ascending: false });
            setRequirements(reqs as Requirement[] || []);

            // Fetch engineers
            const { data: engs } = await supabase
                .from("profiles")
                .select("*")
                .eq("tenant_id", tid);
            setEngineers(engs as EngineerProfile[] || []);

            // If requirement selected, fetch matches
            if (requirementId) {
                const selected = (reqs as Requirement[] | null)?.find((r: Requirement) => r.id === requirementId);
                setSelectedRequirement(selected || null);

                const { data: exMatches } = await supabase
                    .from("matches")
                    .select(`
                        *,
                        profiles:engineer_id (*)
                    `)
                    .eq("requirement_id", requirementId);
                setMatches(exMatches as unknown as Match[] || []);
            } else {
                setSelectedRequirement(null);
                setMatches([]);
            }
        } catch (error) {
            console.error("Error fetching matching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when requirementId changes
    useEffect(() => {
        if (tenantId) {
            fetchData(tenantId);
        }
    }, [requirementId, tenantId]);

    const handleCreateMatch = async (engineerId: string, score: number) => {
        if (!requirementId) return;
        try {
            const { error } = await supabase
                .from("matches")
                .insert({
                    requirement_id: requirementId,
                    engineer_id: engineerId,
                    score: score,
                    status: 'pending'
                } as any);
            if (error) throw error;
            fetchData(tenantId!);
            alert("✅ Match created successfully!");
        } catch (error: any) {
            console.error("Error creating match:", error?.message || error);
            alert("Failed to create match: " + (error?.message || "Unknown error"));
        }
    };

    const handleRecruit = async (matchId: string, engineerId: string) => {
        if (!confirm("Recruit this engineer as a full-time employee?")) return;
        try {
            const res = await fetch('/api/recruit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, engineerId })
            });
            if (!res.ok) throw new Error("Failed to recruit");
            fetchData(tenantId!);
        } catch (error) {
            console.error("Error recruiting:", error);
            alert("Failed to recruit engineer");
        }
    };

    if (loading && !requirements.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <Link href="/organization/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Engineer Matching</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Match engineers to job requirements
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Requirement Selector */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Select Requirement to Match
                    </label>
                    <select
                        value={requirementId || ""}
                        onChange={(e) => router.push(`/organization/matching?requirement_id=${e.target.value}`)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                    >
                        <option value="">-- Select a requirement --</option>
                        {requirements.map((req: Requirement) => (
                            <option key={req.id} value={req.id}>
                                {req.title} ({req.role})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedRequirement ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Requirement Details */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                Requirement Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Title</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {selectedRequirement.title}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Required Skills</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {selectedRequirement.required_skills?.map((skill: string) => (
                                            <span key={skill} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg text-xs font-medium border border-indigo-200/50 dark:border-indigo-700/30">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Experience Range</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                                            {selectedRequirement.experience_min}-{selectedRequirement.experience_max} years
                                        </p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Annual Salary</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                                            ₹{(selectedRequirement.salary_min / 100000).toFixed(1)}L - ₹{(selectedRequirement.salary_max / 100000).toFixed(1)}L
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                                    Active Matches ({matches.length})
                                </h3>
                                {matches.length > 0 ? (
                                    <div className="space-y-3">
                                        {matches.map((match: Match) => (
                                            <div key={match.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {match.profiles?.full_name || `Engineer #${match.engineer_id.substring(0, 8)}`}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Match Score: {match.score}%</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${match.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        match.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {match.status}
                                                    </span>
                                                    {match.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleRecruit(match.id, match.engineer_id)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                                                        >
                                                            Recruit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500">No active matches for this requirement yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Available Engineers */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                Available Engineers ({engineers.length})
                            </h2>
                            {engineers.length > 0 ? (
                                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                    {engineers.map((engineer: EngineerProfile) => {
                                        const matchingSkills = engineer.skills?.filter((s: string) =>
                                            selectedRequirement.required_skills?.includes(s)
                                        ) || [];
                                        const matchScore = selectedRequirement.required_skills?.length > 0
                                            ? Math.round((matchingSkills.length / selectedRequirement.required_skills.length) * 100)
                                            : 0;

                                        const experienceMatch = engineer.experience_years >= selectedRequirement.experience_min &&
                                            engineer.experience_years <= selectedRequirement.experience_max;

                                        const isAlreadyMatched = matches.some((m: Match) => m.engineer_id === engineer.id);

                                        return (
                                            <div key={engineer.id} className={`p-4 rounded-2xl border transition-all ${isAlreadyMatched ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 shadow-sm'}`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-900 dark:text-white">
                                                            {engineer.full_name || `Engineer #${engineer.id.substring(0, 8)}`}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold">
                                                                {engineer.experience_years}Y EXP
                                                            </span>
                                                            {experienceMatch && (
                                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">✓ Exp Match</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${matchScore >= 70 ? 'bg-emerald-500 text-white' :
                                                        matchScore >= 40 ? 'bg-amber-500 text-white' :
                                                            'bg-rose-500 text-white'
                                                        }`}>
                                                        {matchScore}% Match
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(engineer.skills || []).slice(0, 6).map((skill: string) => (
                                                            <span
                                                                key={skill}
                                                                className={`px-2 py-1 rounded-md text-[10px] font-medium ${matchingSkills.includes(skill)
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-700/30'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                                                    }`}
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {engineer.skills?.length > 6 && (
                                                            <span className="text-[10px] text-slate-400 pt-1">+{engineer.skills.length - 6} more</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isAlreadyMatched ? (
                                                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20 text-emerald-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                        Matched
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreateMatch(engineer.id, matchScore)}
                                                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98]"
                                                    >
                                                        Match with Requirement
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="text-4xl mb-4 opacity-20">👥</div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        No engineers found in the talent pool for your organization.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-20 text-center border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">🎯</div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                            Start Matching Engineers
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                            Pick an open requirement from the dropdown menu above to see the best matches from our talent pool.
                        </p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}

export default function MatchingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        }>
            <MatchingContent />
        </Suspense>
    );
}
