# TalentHub Deployment Guide

## 🚀 Production Deployment Checklist

### Prerequisites
- [ ] Domain name registered
- [ ] SSL certificate ready
- [ ] Supabase production project created
- [ ] Razorpay live account approved
- [ ] Backup strategy in place

---

## Step 1: Database Setup

### 1.1 Create Production Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose organization and region (closest to users)
4. Set strong database password (save securely)

### 1.2 Run Migrations
```bash
# In Supabase SQL Editor
-- Copy and run in this order:
1. Database schema (from README.md)
2. RLS policies (from README.md)  
3. seed.sql (production data)
```

### 1.3 Verify RLS
```sql
-- Test tenant isolation
SELECT * FROM products WHERE tenant_id != auth.jwt()->>'tenant_id';
-- Should return 0 rows
```

---

## Step 2: Environment Variables

### 2.1 Update Production `.env.local`
```bash
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Razorpay Live
RAZORPAY_KEY_ID=rzp_live_yourKeyHere
RAZORPAY_KEY_SECRET=your_live_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Jitsi
JITSI_SECRET_KEY=your_production_secret

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### 2.2 Never Commit Secrets
```bash
# Verify .gitignore includes:
.env*
!.env.example
```

---

## Step 3: Razorpay Configuration

### 3.1 Activate Live Mode
1. Go to Razorpay Dashboard
2. Submit KYC documents
3. Wait for approval (24-48 hours)
4. Switch to "Live Mode" in dashboard

### 3.2 Configure Webhooks
1. Settings → Webhooks → Add
2. URL: `https://yourdomain.com/api/webhook/razorpay`
3. Events:
   - payment.captured
   - payment.failed
   - order.paid
4. Copy webhook secret to `.env.local`

### 3.3 Test with Real Payment
```bash
# Use small amount first (₹10)
# Verify:
- Order created in database
- Razorpay dashboard shows transaction
- Webhook received (check logs)
- Order status updated to 'paid'
```

---

## Step 4: Vercel Deployment

### 4.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 4.2 Deploy
```bash
# Login
vercel login

# Link project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add RAZORPAY_KEY_ID production
# ... add all variables

# Deploy
vercel --prod
```

### 4.3 Custom Domain
1. Vercel  Dashboard → Project → Settings → Domains
2. Add domain: `yourdomain.com`
3. Update DNS records as shown
4. Wait for SSL (auto-provisioned)

---

## Step 5: Post-Deployment Verification

### 5.1 Smoke Tests
- [ ] Homepage loads
- [ ] User can register/login
- [ ] Products page shows correct items
- [ ] Add to cart works
- [ ] Checkout opens Razorpay
- [ ] Payment completes successfully
- [ ] Order appears in admin dashboard
- [ ] Theme toggle  works
- [ ] Chat works (send message)
- [ ] Video call opens

### 5.2 Security Checks
```bash
# Check headers
curl -I https://yourdomain.com | grep -i "x-frame\|strict-transport\|content-security"

# Test RLS (should fail)
# Try accessing another tenant's data via API
```

### 5.3 Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s

---

## Step 6: Monitoring Setup

### 6.1 Error Tracking (Sentry)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to `next.config.ts`:
```typescript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  nextConfig,
  { silent: true }
);
```

### 6.2 Uptime Monitoring
1. Sign up: https://uptimerobot.com
2. Add monitor: `https://yourdomain.com`
3. Alert email: your@email.com
4. Check interval: 5 minutes

### 6.3 Analytics (Optional)
```bash
# Vercel Analytics (built-in)
npm install @vercel/analytics
```

Add to `layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## Step 7: Backup & Recovery

### 7.1 Database Backups
Supabase Pro auto-backs up daily. To manually backup:

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Store securely (encrypted S3/cloud storage)
```

### 7.2 Code Backups
```bash
# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

### 7.3 Recovery Plan
Document in team wiki:
1. How to restore database from backup
2. How to rollback Vercel deployment
3. Emergency contacts
4. Razorpay support process

---

## Step 8: Scaling Considerations

### As You Grow
- **100+ users**: Upgrade Supabase to Pro
- **1000+ users**: Add Redis caching
- **10000+ users**: CDN for static assets
- **100K+ users**: Multi-region deployment

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_messages_room ON messages(room_id);
```

---

## Troubleshooting

### Issue: "Too many connections"
**Fix**: Upgrade Supabase plan or add connection pooling

### Issue: Razorpay webhook not receiving
**Fix**: 
1. Check webhook URL is correct
2. Verify SSL certificate is valid
3. Check webhook secret matches

### Issue: RLS blocking queries
**Fix**: Ensure JWT includes `tenant_id` in claims

---

## Security Audit Checklist

Before going live:
- [ ] All API routes require authentication
- [ ] RLS enabled on all tables
- [ ] Secrets not in code/git
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Payment verification uses HMAC
- [ ] Audit logging active
- [ ] Error messages don't leak sensitive data
- [ ] Rate limiting on auth endpoints (optional)
- [ ] 2FA for admin users (optional)

---

## Success Metrics to Track

### Technical
- Uptime > 99.9%
- API response time < 200ms
- Error rate < 0.1%
- Test coverage > 70%

### Business (from README)
- Revenue growth: ₹1.2L → ₹6.8L/month
- Conversion rate: 70%
- Customer satisfaction: Track support tickets

---

**Status**: Ready for Production Deployment! 🚀

Follow this checklist step-by-step and verify each item before proceeding to the next.
