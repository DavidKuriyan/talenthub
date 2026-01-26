-- ============================================================
-- FIX: Ensure soft_delete_message RPC is robust and accessible
-- ============================================================

-- 1. Ensure the function exists with correct types and security
CREATE OR REPLACE FUNCTION public.soft_delete_message(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET deleted_by = array_append(COALESCE(deleted_by, ARRAY[]::UUID[]), user_id)
    WHERE id = message_id 
    -- Avoid duplicates
    AND NOT (COALESCE(deleted_by, ARRAY[]::UUID[]) @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.soft_delete_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_message(UUID, UUID) TO service_role;

-- 3. Ensure an UPDATE policy exists for messages if needed (though SECURITY DEFINER should bypass it)
-- Just in case, allow users to update their own 'deleted_by' (though harder to write a granular policy for array append)
-- So we rely on the SECURITY DEFINER.

-- 4. Verify columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='deleted_by') THEN
        ALTER TABLE messages ADD COLUMN deleted_by UUID[] DEFAULT ARRAY[]::UUID[];
    END IF;
END $$;
