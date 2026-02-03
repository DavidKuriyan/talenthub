"use client";

import JitsiRoom from "./JitsiRoom";
import { ENGINEER_CONFIG } from "@/lib/jitsi/jitsiRoles";

interface EngineerCallProps {
    roomId: string;
    engineerName: string;
    engineerEmail?: string;
    avatarUrl?: string;
    interviewSubject?: string;
    onMeetingEnd?: () => void;
}

/**
 * @feature ENGINEER_VIDEO_CALL
 * @aiNote Engineer (Participant) video call wrapper with limited controls
 */
export default function EngineerCall({
    roomId,
    engineerName,
    engineerEmail,
    avatarUrl,
    interviewSubject = "TalentHub Interview",
    onMeetingEnd,
}: EngineerCallProps) {
    return (
        <div className="w-full">
            {/* Pre-call Instructions */}
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-emerald-300 mb-1">Interview Tips</h4>
                        <ul className="text-xs text-emerald-200/70 space-y-1">
                            <li>• Ensure stable internet connection</li>
                            <li>• Use headphones for better audio</li>
                            <li>• Find a quiet, well-lit space</li>
                            <li>• Have your resume ready</li>
                        </ul>
                    </div>
                </div>
            </div>

            <JitsiRoom
                roomName={roomId}
                displayName={engineerName}
                email={engineerEmail}
                avatarUrl={avatarUrl}
                roleConfig={ENGINEER_CONFIG}
                subject={interviewSubject}
                onMeetingEnd={onMeetingEnd}
                onParticipantJoined={(p) => console.log("[Engineer] Participant joined:", p)}
                onParticipantLeft={(p) => console.log("[Engineer] Participant left:", p)}
                onError={(e) => console.error("[Engineer] Call error:", e)}
            />
        </div>
    );
}
