import AuthForm from "@/components/auth/AuthForm";

/**
 * @feature SUPER_ADMIN_LOGIN
 * @aiNote Separate login portal for super admins only.
 * Super admins have cross-tenant access and platform management capabilities.
 */
export default function SuperAdminLoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Super Admin Branding */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-red-500/30 mb-4">
                        🛡️
                    </div>
                    <h1 className="font-bold text-2xl text-white tracking-tighter">Super Admin Portal</h1>
                    <p className="text-zinc-400 text-sm mt-2">Platform Management Access</p>
                </div>

                <AuthForm mode="login" adminMode={true} />

                <div className="mt-8 text-center">
                    <p className="text-zinc-500 text-xs">
                        This portal is for authorized administrators only.
                    </p>
                    <a
                        href="/login"
                        className="text-zinc-400 text-sm hover:text-white transition-colors mt-4 inline-block"
                    >
                        ← Back to User Login
                    </a>
                </div>
            </div>
        </div>
    );
}
