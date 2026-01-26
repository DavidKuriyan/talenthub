-- ============================================================
-- FEATURE: Message Read Status
-- ============================================================

-- 1. Add 'read_at' column to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 2. Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_match_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET read_at = now()
    WHERE match_id = p_match_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID, UUID) TO authenticated;
