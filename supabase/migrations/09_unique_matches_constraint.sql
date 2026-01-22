-- Add unique constraint to matches table to prevent duplicates
-- This ensures that a specific engineer can only be matched to a specific job requirement once.

ALTER TABLE matches
ADD CONSTRAINT unique_requirement_profile_match UNIQUE (requirement_id, profile_id);
