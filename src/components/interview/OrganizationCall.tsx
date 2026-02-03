"use client";

import JitsiRoom from "./JitsiRoom";
import { ORG_CONFIG } from "@/lib/jitsi/jitsiRoles";

interface OrganizationCallProps {
    roomId: string;
    organizationName: string;
    recruiterName?: string;
    email?: string;
    avatarUrl?: string;
    candidateName?: string;
    interviewSubject?: string;
    onMeetingEnd?: () => void;
}

/**
 * @feature ORGANIZATION_VIDEO_CALL
 * @aiNote Organization (Host/Moderator) video call wrapper with full controls
 */
export default function OrganizationCall({
    roomId,
    organizationName,
    recruiterName,
    email,
    avatarUrl,
    candidateName,
    interviewSubject,
    onMeetingEnd,
}: OrganizationCallProps) {
    const displayName = recruiterName || organizationName;
    const subject = interviewSubject || `Interview with ${candidateName || "Candidate"}`;

    return (
        <div className="w-full">
            {/* Host Controls Panel */}
            <div className="mb-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-indigo-300 mb-1">Host Controls Available</h4>
                            <ul className="text-xs text-indigo-200/70 space-y-0.5">
                                <li>• Mute all participants</li>
                                <li>• Screen sharing</li>
                                <li>• Recording (if enabled)</li>
                                <li>• Participant management</li>
                            </ul>
                        </div>
                    </div>
                    {candidateName && (
                        <div className="text-right">
                            <p className="text-xs text-indigo-400 uppercase tracking-wider font-bold">Interviewing</p>
                            <p className="text-sm font-bold text-white">{candidateName}</p>
                        </div>
                    )}
                </div>
            </div>

            <JitsiRoom
                roomName={roomId}
                displayName={displayName}
                email={email}
                avatarUrl={avatarUrl}
                roleConfig={ORG_CONFIG}
                subject={subject}
                onMeetingEnd={onMeetingEnd}
                onParticipantJoined={(p) => console.log("[Org] Participant joined:", p)}
                onParticipantLeft={(p) => console.log("[Org] Participant left:", p)}
                onError={(e) => console.error("[Org] Call error:", e)}
            />
        </div>
    );
}
