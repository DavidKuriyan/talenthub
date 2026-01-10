/**
 * Unit tests for the matching algorithm
 * @feature AUTO_MATCHING
 */

import {
    calculateMatchScore,
    getMatchedSkills,
    findMatches,
    isGoodMatch,
    MatchRequirement,
    MatchProfile
} from '@/lib/matching';

describe('calculateMatchScore', () => {
    it('should return 100 for exact skill match', () => {
        const reqSkills = ['React', 'Node.js'];
        const profileSkills = ['React', 'Node.js'];

        expect(calculateMatchScore(reqSkills, profileSkills)).toBe(100);
    });

    it('should return 100 when profile has more skills than required', () => {
        const reqSkills = ['React', 'Node.js'];
        const profileSkills = ['React', 'Node.js', 'Python', 'AWS'];

        expect(calculateMatchScore(reqSkills, profileSkills)).toBe(100);
    });

    it('should return 50 for partial match (1 of 2 skills)', () => {
        const reqSkills = ['React', 'Node.js'];
        const profileSkills = ['React'];

        expect(calculateMatchScore(reqSkills, profileSkills)).toBe(50);
    });

    it('should return 0 when no skills match', () => {
        const reqSkills = ['React', 'Node.js'];
        const profileSkills = ['Python', 'Django'];

        expect(calculateMatchScore(reqSkills, profileSkills)).toBe(0);
    });

    it('should return 0 for empty requirement skills', () => {
        expect(calculateMatchScore([], ['React'])).toBe(0);
    });

    it('should return 0 for empty profile skills', () => {
        expect(calculateMatchScore(['React'], [])).toBe(0);
    });

    it('should be case-insensitive', () => {
        const reqSkills = ['REACT', 'node.js'];
        const profileSkills = ['react', 'NODE.JS'];

        expect(calculateMatchScore(reqSkills, profileSkills)).toBe(100);
    });

    it('should handle whitespace in skill names', () => {
        const reqSkills = [' React ', 'Node.js '];
        const profileSkills = ['React', ' Node.js'];

        expect(calculateMatchScore(reqSkills, profileSkills)).toBe(100);
    });
});

describe('getMatchedSkills', () => {
    it('should return matching skills preserving original case', () => {
        const reqSkills = ['React', 'Node.js', 'TypeScript'];
        const profileSkills = ['react', 'typescript'];

        const matched = getMatchedSkills(reqSkills, profileSkills);

        expect(matched).toContain('React');
        expect(matched).toContain('TypeScript');
        expect(matched).not.toContain('Node.js');
    });

    it('should return empty array when no matches', () => {
        expect(getMatchedSkills(['React'], ['Python'])).toEqual([]);
    });

    it('should handle null/undefined gracefully', () => {
        expect(getMatchedSkills(null as any, ['React'])).toEqual([]);
        expect(getMatchedSkills(['React'], null as any)).toEqual([]);
    });
});

describe('findMatches', () => {
    const mockProfiles: MatchProfile[] = [
        { id: 'p1', user_id: 'u1', skills: ['React', 'Node.js', 'TypeScript'], experience_years: 5 },
        { id: 'p2', user_id: 'u2', skills: ['React'], experience_years: 2 },
        { id: 'p3', user_id: 'u3', skills: ['Python', 'Django'], experience_years: 3 },
        { id: 'p4', user_id: 'u4', skills: ['React', 'Node.js'], experience_years: 4 },
    ];

    it('should return matches sorted by score (highest first)', () => {
        const req: MatchRequirement = { id: 'r1', skills: ['React', 'Node.js'] };

        const matches = findMatches(req, mockProfiles);

        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].score).toBe(100); // p1 and p4 have 100%
        // All returned matches should be in descending order
        for (let i = 1; i < matches.length; i++) {
            expect(matches[i].score).toBeLessThanOrEqual(matches[i - 1].score);
        }
    });

    it('should exclude profiles with 0% match', () => {
        const req: MatchRequirement = { id: 'r1', skills: ['React', 'Node.js'] };

        const matches = findMatches(req, mockProfiles);

        // p3 has Python/Django, should not be in results
        expect(matches.find(m => m.profile_id === 'p3')).toBeUndefined();
    });

    it('should respect the limit parameter', () => {
        const req: MatchRequirement = { id: 'r1', skills: ['React'] };

        const matches = findMatches(req, mockProfiles, 2);

        expect(matches.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for no profiles', () => {
        const req: MatchRequirement = { id: 'r1', skills: ['React'] };

        expect(findMatches(req, [])).toEqual([]);
    });

    it('should include matched_skills in results', () => {
        const req: MatchRequirement = { id: 'r1', skills: ['React', 'Node.js', 'AWS'] };

        const matches = findMatches(req, mockProfiles);

        const p1Match = matches.find(m => m.profile_id === 'p1');
        expect(p1Match).toBeDefined();
        expect(p1Match?.matched_skills).toContain('React');
        expect(p1Match?.matched_skills).toContain('Node.js');
    });
});

describe('isGoodMatch', () => {
    it('should return true for scores >= 70', () => {
        expect(isGoodMatch(70)).toBe(true);
        expect(isGoodMatch(85)).toBe(true);
        expect(isGoodMatch(100)).toBe(true);
    });

    it('should return false for scores < 70', () => {
        expect(isGoodMatch(69)).toBe(false);
        expect(isGoodMatch(50)).toBe(false);
        expect(isGoodMatch(0)).toBe(false);
    });
});
