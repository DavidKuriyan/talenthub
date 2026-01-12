import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BrandingForm from "@/components/admin/BrandingForm";

/**
 * @feature ORGANIZATION_SETTINGS
 * @aiNote Organization settings page for branding and configuration
 */
export default async function OrganizationSettingsPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/tenant/login");
    }

    const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

    if (!tenantId) {
        redirect("/organization/register");
    }

    // Fetch tenant details
    const { data: tenant } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <Link href="/organization/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Organization Settings
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Configure your organization's branding and preferences
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 space-y-8">
                {/* Organization Info */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Organization Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Organization Name
                            </label>
                            <input
                                type="text"
                                value={(tenant as any)?.name || ""}
                                disabled
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Slug
                            </label>
                            <input
                                type="text"
                                value={(tenant as any)?.slug || ""}
                                disabled
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Status
                        </label>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${(tenant as any)?.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {(tenant as any)?.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Branding Section */}
                <BrandingForm
                    tenantId={tenantId}
                    initialLogo={(tenant as any)?.logo_url || ""}
                    initialColor={(tenant as any)?.primary_color || "#4f46e5"}
                />

                {/* Other Configs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white opacity-80">
                        <div className="text-3xl mb-3">🔔</div>
                        <h3 className="text-lg font-bold mb-2">Email Notifications</h3>
                        <p className="text-white/80 text-sm">
                            Configure SMTP and automated email alerts for matching and interviews
                        </p>
                        <div className="mt-4 px-3 py-1 bg-white/20 rounded-lg text-xs inline-block">
                            Enterprise Feature
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white opacity-80">
                        <div className="text-3xl mb-3">🔐</div>
                        <h3 className="text-lg font-bold mb-2">Security & RLS</h3>
                        <p className="text-white/80 text-sm">
                            Manage strict row-level security and tenant data isolation policies
                        </p>
                        <div className="mt-4 px-3 py-1 bg-white/20 rounded-lg text-xs inline-block">
                            Active (Managed)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
