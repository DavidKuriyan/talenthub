import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import VideoCallContainer from "@/components/video/VideoCallContainer";

/**
 * @feature ENGINEER_INTERVIEWS
 * @aiNote View scheduled interviews for the engineer
 */
export default async function EngineerInterviewsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/engineer/login");
  }

  // Get engineer's profile first
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", session.user.id)
    .single();

  let interviews: any[] = [];
  let tenantsMap: Record<string, string> = {};

  const tenantId =
    session.user.user_metadata?.tenant_id ||
    session.user.app_metadata?.tenant_id;

  if (profile && (profile as any).id && tenantId) {
    // Fetch interviews via matches linked to this profile - With tenant isolation
    const { data: interviewsData, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("scheduled_at", { ascending: true });

    if (!error && interviewsData) {
      // Filter manually for this engineer's profile
      // First get matches for this profile
      const { data: matches } = (await supabase
        .from("matches")
        .select("id, profile_id, requirement_id")
        .eq("profile_id", (profile as any).id)) as { data: any[] | null };

      const matchIds = new Set((matches || []).map((m) => m.id));

      // Filter interviews for these matches
      interviews = interviewsData.filter((i: any) => matchIds.has(i.match_id));

      // Populate matches and requirements manually
      const reqIds = (matches || []).map((m) => m.requirement_id);
      let reqsMap: Record<string, any> = {};
      if (reqIds.length > 0) {
        const { data: reqs } = await supabase
          .from("requirements")
          .select("id, title, tenant_id")
          .in("id", reqIds);
        if (reqs)
          reqsMap = reqs.reduce(
            (acc: any, r: any) => ({ ...acc, [r.id]: r }),
            {},
          );
      }

      const matchesMap = (matches || []).reduce(
        (acc: any, m: any) => ({
          ...acc,
          [m.id]: { ...m, requirements: reqsMap[m.requirement_id] },
        }),
        {},
      );

      interviews = interviews.map((i: any) => ({
        ...i,
        matches: matchesMap[i.match_id],
      }));
    }

    // Fetch tenant names separately to avoid schema cache issues
    const tenantIds = [
      ...new Set(
        interviews
          .map((i: any) => i.matches?.requirements?.tenant_id)
          .filter(Boolean),
      ),
    ];
    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name")
        .in("id", tenantIds);
      if (tenants) {
        tenantsMap = tenants.reduce(
          (acc: any, t: any) => ({ ...acc, [t.id]: t.name }),
          {},
        );
      }
    }
  }

  const upcomingInterviews =
    (interviews as any[]).filter(
      (i) => new Date(i.scheduled_at) > new Date(),
    ) || [];
  const pastInterviews =
    (interviews as any[]).filter(
      (i) => new Date(i.scheduled_at) <= new Date(),
    ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/engineer/profile"
          className="text-emerald-300 hover:text-emerald-100 text-sm mb-4 inline-block"
        >
          ← Back to Profile
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">
          Scheduled Interviews
        </h1>
        <p className="text-emerald-200 mb-8">Manage your interview schedule</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30">
            <p className="text-emerald-400 text-sm mb-1">Total Interviews</p>
            <p className="text-3xl font-bold text-white">
              {interviews?.length || 0}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30">
            <p className="text-emerald-400 text-sm mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-yellow-300">
              {upcomingInterviews.length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30">
            <p className="text-emerald-400 text-sm mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-300">
              {pastInterviews.length}
            </p>
          </div>
        </div>

        {interviews && interviews.length > 0 ? (
          <div className="space-y-6">
            {upcomingInterviews.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">
                  Upcoming Interviews
                </h2>
                <div className="space-y-4">
                  {upcomingInterviews.map((interview: any) => (
                    <div
                      key={interview.id}
                      className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/30"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {interview.matches?.requirements?.title ||
                              "Interview"}
                          </h3>
                          <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">
                            Org:{" "}
                            {tenantsMap[
                              interview.matches?.requirements?.tenant_id
                            ] || "TalentHub Partner"}
                          </p>
                          <p className="text-emerald-200 text-sm">
                            📅{" "}
                            {new Date(interview.scheduled_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-200 border border-yellow-500/50 rounded-full text-xs font-medium">
                          Upcoming
                        </span>
                      </div>

                      {interview.jitsi_room_id && (
                        <div className="mt-4 border border-emerald-500/20 rounded-xl overflow-hidden h-[400px]">
                          <VideoCallContainer
                            roomName={interview.jitsi_room_id}
                            userName={
                              (profile as any)?.full_name ||
                              session.user.user_metadata?.full_name ||
                              "Engineer"
                            }
                            height="100%"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastInterviews.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4">
                  Past Interviews
                </h2>
                <div className="space-y-4">
                  {pastInterviews.map((interview: any) => (
                    <div
                      key={interview.id}
                      className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-emerald-700/20 opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {interview.matches?.requirements?.title ||
                              "Interview"}
                          </h3>
                          <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                            Org:{" "}
                            {tenantsMap[
                              interview.matches?.requirements?.tenant_id
                            ] || "TalentHub Partner"}
                          </p>
                          <p className="text-emerald-200 text-sm">
                            📅{" "}
                            {new Date(interview.scheduled_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-200 border border-green-500/50 rounded-full text-xs font-medium">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl p-12 rounded-2xl border border-emerald-700/30 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-white mb-2">
              No Scheduled Interviews
            </h3>
            <p className="text-emerald-200 mb-6">
              Interviews will appear here when organizations schedule them with
              you
            </p>
            <Link
              href="/engineer/jobs"
              className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              View Matched Jobs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
