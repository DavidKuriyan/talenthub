-- ==========================================
-- CLEANUP: Delete All Messages
-- ==========================================
-- Run this to start fresh with messaging system

DELETE FROM public.messages;

-- Reset any auto-increment if needed (not applicable to UUID primary keys, but good practice)
-- TRUNCATE public.messages RESTART IDENTITY CASCADE;

-- Verification: Ensure all messages are gone
-- SELECT COUNT(*) FROM public.messages; -- Should return 0
