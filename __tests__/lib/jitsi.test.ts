/**
 * @feature VIDEO_CONFERENCING
 * @aiNote Security-critical: Room ID generation uses HMAC for secure, deterministic identifiers
 * Unit tests for Jitsi room ID generation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    generateJitsiRoomId,
    generateSupportRoomId,
    generatePrivateChatRoomId,
    isValidJitsiRoomId,
    verifyJitsiRoomId
} from '../../src/lib/jitsi';

describe('Jitsi Utilities', () => {
    const TEST_SECRET = 'test-secret-key-for-testing-only';
    const USER_ID = 'user-123';
    const TENANT_ID = 'talenthub';

    describe('generateJitsiRoomId', () => {
        it('should generate a valid room ID', () => {
            const roomId = generateJitsiRoomId(USER_ID, TENANT_ID, undefined, TEST_SECRET);

            expect(roomId).toBeDefined();
            expect(typeof roomId).toBe('string');
            expect(roomId.length).toBeGreaterThan(0);
        });

        it('should generate deterministic room IDs for same inputs', () => {
            const roomId1 = generateJitsiRoomId(USER_ID, TENANT_ID, 'support', TEST_SECRET);
            const roomId2 = generateJitsiRoomId(USER_ID, TENANT_ID, 'support', TEST_SECRET);

            expect(roomId1).toBe(roomId2);
        });

        it('should generate different room IDs for different users', () => {
            const roomId1 = generateJitsiRoomId('user-1', TENANT_ID, undefined, TEST_SECRET);
            const roomId2 = generateJitsiRoomId('user-2', TENANT_ID, undefined, TEST_SECRET);

            expect(roomId1).not.toBe(roomId2);
        });

        it('should generate different room IDs for different tenants', () => {
            const roomId1 = generateJitsiRoomId(USER_ID, 'tenant-1', undefined, TEST_SECRET);
            const roomId2 = generateJitsiRoomId(USER_ID, 'tenant-2', undefined, TEST_SECRET);

            expect(roomId1).not.toBe(roomId2);
        });

        it('should include custom room name in ID', () => {
            const roomId = generateJitsiRoomId(USER_ID, TENANT_ID, 'Support Chat', TEST_SECRET);

            expect(roomId).toContain('support-chat');
        });

        it('should sanitize room names to be URL-safe', () => {
            const roomId = generateJitsiRoomId(USER_ID, TENANT_ID, 'My @Special Room!', TEST_SECRET);

            expect(roomId).toMatch(/^[a-z0-9-]+$/);
            expect(roomId).not.toContain('@');
            expect(roomId).not.toContain('!');
            expect(roomId).not.toContain(' ');
        });

        it('should generate lowercase room IDs', () => {
            const roomId = generateJitsiRoomId(USER_ID, TENANT_ID, 'UPPERCASE', TEST_SECRET);

            expect(roomId).toBe(roomId.toLowerCase());
        });
    });

    describe('generateSupportRoomId', () => {
        it('should generate a support room ID', () => {
            const roomId = generateSupportRoomId(TENANT_ID, 'support', TEST_SECRET);

            expect(roomId).toContain('support');
            expect(roomId).toContain(TENANT_ID.substring(0, 4));
        });

        it('should generate consistent support room IDs', () => {
            const roomId1 = generateSupportRoomId(TENANT_ID, 'help', TEST_SECRET);
            const roomId2 = generateSupportRoomId(TENANT_ID, 'help', TEST_SECRET);

            expect(roomId1).toBe(roomId2);
        });

        it('should use default support type if not specified', () => {
            const roomId = generateSupportRoomId(TENANT_ID, undefined, TEST_SECRET);

            expect(roomId).toContain('support');
        });
    });

    describe('generatePrivateChatRoomId', () => {
        it('should generate same room ID regardless of user order', () => {
            const roomId1 = generatePrivateChatRoomId('user-a', 'user-b', TEST_SECRET);
            const roomId2 = generatePrivateChatRoomId('user-b', 'user-a', TEST_SECRET);

            expect(roomId1).toBe(roomId2);
        });

        it('should start with "private-" prefix', () => {
            const roomId = generatePrivateChatRoomId('user-1', 'user-2', TEST_SECRET);

            expect(roomId).toMatch(/^private-/);
        });

        it('should generate different IDs for different user pairs', () => {
            const roomId1 = generatePrivateChatRoomId('user-1', 'user-2', TEST_SECRET);
            const roomId2 = generatePrivateChatRoomId('user-1', 'user-3', TEST_SECRET);

            expect(roomId1).not.toBe(roomId2);
        });
    });

    describe('isValidJitsiRoomId', () => {
        it('should validate correct room IDs', () => {
            expect(isValidJitsiRoomId('valid-room-123')).toBe(true);
            expect(isValidJitsiRoomId('abc')).toBe(true);
            expect(isValidJitsiRoomId('room-abc123def456')).toBe(true);
        });

        it('should reject invalid room IDs', () => {
            expect(isValidJitsiRoomId('')).toBe(false);
            expect(isValidJitsiRoomId('ab')).toBe(false); // too short
            expect(isValidJitsiRoomId('UPPERCASE')).toBe(false); // uppercase
            expect(isValidJitsiRoomId('room_with_underscores')).toBe(false); // underscores
            expect(isValidJitsiRoomId('room with spaces')).toBe(false); // spaces
            expect(isValidJitsiRoomId('room@special')).toBe(false); // special chars
            expect(isValidJitsiRoomId('-starts-with-hyphen')).toBe(false);
            expect(isValidJitsiRoomId('ends-with-hyphen-')).toBe(false);
        });

        it('should reject room IDs longer than 64 characters', () => {
            const longRoomId = 'a'.repeat(65);
            expect(isValidJitsiRoomId(longRoomId)).toBe(false);
        });

        it('should accept room IDs at maximum length (64 chars)', () => {
            const maxLengthId = 'a'.repeat(64);
            expect(isValidJitsiRoomId(maxLengthId)).toBe(true);
        });
    });

    describe('verifyJitsiRoomId', () => {
        it('should verify valid room IDs', () => {
            const roomId = generateJitsiRoomId(USER_ID, TENANT_ID, undefined, TEST_SECRET);
            const result = verifyJitsiRoomId(roomId, '', TEST_SECRET);

            expect(result).toBe(true);
        });

        it('should reject malformed room IDs', () => {
            expect(verifyJitsiRoomId('invalid_room', '', TEST_SECRET)).toBe(false);
            expect(verifyJitsiRoomId('', '', TEST_SECRET)).toBe(false);
        });

        it('should verify room IDs have valid hash segment', () => {
            const validRoomId = 'room-abc123def456';
            const invalidRoomId = 'room-toolong';

            expect(verifyJitsiRoomId(validRoomId, '', TEST_SECRET)).toBe(true);
            expect(verifyJitsiRoomId(invalidRoomId, '', TEST_SECRET)).toBe(false);
        });
    });

    describe('Security Properties', () => {
        it('should not expose secret key in room ID', () => {
            const roomId = generateJitsiRoomId(USER_ID, TENANT_ID, undefined, TEST_SECRET);

            expect(roomId).not.toContain(TEST_SECRET);
            expect(roomId).not.toContain('secret');
        });

        it('should use different hashes for different secrets', () => {
            const roomId1 = generateJitsiRoomId(USER_ID, TENANT_ID, undefined, 'secret-1');
            const roomId2 = generateJitsiRoomId(USER_ID, TENANT_ID, undefined, 'secret-2');

            expect(roomId1).not.toBe(roomId2);
        });

        it('should prevent room ID collision across tenants', () => {
            const room1 = generateJitsiRoomId('user-1', 'tenant-a', undefined, TEST_SECRET);
            const room2 = generateJitsiRoomId('user-1', 'tenant-b', undefined, TEST_SECRET);

            expect(room1).not.toBe(room2);
        });
    });
});
