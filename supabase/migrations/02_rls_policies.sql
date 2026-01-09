/**
 * Row Level Security (RLS) Policies for TalentHub
 * 
 * These policies enforce data isolation and prevent unauthorized access.
 * All policies must be enabled on tables and foreign keys must have
 * referential integrity constraints.
 */

-- ============================================
-- 1. TENANTS TABLE - RLS Policies
-- ============================================

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view all tenants
CREATE POLICY "tenants_admin_view" ON tenants
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role = 'admin' 
            AND tenant_id = tenants.id
        )
    );

-- Policy: Users can only view their own tenant
CREATE POLICY "tenants_user_view" ON tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Policy: Only admins can update tenants
CREATE POLICY "tenants_admin_update" ON tenants
    FOR UPDATE
    USING (
        id IN (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        id IN (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- ============================================
-- 2. USERS TABLE - RLS Policies
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view themselves and their tenant members
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    USING (
        id = auth.uid() 
        OR tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

-- Policy: Users can only update their own profile
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

-- Policy: Only admins can insert users (prevent user enumeration)
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE role = 'admin' 
            AND tenant_id = users.tenant_id
        )
    );

-- Policy: Prevent users from changing their own role
CREATE POLICY "users_role_immutable" ON users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (
            SELECT role FROM users 
            WHERE id = auth.uid()
        )
    );

-- ============================================
-- 3. PRODUCTS TABLE - RLS Policies
-- ============================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view products from their tenant
CREATE POLICY "products_select_policy" ON products
    FOR SELECT
    USING (
        tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

-- Policy: Only admin providers can create products
CREATE POLICY "products_insert_policy" ON products
    FOR INSERT
    WITH CHECK (
        tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider')
            LIMIT 1
        )
    );

-- Policy: Only product creators and admins can update products
CREATE POLICY "products_update_policy" ON products
    FOR UPDATE
    USING (
        tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider')
            LIMIT 1
        )
    )
    WITH CHECK (
        tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'provider')
            LIMIT 1
        )
    );

-- Policy: Only admins can delete products
CREATE POLICY "products_delete_policy" ON products
    FOR DELETE
    USING (
        tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            LIMIT 1
        )
    );

-- ============================================
-- 4. ORDERS TABLE - RLS Policies
-- ============================================

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "orders_user_view" ON orders
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR auth.uid() IN (
            SELECT id FROM users 
            WHERE tenant_id = orders.tenant_id 
            AND role = 'admin'
        )
    );

-- Policy: Subscribers can only create their own orders
CREATE POLICY "orders_subscriber_insert" ON orders
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

-- Policy: Only admins can update order status
CREATE POLICY "orders_admin_update" ON orders
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE tenant_id = orders.tenant_id 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM users 
            WHERE tenant_id = orders.tenant_id 
            AND role = 'admin'
        )
    );

-- ============================================
-- 5. MESSAGES TABLE - RLS Policies
-- ============================================

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from their rooms
CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT
    USING (
        sender_id = auth.uid() 
        OR tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

-- Policy: Users can only send messages in their tenant
CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() 
        AND tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );

-- Policy: Users can only update/delete their own messages
CREATE POLICY "messages_update_policy" ON messages
    FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_delete_policy" ON messages
    FOR DELETE
    USING (sender_id = auth.uid());

-- ============================================
-- 6. AUDIT_LOGS TABLE - RLS Policies
-- ============================================

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view audit logs from their tenant
CREATE POLICY "audit_logs_view_policy" ON audit_logs
    FOR SELECT
    USING (
        tenant_id = (
            SELECT tenant_id FROM users 
            WHERE id = auth.uid() 
            LIMIT 1
        ) 
        AND auth.uid() IN (
            SELECT id FROM users 
            WHERE role = 'admin'
        )
    );

-- Policy: No direct inserts - only through triggers
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT
    WITH CHECK (false); -- Disabled: use triggers instead

CREATE POLICY "audit_logs_delete_policy" ON audit_logs
    FOR DELETE
    USING (false); -- Prevent deletion of audit logs

-- ============================================
-- 7. SECURITY INDEXES
-- ============================================

-- Create indexes for RLS policy performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_id_tenant_id ON users(id, tenant_id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_tenant_id ON messages(tenant_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- 8. GRANT POLICIES
-- ============================================

-- Grant execute permissions on public functions
GRANT EXECUTE ON FUNCTION audit_log_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;

-- Restrict direct table access - force through views where applicable
REVOKE ALL ON TABLE audit_logs FROM public;
GRANT SELECT ON TABLE audit_logs TO authenticated;
