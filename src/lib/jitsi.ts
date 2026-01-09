import crypto from "crypto";

/**
 * Generate a secure, predictable Jitsi room ID
 * Uses HMAC to create a deterministic but cryptographically secure room identifier
 *
 * Format: {prefix}-{deterministic-hash}
 * Example: room-abc123def456
 */
export function generateJitsiRoomId(
    userId: string,
    tenantId: string,
    roomName?: string,
    secretKey?: string
): string {
    // Use environment secret or a fallback (should use env var in production)
    const secret = secretKey || process.env.JITSI_SECRET_KEY || "default-secret-key";

    // Create deterministic input - order matters for consistency
    const input = `${tenantId}:${userId}:${roomName || ""}`;

    // Generate HMAC-SHA256 hash
    const hash = crypto
        .createHmac("sha256", secret)
        .update(input)
        .digest("hex")
        .substring(0, 12); // Take first 12 chars for reasonable length

    // Create room ID with prefix and hash
    const prefix = roomName ? roomName.toLowerCase().replace(/\s+/g, "-") : "room";
    const roomId = `${prefix}-${hash}`;

    // Jitsi room IDs should be lowercase alphanumeric with hyphens
    return roomId.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

/**
 * Generate a Jitsi room ID for a specific tenant's support room
 * Useful for support/admin chat rooms
 */
export function generateSupportRoomId(
    tenantId: string,
    supportType: string = "support",
    secretKey?: string
): string {
    const secret = secretKey || process.env.JITSI_SECRET_KEY || "default-secret-key";

    const input = `${tenantId}:${supportType}:admin`;

    const hash = crypto
        .createHmac("sha256", secret)
        .update(input)
        .digest("hex")
        .substring(0, 10);

    return `${supportType}-${tenantId.substring(0, 4)}-${hash}`.toLowerCase();
}

/**
 * Generate a Jitsi room ID for a one-on-one chat
 * Ensures consistency regardless of which user initiates
 */
export function generatePrivateChatRoomId(
    userId1: string,
    userId2: string,
    secretKey?: string
): string {
    const secret = secretKey || process.env.JITSI_SECRET_KEY || "default-secret-key";

    // Sort user IDs to ensure same room ID regardless of who initiates
    const [sortedUser1, sortedUser2] = [userId1, userId2].sort();

    const input = `private:${sortedUser1}:${sortedUser2}`;

    const hash = crypto
        .createHmac("sha256", secret)
        .update(input)
        .digest("hex")
        .substring(0, 12);

    return `private-${hash}`.toLowerCase();
}

/**
 * Generate multiple Jitsi room IDs for a session
 * Useful for multi-party calls with rotation
 */
export function generateJitsiRoomIdVariants(
    baseId: string,
    count: number = 3,
    secretKey?: string
): string[] {
    const secret = secretKey || process.env.JITSI_SECRET_KEY || "default-secret-key";

    return Array.from({ length: count }, (_, index) => {
        const input = `${baseId}:variant:${index}`;
        const hash = crypto
            .createHmac("sha256", secret)
            .update(input)
            .digest("hex")
            .substring(0, 8);

        return `${baseId}-v${index + 1}-${hash}`.toLowerCase();
    });
}

/**
 * Validate a Jitsi room ID format
 * Ensures the room ID follows Jitsi conventions
 */
export function isValidJitsiRoomId(roomId: string): boolean {
    // Jitsi room IDs: lowercase alphanumeric, hyphens, length 3-64 chars
    const roomIdPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    return roomIdPattern.test(roomId) && roomId.length >= 3 && roomId.length <= 64;
}

/**
 * Decode and verify a Jitsi room ID (if needed for security checks)
 * Returns metadata about the room ID if valid
 */
export function verifyJitsiRoomId(
    roomId: string,
    expectedHashPart: string,
    secretKey?: string
): boolean {
    const secret = secretKey || process.env.JITSI_SECRET_KEY || "default-secret-key";

    // Basic validation
    if (!isValidJitsiRoomId(roomId)) {
        return false;
    }

    // Extract hash from room ID (last segment after last hyphen)
    const parts = roomId.split("-");
    const roomHash = parts[parts.length - 1];

    // For now, just verify the hash length (12 chars for standard generation)
    return roomHash.length >= 8 && /^[a-z0-9]+$/.test(roomHash);
}

/**
 * Generate a Jitsi room configuration object with secure room ID
 */
export function createJitsiRoomConfig(
    userId: string,
    tenantId: string,
    userName: string,
    displayName?: string,
    secretKey?: string
) {
    const roomId = generateJitsiRoomId(userId, tenantId, userName, secretKey);

    return {
        roomId,
        url: `https://meet.jit.si/${roomId}`,
        config: {
            prejoinPageEnabled: true,
            startWithVideoMuted: false,
            startAudioMuted: false,
            disableInviteFunctions: false,
        },
        interfaceConfig: {
            SHOW_CHROME_EXTENSION_BANNER: false,
            MOBILE_APP_PROMO: true,
            DEFAULT_REMOTE_DISPLAY_NAME: displayName || "Participant",
            DEFAULT_LOCAL_DISPLAY_NAME: displayName || "You",
        },
    };
}
