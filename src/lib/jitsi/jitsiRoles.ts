/**
 * @feature JITSI_ROLES
 * @aiNote Role-based Jitsi configurations for different user types
 */

// Engineer (Participant) - Limited controls
export const ENGINEER_CONFIG = {
    TOOLBAR_BUTTONS: [
        "microphone",
        "camera",
        "chat",
        "raisehand",
        "tileview",
        "fullscreen",
        "hangup"
    ],
    SETTINGS_SECTIONS: ["devices", "language"],
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
    MOBILE_APP_PROMO: false,
    SHOW_CHROME_EXTENSION_BANNER: false,
};

// Organization Admin (Host/Moderator) - Full controls
export const ORG_CONFIG = {
    TOOLBAR_BUTTONS: [
        "microphone",
        "camera",
        "chat",
        "desktop", // Screen sharing
        "raisehand",
        "participants-pane",
        "tileview",
        "security", // Meeting settings
        "mute-everyone",
        "mute-video-everyone",
        "fullscreen",
        "recording", // Recording if available
        "hangup"
    ],
    SETTINGS_SECTIONS: ["devices", "language", "moderator", "profile"],
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
    MOBILE_APP_PROMO: false,
    SHOW_CHROME_EXTENSION_BANNER: false,
};

// Base Jitsi configuration - allows anyone to join without waiting for moderator
export const BASE_JITSI_CONFIG = {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableWelcomePage: false,
    prejoinPageEnabled: false,  // Skip pre-join screen
    disableDeepLinking: true,
    disableInviteFunctions: true,
    enableNoisyMicDetection: true,
    enableClosePage: false,
    hideConferenceSubject: false,
    hideConferenceTimer: false,
    // CRITICAL: These settings allow meetings without moderator
    enableLobby: false,         // Disable lobby/waiting room
    hiddenPremeetingButtons: ['invite'], // Hide invite button
    disableModeratorIndicator: false,
    startAudioOnly: false,
    requireDisplayName: false,  // Don't force display name entry
    enableInsecureRoomNameWarning: false, // Disable room name warning
};

// Generate secure room name
export const generateRoomName = (interviewId: string): string => {
    const prefix = "TalentHub";
    const timestamp = Date.now().toString(36);
    return `${prefix}_${interviewId}_${timestamp}`;
};
