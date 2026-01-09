import { User } from "@supabase/supabase-js";

/**
 * Checks if a user is authorized for a specific tenant.
 * Default tenant is 'talenthub'.
 */
export function isTenantAuthorized(user: User | null, tenantId: string): boolean {
    if (!user) return false;

    // For demo/bootcamp purposes, we'll allow access if no tenant is set on user metadata
    // or if it matches the requested tenant.
    const userTenant = user.app_metadata?.tenant_id;

    if (!userTenant) return tenantId === 'talenthub';

    return userTenant === tenantId;
}

/**
 * Checks if a user has a specific role.
 */
export function isRoleAuthorized(user: User | null, requiredRole: string): boolean {
    if (!user) return false;

    const userRole = user.app_metadata?.role;

    // Admin has access to everything
    if (userRole === 'admin') return true;

    return userRole === requiredRole;
}
