import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";

/**
 * @feature ROLE_BASED_DASHBOARD
 * @aiNote Universal dashboard that routes users to their role-specific page.
 * admin → /admin
 * provider → /engineer/profile
 * subscriber → /client/dashboard
 */
export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect("/login");
    }

    // Get user role from metadata
    const role = session.user.user_metadata?.role || session.user.app_metadata?.role;

    // Route based on role
    switch (role) {
        case "admin":
        case "super_admin":
            redirect("/admin");
            break;
        case "provider":
            redirect("/engineer/profile");
            break;
        case "subscriber":
        default:
            redirect("/client/dashboard");
            break;
    }

    // Fallback (should not reach here)
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Redirecting to your dashboard...</p>
        </div>
    );
}
