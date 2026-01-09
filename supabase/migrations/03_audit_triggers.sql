/**
 * Audit Logging System for TalentHub
 * 
 * Automatically logs all critical operations on protected tables
 * using PostgreSQL triggers and functions.
 */

-- ============================================
-- 1. AUDIT LOG TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_action_details JSONB;
BEGIN
    -- Get current user
    v_user_id := auth.uid();

    -- Get tenant ID from context or table data
    IF TG_TABLE_NAME = 'tenants' THEN
        v_tenant_id := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'audit_logs' THEN
        RETURN NEW; -- Don't log audit_logs table
    ELSE
        v_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
    END IF;

    -- Build action details based on operation type
    v_action_details := JSONB_BUILD_OBJECT(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
    );

    -- Capture row changes
    IF TG_OP = 'INSERT' THEN
        v_action_details := v_action_details || JSONB_BUILD_OBJECT('new_data', ROW_TO_JSON(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        v_action_details := v_action_details || JSONB_BUILD_OBJECT(
            'old_data', ROW_TO_JSON(OLD),
            'new_data', ROW_TO_JSON(NEW),
            'changes', GET_CHANGES(OLD, NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_action_details := v_action_details || JSONB_BUILD_OBJECT('deleted_data', ROW_TO_JSON(OLD));
    END IF;

    -- Insert audit log
    INSERT INTO audit_logs (tenant_id, user_id, action, details)
    VALUES (
        v_tenant_id,
        v_user_id,
        TG_TABLE_NAME || '_' || LOWER(TG_OP),
        v_action_details
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. HELPER FUNCTION: GET CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION get_changes(old_row RECORD, new_row RECORD)
RETURNS JSONB AS $$
DECLARE
    v_changes JSONB := '{}'::JSONB;
    v_old_json JSONB;
    v_new_json JSONB;
    v_key TEXT;
BEGIN
    v_old_json := ROW_TO_JSON(old_row);
    v_new_json := ROW_TO_JSON(new_row);

    FOR v_key IN SELECT jsonb_object_keys(v_new_json)
    LOOP
        IF v_old_json ->> v_key IS DISTINCT FROM v_new_json ->> v_key THEN
            v_changes := v_changes || JSONB_BUILD_OBJECT(
                v_key,
                JSONB_BUILD_OBJECT(
                    'old', v_old_json ->> v_key,
                    'new', v_new_json ->> v_key
                )
            );
        END IF;
    END LOOP;

    RETURN v_changes;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3. FUNCTION: GET CURRENT TENANT ID
-- ============================================

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id FROM users 
        WHERE id = auth.uid() 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION: LOG SENSITIVE OPERATION
-- ============================================

CREATE OR REPLACE FUNCTION log_sensitive_operation(
    p_action TEXT,
    p_details JSONB,
    p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (tenant_id, user_id, action, details)
    VALUES (
        get_current_tenant_id(),
        auth.uid(),
        p_action,
        p_details || JSONB_BUILD_OBJECT('severity', p_severity)
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNCTION: QUERY AUDIT LOGS (ADMIN ONLY)
-- ============================================

CREATE OR REPLACE FUNCTION query_audit_logs(
    p_action_filter TEXT DEFAULT NULL,
    p_hours_back INTEGER DEFAULT 24,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    id UUID,
    tenant_id UUID,
    user_id UUID,
    action TEXT,
    details JSONB,
    created_at TIMESTAMP
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can query audit logs';
    END IF;

    RETURN QUERY
    SELECT
        audit_logs.id,
        audit_logs.tenant_id,
        audit_logs.user_id,
        audit_logs.action,
        audit_logs.details,
        audit_logs.created_at
    FROM audit_logs
    WHERE audit_logs.tenant_id = get_current_tenant_id()
        AND audit_logs.created_at >= NOW() - INTERVAL '1 hour' * p_hours_back
        AND (p_action_filter IS NULL OR audit_logs.action LIKE p_action_filter)
    ORDER BY audit_logs.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNCTION: EXPORT AUDIT LOG (COMPLIANCE)
-- ============================================

CREATE OR REPLACE FUNCTION export_audit_logs(
    p_start_date TIMESTAMP DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE(
    log_id UUID,
    tenant_id UUID,
    user_id UUID,
    action TEXT,
    details TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can export audit logs';
    END IF;

    RETURN QUERY
    SELECT
        audit_logs.id,
        audit_logs.tenant_id,
        audit_logs.user_id,
        audit_logs.action,
        audit_logs.details::TEXT,
        audit_logs.created_at
    FROM audit_logs
    WHERE audit_logs.tenant_id = get_current_tenant_id()
        AND audit_logs.created_at >= p_start_date
        AND audit_logs.created_at <= p_end_date
    ORDER BY audit_logs.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNCTION: DETECT SUSPICIOUS ACTIVITY
-- ============================================

CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE(
    alert_type TEXT,
    user_id UUID,
    action TEXT,
    count_in_window INTEGER,
    created_at TIMESTAMP
) AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can view security alerts';
    END IF;

    -- Return high-frequency operations (potential abuse)
    RETURN QUERY
    SELECT
        'high_frequency_operations'::TEXT as alert_type,
        audit_logs.user_id,
        audit_logs.action,
        COUNT(*)::INTEGER as count_in_window,
        NOW() as created_at
    FROM audit_logs
    WHERE audit_logs.tenant_id = get_current_tenant_id()
        AND audit_logs.created_at >= NOW() - INTERVAL '1 hour'
    GROUP BY audit_logs.user_id, audit_logs.action
    HAVING COUNT(*) > 100; -- Alert if more than 100 operations per hour

    -- Return failed auth attempts
    RETURN QUERY
    SELECT
        'failed_auth_attempts'::TEXT as alert_type,
        audit_logs.user_id,
        'auth_failure'::TEXT as action,
        COUNT(*)::INTEGER as count_in_window,
        NOW() as created_at
    FROM audit_logs
    WHERE audit_logs.tenant_id = get_current_tenant_id()
        AND audit_logs.action LIKE 'auth_%'
        AND audit_logs.details->>'severity' = 'warning'
        AND audit_logs.created_at >= NOW() - INTERVAL '1 hour'
    GROUP BY audit_logs.user_id
    HAVING COUNT(*) > 5; -- Alert if more than 5 failures per hour
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. CREATE TRIGGERS ON PROTECTED TABLES
-- ============================================

-- Audit trigger on users
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION audit_log_trigger();

-- Audit trigger on products
DROP TRIGGER IF EXISTS audit_products_trigger ON products;
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION audit_log_trigger();

-- Audit trigger on orders
DROP TRIGGER IF EXISTS audit_orders_trigger ON orders;
CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION audit_log_trigger();

-- Audit trigger on messages
DROP TRIGGER IF EXISTS audit_messages_trigger ON messages;
CREATE TRIGGER audit_messages_trigger
AFTER INSERT OR DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION audit_log_trigger();

-- Audit trigger on tenants
DROP TRIGGER IF EXISTS audit_tenants_trigger ON tenants;
CREATE TRIGGER audit_tenants_trigger
AFTER INSERT OR UPDATE OR DELETE ON tenants
FOR EACH ROW
EXECUTE FUNCTION audit_log_trigger();

-- ============================================
-- 9. RETENTION POLICY FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(p_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. VIEW: AUDIT LOG SUMMARY
-- ============================================

CREATE OR REPLACE VIEW audit_log_summary AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    action,
    COUNT(*) as operation_count,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), action
ORDER BY hour DESC, operation_count DESC;

-- ============================================
-- 11. COMMENTS & DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION audit_log_trigger() IS 'Automatically logs all INSERT, UPDATE, DELETE operations on protected tables';
COMMENT ON FUNCTION get_changes(RECORD, RECORD) IS 'Compares two rows and returns JSON of changed fields';
COMMENT ON FUNCTION get_current_tenant_id() IS 'Returns the current authenticated user''s tenant ID';
COMMENT ON FUNCTION log_sensitive_operation(TEXT, JSONB, TEXT) IS 'Manually log a sensitive operation with custom details';
COMMENT ON FUNCTION query_audit_logs(TEXT, INTEGER, INTEGER) IS 'Query audit logs with filtering (admin only)';
COMMENT ON FUNCTION export_audit_logs(TIMESTAMP, TIMESTAMP) IS 'Export audit logs for compliance (admin only)';
COMMENT ON FUNCTION detect_suspicious_activity() IS 'Identify potential security threats and abuse patterns';
COMMENT ON FUNCTION cleanup_old_audit_logs(INTEGER) IS 'Delete audit logs older than specified days';
COMMENT ON VIEW audit_log_summary IS 'Summary view of audit activities by hour and action';
