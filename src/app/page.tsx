import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/lib/types";
import Link from "next/link";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'talenthub-session',
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // If logged in, redirect to appropriate dashboard
  if (session) {
    const role = session.user.app_metadata?.role || session.user.user_metadata?.role;
    if (role === 'provider') {
      redirect("/engineer/profile");
    } else {
      redirect("/organization/dashboard");
    }
  }

  // Landing page for non-logged-in users
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight">
            TalentHub
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-medium max-w-2xl mx-auto">
            Multi-tenant talent marketplace connecting organizations with world-class engineers
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Organization Login */}
          <Link
            href="/organization/login"
            className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-500 p-8 rounded-3xl shadow-2xl hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-100"
          >
            <div className="relative z-10 space-y-4">
              <div className="text-5xl">🏢</div>
              <h2 className="text-2xl font-black text-white">Organization</h2>
              <p className="text-indigo-100 text-sm">
                Find and hire top engineering talent
              </p>
              <div className="inline-flex items-center gap-2 text-white font-bold text-sm">
                Login / Register
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* Engineer Login */}
          <Link
            href="/login"
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-500 p-8 rounded-3xl shadow-2xl hover:shadow-emerald-500/30 transition-all hover:scale-105 active:scale-100"
          >
            <div className="relative z-10 space-y-4">
              <div className="text-5xl">👨‍💻</div>
              <h2 className="text-2xl font-black text-white">Engineer</h2>
              <p className="text-emerald-100 text-sm">
                Showcase your skills and get hired
              </p>
              <div className="inline-flex items-center gap-2 text-white font-bold text-sm">
                Login / Register
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 pt-12 text-zinc-400">
          <div className="space-y-2">
            <div className="text-3xl">⚡</div>
            <h3 className="text-white font-bold">Real-time Messaging</h3>
            <p className="text-sm">Instant communication with candidates</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🔒</div>
            <h3 className="text-white font-bold">Secure Multi-tenant</h3>
            <p className="text-sm">Enterprise-grade data isolation</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🎯</div>
            <h3 className="text-white font-bold">Smart Matching</h3>
            <p className="text-sm">AI-powered talent recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
