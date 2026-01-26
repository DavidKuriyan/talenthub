import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/lib/types";

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

  if (session) {
    const role = session.user.app_metadata?.role || session.user.user_metadata?.role;
    // Root landing page redirects to the correct dashboard based on role
    // NOTE: super_admin and admin default to organization dashboard to avoid unnecessary portal jumps
    if (role === 'provider') {
      redirect("/engineer/dashboard");
    } else {
      redirect("/organization/dashboard");
    }
  } else {
    redirect("/login");
  }

  return null;
}
