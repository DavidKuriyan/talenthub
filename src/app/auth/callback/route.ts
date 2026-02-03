import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * @feature AUTH_CALLBACK
 * @aiNote Handles the OAuth/Email confirmation callback from Supabase.
 * Exchanges the code for a session and redirects appropriately.
 */
export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    // Handle errors from Supabase
    if (error) {
        console.error("[Auth Callback] Error:", error, errorDescription);
        // Redirect to login with error message
        const redirectUrl = new URL("/engineer/login", requestUrl.origin);
        redirectUrl.searchParams.set("error", errorDescription || error);
        return NextResponse.redirect(redirectUrl);
    }

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignore if called from Server Component
                        }
                    },
                },
            }
        );

        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
            console.error("[Auth Callback] Session error:", sessionError);
            const redirectUrl = new URL("/engineer/login", requestUrl.origin);
            redirectUrl.searchParams.set("error", sessionError.message);
            return NextResponse.redirect(redirectUrl);
        }

        // Redirect based on role
        const role = data.user?.user_metadata?.role || data.user?.app_metadata?.role;

        if (role === "provider" || role === "engineer" || role === "subscriber") {
            return NextResponse.redirect(new URL("/engineer/profile", requestUrl.origin));
        } else if (role === "admin" || role === "super_admin") {
            return NextResponse.redirect(new URL("/admin", requestUrl.origin));
        } else {
            return NextResponse.redirect(new URL("/organization/dashboard", requestUrl.origin));
        }
    }

    // No code provided, redirect to login
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
