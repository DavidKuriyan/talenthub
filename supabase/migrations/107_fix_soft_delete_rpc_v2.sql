-- Fix soft_delete_message RPC to use correct 'deleted_for' column
-- Previous version referenced 'deleted_by' which was dropped

CREATE OR REPLACE FUNCTION public.soft_delete_message(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET deleted_for = array_append(COALESCE(deleted_for, ARRAY[]::UUID[]), user_id)
    WHERE id = message_id 
    -- Avoid duplicates
    AND NOT (COALESCE(deleted_for, ARRAY[]::UUID[]) @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.soft_delete_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_message(UUID, UUID) TO service_role;
