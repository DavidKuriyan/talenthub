# Code Annotation System

## Overview

TalentHub uses a comprehensive code annotation system to guide future AI agents and developers. Annotations are NOT overhead—they're safety guarantees that force future team members and AI to understand business context before making changes.

---

## Annotation Tags

### `@feature`
**Purpose**: Link code to user-facing features

**When to use**: All exported components, API routes, and major functions

**Example**:
```typescript
/**
 * @feature CART_MANAGEMENT
 * Shopping cart with localStorage persistence
 */
export function useCart() { ... }
```

---

### `@aiNote`
**Purpose**: Explicit guidance for AI on what/how to safely modify

**When to use**: Security-critical code, complex business logic, coordinated changes

**Example**:
```typescript
/**
 * @aiNote This function enforces RLS tenant isolation.
 * Only modify if also updating database RLS policies.
 * Removing tenant_id check causes permission denied errors.
 */
export async function getProducts(tenantId: string) { ... }
```

**Patterns**:
- **Constraint & Consequence**: "If you change X, Y will break"
- **Coordination**: "Also update files A, B, C"
- **Import warnings**: "Import from X not Y (Y is test stubs)"
- **External dependencies**: "Calls Razorpay API, affects payment tests"

---

### `@businessRule`
**Purpose**: Business logic requiring stakeholder approval to change

**Example**:
```typescript
/**
 * @businessRule Partnership revenue split: 30% vendor A, 70% vendor B
 * REQUIRES: CFO approval to modify
 */
const REVENUE_SPLIT = { vendorA: 0.3, vendorB: 0.7 };
```

---

### `@dpdp`
**Purpose**: India DPDP Act compliance enforcement

**When to use**: Code handling personal data (email, phone, name, etc.)

**Example**:
```typescript
/**
 * @dpdp Stores user email and phone number.
 * DPDP Rule 6: Must log data access for audit trail.
 * DPDP Rule 10: Child protection - require parental consent for users < 18.
 */
export async function createUser(data: UserData) { ... }
```

---

### `@compliance`
**Purpose**: Other regulations (HIPAA, GDPR, PCI-DSS)

**Example**:
```typescript
/**
 * @compliance PCI-DSS: Never log credit card numbers.
 * Payment details must go through Razorpay only.
 */
```

---

### `@deprecated`
**Purpose**: Code scheduled for removal

**Example**:
```typescript
/**
 * @deprecated Use getProducts() instead.
 * Remove after v2 API sunset (ETA: Jan 2027)
 */
export function fetchProducts() { ... }
```

---

## Annotation Density Rules

| Code Area | Coverage | Rationale |
|-----------|----------|-----------|
| `/src/app/admin/**` | 100% | Admin = high privilege, max risk |
| `/src/app/api/**` | 100% | All external-facing APIs |
| `/src/lib/**` | 100% | Shared utilities used everywhere |
| `/src/components/**` | ~50% | Only complex/reusable components |
| `/src/app/(user)/**` | ~30% | Simple UI pages |
| `**/*.test.ts` | ~0% | Tests ARE documentation |

---

## Code Examples

### ✅ Good: Admin Component
```typescript
/**
 * @feature ADMIN_DASHBOARD
 * Tenant management and revenue analytics
 * 
 * @aiNote All queries filter by tenant_id from selected dropdown.
 * If you modify tenant selection, update useEffect dependencies.
 * 
 * @businessRule Admins can only see their own tenant data.
 * Cross-tenant access requires super-admin role.
 * 
 * @dpdp Displays user emails and order amounts (PII).
 * Access is logged in audit_logs table.
 */
"use client";

export default function AdminDashboard() {
  // Component code...
}
```

### ✅ Good: Payment API
```typescript
/**
 * @feature PAYMENTS
 * Razorpay order creation endpoint
 * 
 * @aiNote SECURITY: Total is recalculated server-side.
 * Never trust client-sent totals - prevents price tampering.
 * If you modify pricing logic, also update:
 * - src/lib/cart.ts (calculateTotal)
 * - __tests__/lib/cart.test.ts
 * 
 * @dpdp Logs order amount and user_id for audit trail.
 */
export async function POST(req: Request) {
  // Server-side total validation
  const calculatedTotal = items.reduce(...);
  if (calculatedTotal !== req.body.total) {
    throw new Error("Total mismatch");
  }
}
```

### ❌ Bad: No Annotations
```typescript
// WRONG: Missing context
export function processPayment(orderId) {
  const order = getOrder(orderId);
  // What if orderId is from wrong tenant?
  // What if payment already processed?
  // What compliance rules apply?
}
```

---

## Enforcement

### Manual Review
- All PR должны have annotations for new admin/API code
- Reviewers check:
  - [ ] `@feature` tag present?
  - [ ] Security notes for RLS/permissions?
  - [ ] DPDP tags for PII handling?

### Future: ESLint Rules (planned)
```javascript
// .eslintrc.js (future)
rules: {
  'require-feature-tag': ['error', { 
    files: ['src/app/admin/**', 'src/app/api/**'] 
  }],
  'require-ainote-for-rls': ['error']
}
```

---

## When NOT to Annotate

- Pure UI components (buttons, cards) - obvious functionality
- Test files - tests document themselves
- Configuration files (tailwind.config.ts) - self-explanatory
- One-liners - `export const API_URL = "..."`

---

## Migration Guide

### For Existing Code
```bash
# Find unannotated admin files
find src/app/admin -name "*.tsx" | xargs grep -L "@feature"

# Add annotations incrementally
# Priority: API routes > admin pages > lib functions
```

### Template
```typescript
/**
 * @feature <FEATURE_NAME>
 * Brief description of what this does
 * 
 * @aiNote <Critical things AI should know>
 * 
 * @businessRule <Business constraints> (if applicable)
 * 
 * @dpdp <Data protection rules> (if handles PII)
 */
```

---

## Real-World Impact

**Before Annotations**:
- AI suggests removing `tenant_id` check → breaks RLS
- Developer changes price calculation → allows fraud
- Compliance audit fails → missing PII logging

**After Annotations**:
- AI sees `@aiNote` → understands RLS dependency
- Developer sees `@businessRule` → gets approval first
- Auditor sees `@dpdp` tags → passes compliance review

---

## Summary

Annotations are **insurance** against future bugs, security issues, and compliance failures. 

**5 minutes spent writing annotations today saves 5 hours  debugging tomorrow.**

---

**Status**: Annotation system documented and ready for team use! ✅
