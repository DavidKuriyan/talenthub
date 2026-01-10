/**
 * @feature AUTO_MATCHING
 * Skills-based matching algorithm for requirements and profiles
 * 
 * @aiNote This is a pure function with no side effects - safe to modify.
 * Changes here do NOT affect RLS or database policies.
 * 
 * @businessRule Match scores determine candidate ranking for clients.
 * Score >= 70 is considered a "good match" for auto-suggestions.
 */

// Types for matching (minimal, self-contained)
export interface MatchRequirement {
    id: string;
    skills: string[];
    budget?: number;
}

export interface MatchProfile {
    id: string;
    user_id: string;
    skills: string[];
    experience_years: number;
}

export interface MatchResult {
    profile_id: string;
    user_id: string;
    score: number;
    matched_skills: string[];
    total_skills_required: number;
}

/**
 * Calculate match score between a requirement and a profile
 * @param requirementSkills - Skills required by the client
 * @param profileSkills - Skills the engineer has
 * @returns score 0-100 based on skill overlap percentage
 * 
 * @example
 * calculateMatchScore(['React', 'Node.js'], ['React', 'Node.js', 'Python']) // 100
 * calculateMatchScore(['React', 'Node.js'], ['React']) // 50
 * calculateMatchScore(['React'], ['Python']) // 0
 */
export function calculateMatchScore(
    requirementSkills: string[],
    profileSkills: string[]
): number {
    if (!requirementSkills || requirementSkills.length === 0) return 0;
    if (!profileSkills || profileSkills.length === 0) return 0;

    // Normalize skills (case-insensitive matching)
    const normalizedReq = requirementSkills.map(s => s.toLowerCase().trim());
    const normalizedProfile = profileSkills.map(s => s.toLowerCase().trim());

    // Count matching skills
    const matchedCount = normalizedReq.filter(skill =>
        normalizedProfile.includes(skill)
    ).length;

    // Score = percentage of required skills matched
    return Math.round((matchedCount / normalizedReq.length) * 100);
}

/**
 * Get the list of matched skills between requirement and profile
 */
export function getMatchedSkills(
    requirementSkills: string[],
    profileSkills: string[]
): string[] {
    if (!requirementSkills || !profileSkills) return [];

    const normalizedProfile = profileSkills.map(s => s.toLowerCase().trim());

    return requirementSkills.filter(skill =>
        normalizedProfile.includes(skill.toLowerCase().trim())
    );
}

/**
 * Find top matching profiles for a requirement
 * @param requirement - The job requirement with skills
 * @param profiles - Available engineer profiles
 * @param limit - Maximum matches to return (default: 5)
 * @returns Sorted array of matches with scores (highest first)
 */
export function findMatches(
    requirement: MatchRequirement,
    profiles: MatchProfile[],
    limit: number = 5
): MatchResult[] {
    if (!profiles || profiles.length === 0) return [];

    const results: MatchResult[] = profiles.map(profile => ({
        profile_id: profile.id,
        user_id: profile.user_id,
        score: calculateMatchScore(requirement.skills, profile.skills),
        matched_skills: getMatchedSkills(requirement.skills, profile.skills),
        total_skills_required: requirement.skills.length
    }));

    // Sort by score (descending), then by number of matched skills
    return results
        .filter(r => r.score > 0) // Only include profiles with at least one match
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.matched_skills.length - a.matched_skills.length;
        })
        .slice(0, limit);
}

/**
 * Check if a match score qualifies as a "good match"
 * @businessRule Threshold of 70% is the minimum for auto-suggestions
 */
export function isGoodMatch(score: number): boolean {
    return score >= 70;
}
