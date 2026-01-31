"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/components/RealtimeProvider";

/**
 * @feature ENGINEER_DASHBOARD
 * @aiNote Premium, high-performance dashboard for engineers.
 */
export default function EngineerDashboard() {
    const [stats, setStats] = useState({
        matches: 0,
        interviews: 0,
        offers: 0,
        messages: 0
    });
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const lastUpdate = useRealtime();

    useEffect(() => {
        fetchData();
    }, [lastUpdate]);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch Profile
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", session.user.id)
                .maybeSingle();
            setProfile(profileData as any);
            const p = profileData as any;

            if (p) {
                // Fetch Matches first to get IDs for interviews/offers
                const { data: matchesData } = await (supabase
                    .from("matches")
                    .select("id")
                    .eq("profile_id", p.id) as any);

                const matchIds = matchesData?.map((m: any) => m.id) || [];

                // Fetch other stats in parallel
                const [interviewsRes, offersRes, messagesRes] = await Promise.all([
                    matchIds.length > 0
                        ? supabase.from("interviews").select("id", { count: 'exact', head: true }).in("match_id", matchIds)
                        : Promise.resolve({ count: 0 }),
                    matchIds.length > 0
                        ? supabase.from("offer_letters").select("id", { count: 'exact', head: true }).in("match_id", matchIds)
                        : Promise.resolve({ count: 0 }),
                    supabase.from("messages").select("id", { count: 'exact', head: true }).eq("tenant_id", p.tenant_id)
                ]);

                setStats({
                    matches: matchIds.length,
                    interviews: (interviewsRes as any).count || 0,
                    offers: (offersRes as any).count || 0,
                    messages: messagesRes.count || 0
                });
            }
        } catch (e) {
            console.error("Dashboard error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-sans selection:bg-emerald-500/30">
            <div className="max-w-7xl mx-auto">
                {/* Top Nav/Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            Engineer Portal
                        </h1>
                        <p className="text-zinc-500 mt-2 font-medium tracking-tight">Welcome back. Your next career milestone is waiting.</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/engineer/profile" className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all font-bold text-sm flex items-center gap-2">
                            <span>Profile Details</span>
                            <span className="opacity-40">→</span>
                        </Link>
                    </div>
                </header>

                {!profile && (
                    <div className="mb-12 p-8 rounded-[2rem] bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 backdrop-blur-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-yellow-500 mb-2 flex items-center gap-2">
                                <span>⚠️</span> Profile Incomplete
                            </h2>
                            <p className="text-zinc-400 max-w-xl mb-6">Recruiters can only find you if your profile is complete. Add your skills and experience to start receiving job matches.</p>
                            <Link href="/engineer/profile" className="px-8 py-4 bg-yellow-500 text-black rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all inline-block shadow-lg shadow-yellow-500/20">
                                Complete Profile Now
                            </Link>
                        </div>
                    </div>
                )}

                {/* Main Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <DashboardCard title="Job Matches" value={stats.matches} icon="🎯" color="emerald" link="/engineer/jobs" />
                    <DashboardCard title="Interviews" value={stats.interviews} icon="📅" color="blue" link="/engineer/interviews" />
                    <DashboardCard title="Offer Letters" value={stats.offers} icon="📄" color="purple" link="/engineer/offers" />
                    <DashboardCard title="Unread Chat" value={stats.messages} icon="💬" color="cyan" link="/engineer/messages" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Actions / Activity */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 backdrop-blur-3xl">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold tracking-tight">Recommended Action</h2>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">System AI</span>
                            </div>

                            <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-6 rounded-3xl border border-emerald-500/20 flex flex-col md:flex-row items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/20 shrink-0">✨</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Optimize for the Market</h3>
                                    <p className="text-zinc-500 text-sm">We noticed your experience section is concise. Detailed experience increases matching score by <span className="text-emerald-400 font-bold">24%</span>.</p>
                                </div>
                                <Link href="/engineer/profile" className="md:ml-auto px-6 py-3 bg-white text-black rounded-2xl font-bold text-sm whitespace-nowrap hover:scale-105 transition-all">
                                    Improve Details
                                </Link>
                            </div>
                        </section>

                        <section className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/5 backdrop-blur-3xl">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <QuickAction icon="🔎" title="Browse Global Challenges" desc="Find open bounties and tasks" />
                                <QuickAction icon="🏗️" title="Portfolio Sync" desc="Connect GitHub or Portfolio link" />
                                <QuickAction icon="🛡️" title="Auth Settings" desc="Secure your account access" />
                                <QuickAction icon="⚙️" title="Preferences" desc="Notification and matching filters" />
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        <section className="p-8 rounded-[2.5rem] bg-gradient-to-b from-zinc-800/10 to-transparent border border-white/5">
                            <h3 className="text-lg font-bold mb-6">Profile Snapshot</h3>
                            {profile ? (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills?.map((s: string) => (
                                            <span key={s} className="px-3 py-1.5 bg-zinc-800 rounded-xl text-xs font-medium text-zinc-300 border border-white/5">{s}</span>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-zinc-900/80 rounded-2xl border border-white/5">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-black mb-1">Experience</p>
                                        <p className="text-2xl font-bold">{profile.experience_years} Years</p>
                                    </div>
                                    <Link href="/engineer/profile" className="block text-center py-3 text-emerald-400 text-sm font-bold hover:underline">
                                        Edit Full Profile
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-zinc-600 text-sm mb-4 italic">No profile data found</p>
                                    <Link href="/engineer/profile" className="text-emerald-400 font-bold text-sm">Create Profile</Link>
                                </div>
                            )}
                        </section>

                        <section className="p-8 rounded-[2.5rem] bg-emerald-500 text-black shadow-2xl shadow-emerald-500/20">
                            <h3 className="text-xl font-black mb-2 italic">TALENT HUB PRO</h3>
                            <p className="text-xs font-bold text-emerald-950/60 mb-6 uppercase tracking-tight">Coming Soon for verified engineers</p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-sm font-bold"><span>✅</span> Priority Listing</li>
                                <li className="flex items-center gap-2 text-sm font-bold"><span>✅</span> Skill Certification</li>
                                <li className="flex items-center gap-2 text-sm font-bold"><span>✅</span> Instant Payments</li>
                            </ul>
                            <button className="w-full py-4 bg-emerald-950 text-white rounded-2xl font-bold text-xs hover:bg-emerald-900 transition-colors">
                                GET EARLY ACCESS
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardCard({ title, value, icon, color, link }: any) {
    const colors: any = {
        emerald: "from-emerald-500/20 to-transparent border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400",
        blue: "from-blue-500/20 to-transparent border-blue-500/20 hover:border-blue-500/40 text-blue-400",
        purple: "from-purple-500/20 to-transparent border-purple-500/20 hover:border-purple-500/40 text-purple-400",
        cyan: "from-cyan-500/20 to-transparent border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400"
    };

    return (
        <Link href={link} className={`p-6 rounded-[2rem] bg-gradient-to-br border transition-all hover:scale-[1.03] group ${colors[color]}`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{icon}</span>
                <span className="text-white/20 group-hover:text-white/40 transition-colors">→</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 group-hover:opacity-100 transition-opacity">{title}</p>
            <p className="text-3xl font-black text-white group-hover:translate-x-1 transition-transform">{value}</p>
        </Link>
    );
}

function QuickAction({ icon, title, desc }: any) {
    return (
        <div className="p-5 rounded-2xl bg-zinc-800/20 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-5 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <h4 className="font-bold text-sm">{title}</h4>
                <p className="text-xs text-zinc-600">{desc}</p>
            </div>
        </div>
    );
}
