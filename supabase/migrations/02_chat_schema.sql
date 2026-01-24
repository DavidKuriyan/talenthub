-- Messages Table for Realtime Chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'organization',
  content TEXT NOT NULL,
  deleted_by UUID[] DEFAULT ARRAY[]::uuid[],
  created_at TIMESTAMPTZ DEFAULT now(),
  is_system_message BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Participants (Client & Engineer) can SELECT messages for their matches
CREATE POLICY "Participants can view messages" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
      AND (
        m.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND
        (
            -- User is the Client in the match (derived from requirement -> client_id ?? No, matches has profile_id and requirement_id)
            -- Wait, matches links requirement (which has client_id) and profile (which has user_id).
            -- We need to join.
            
            -- Simplified for MVP: rely on Match participants checking.
            -- Actually, for RLS to be secure, we need to join deeply or ensure match_id implies access.
            -- Let's stick to a simpler policy: 
            -- A user can read if they are the sender OR if they are part of the match.
            
            -- Complex Join Policy:
            auth.uid() = messages.sender_id
            OR
            EXISTS (
              SELECT 1 FROM matches m2
              JOIN requirements r ON m2.requirement_id = r.id
              JOIN profiles p ON m2.profile_id = p.id
              WHERE m2.id = messages.match_id
              AND (r.client_id = auth.uid() OR p.user_id = auth.uid())
            )
        )
      )
    )
  );

-- 2. Participants can INSERT messages into their matches
CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND
    EXISTS (
        SELECT 1 FROM matches m2
        JOIN requirements r ON m2.requirement_id = r.id
        JOIN profiles p ON m2.profile_id = p.id
        WHERE m2.id = messages.match_id
        AND (r.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- Function to soft delete a message for a specific user
CREATE OR REPLACE FUNCTION soft_delete_message(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET deleted_by = array_append(COALESCE(deleted_by, ARRAY[]::UUID[]), user_id)
    WHERE id = message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
