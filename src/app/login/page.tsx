"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * @feature auth:login
 * @aiNote Main unified login portal with role selection.
 * Engineers and Organizations have separate login flows.
 * Admin portal is NOT visible here (accessible only at /admin/login).
 */
export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<"engineer" | "organization">("engineer");

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/30 mb-4">
                        T
                    </div>
                    <h1 className="font-bold text-3xl text-white tracking-tighter">TalentHub</h1>
                    <p className="text-zinc-400 text-sm mt-2">Multi-Tenant Workforce Platform</p>
                </div>

                {/* Role Selection Tabs */}
                <div className="flex rounded-2xl bg-zinc-800/50 p-1 mb-8 border border-zinc-700/50">
                    <button
                        onClick={() => setSelectedRole("engineer")}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${selectedRole === "engineer"
                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                                : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        <span className="text-lg">👷</span>
                        Engineer
                    </button>
                    <button
                        onClick={() => setSelectedRole("organization")}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${selectedRole === "organization"
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                                : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        <span className="text-lg">🏢</span>
                        Organization
                    </button>
                </div>

                {/* Role-specific Content */}
                <div className="rounded-3xl border border-zinc-700/50 bg-zinc-800/30 backdrop-blur p-8 shadow-xl">
                    {selectedRole === "engineer" ? (
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                                👷
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Engineer Portal</h2>
                            <p className="text-zinc-400 text-sm mb-8">
                                Find placement opportunities, manage your profile, and connect with recruiters.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/engineer/login"
                                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-emerald-500/30 text-center"
                                >
                                    Sign In as Engineer
                                </Link>
                                <Link
                                    href="/register"
                                    className="w-full py-3 px-6 rounded-xl border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/10 transition-all text-center"
                                >
                                    Register as Engineer
                                </Link>
                            </div>
                            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-emerald-400 text-xs font-medium">✨ Engineer Benefits</p>
                                <ul className="text-zinc-400 text-xs mt-2 space-y-1">
                                    <li>• View matched job requirements</li>
                                    <li>• Schedule video interviews</li>
                                    <li>• Track placement status</li>
                                    <li>• Receive offer letters</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                                🏢
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Organization Portal</h2>
                            <p className="text-zinc-400 text-sm mb-8">
                                Post requirements, find engineers, and manage your recruitment workflow.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/tenant/login"
                                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/30 text-center"
                                >
                                    Sign In to Organization
                                </Link>
                            </div>
                            <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <p className="text-indigo-400 text-xs font-medium">🚀 Organization Features</p>
                                <ul className="text-zinc-400 text-xs mt-2 space-y-1">
                                    <li>• Post job requirements</li>
                                    <li>• View matched engineers</li>
                                    <li>• Schedule interviews via Jitsi</li>
                                    <li>• Send offer letters</li>
                                    <li>• Process payments via Razorpay</li>
                                </ul>
                            </div>
                            <p className="text-zinc-500 text-xs mt-6">
                                Note: You must be registered by your organization admin before logging in.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-zinc-500 text-xs">
                        Multi-tenant SaaS platform powered by Next.js & Supabase
                    </p>
                </div>
            </div>
        </div>
    );
}
