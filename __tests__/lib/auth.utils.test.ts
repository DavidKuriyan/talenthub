/**
 * @jest-environment node
 */
import { isTenantAuthorized, isRoleAuthorized } from "../../src/lib/auth.utils";
import { User } from "@supabase/supabase-js";

describe("auth.utils", () => {
    describe("isTenantAuthorized", () => {
        it("should return false if user is null", () => {
            expect(isTenantAuthorized(null, "talenthub")).toBe(false);
        });

        it("should return true for default tenant 'talenthub' if user has no tenant_id in metadata", () => {
            const user = { app_metadata: {} } as User;
            expect(isTenantAuthorized(user, "talenthub")).toBe(true);
        });

        it("should return true if user tenant matches requested tenant", () => {
            const user = { app_metadata: { tenant_id: "test-tenant" } } as User;
            expect(isTenantAuthorized(user, "test-tenant")).toBe(true);
        });

        it("should return false if user tenant does not match requested tenant", () => {
            const user = { app_metadata: { tenant_id: "other-tenant" } } as User;
            expect(isTenantAuthorized(user, "test-tenant")).toBe(false);
        });
    });

    describe("isRoleAuthorized", () => {
        it("should return false if user is null", () => {
            expect(isRoleAuthorized(null, "subscriber")).toBe(false);
        });

        it("should return true if user is admin regardless of required role", () => {
            const user = { app_metadata: { role: "admin" } } as User;
            expect(isRoleAuthorized(user, "subscriber")).toBe(true);
            expect(isRoleAuthorized(user, "editor")).toBe(true);
        });

        it("should return true if user role matches required role", () => {
            const user = { app_metadata: { role: "subscriber" } } as User;
            expect(isRoleAuthorized(user, "subscriber")).toBe(true);
        });

        it("should return false if user role does not match required role and is not admin", () => {
            const user = { app_metadata: { role: "subscriber" } } as User;
            expect(isRoleAuthorized(user, "admin")).toBe(false);
        });
    });
});
