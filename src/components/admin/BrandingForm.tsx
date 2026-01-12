"use client";

import { useState } from "react";

export default function BrandingForm({ initialLogo, initialColor, tenantId }: { initialLogo: string, initialColor: string, tenantId: string }) {
    const [logo, setLogo] = useState(initialLogo);
    const [color, setColor] = useState(initialColor);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            // In a real app, this would be an API call to update the tenant
            // For now, we simulate the update
            const res = await fetch('/api/organization/branding', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, logo_url: logo, primary_color: color })
            });
            const data = await res.json();
            if (data.success) {
                setMessage("Branding updated successfully!");
            } else {
                setMessage("Failed to update branding.");
            }
        } catch (err) {
            setMessage("Error saving branding.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Branding Configuration</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Section */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Organization Logo URL
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 overflow-hidden">
                                {logo ? (
                                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-2xl text-slate-400">🏢</span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={logo}
                                onChange={(e) => setLogo(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                    </div>

                    {/* Color Section */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Primary Theme Color
                        </label>
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-10 rounded-lg shadow-sm border border-white/20"
                                style={{ backgroundColor: color }}
                            />
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full h-10 p-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {saving ? "Saving Changes..." : "Save Branding"}
                    </button>
                    {message && (
                        <p className={`mt-2 text-sm ${message.includes('Error') || message.includes('Failed') ? 'text-red-500' : 'text-green-500 font-medium'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </form>
    );
}
