# TalentHub - Registered Organizations & Test Accounts

## 📊 ORGANIZATIONS OVERVIEW

Total Organizations: 5

---

## 1. 📊 ACME Corporation
- **ID:** `81c1a55d-9ae5-4c4f-81d7-d25dba7b5f58`
- **Slug:** `acme-corporation`
- **Status:** ✅ Active
- **Created:** 1/12/2026, 11:52:21 AM

### Admin Users:
1. **Email:** acme@example.com
   - **User ID:** 772d2217-daed-4ceb-9f14-2c6b6c13b0a3
   - **Password:** 🔒 [ENCRYPTED - Not retrievable]
   - **Created:** 1/12/2026, 11:52:21 AM

---

## 2. 📊 TalentHub Recruitment
- **ID:** `ae772e9e-9820-45b0-9d38-ecdc029b31e3`
- **Slug:** `talenthub-recruitment`
- **Status:** ✅ Active
- **Created:** 1/10/2026, 5:37:03 PM

### Admin Users:
⚠️ No admin users found

---

## 3. 📊 TalentHub Solutions ⭐ (Your Account)
- **ID:** `930e6f70-f5cb-41be-84d2-4e5e31f1864e`
- **Slug:** `talenthub`
- **Status:** ✅ Active
- **Created:** 1/9/2026, 8:17:48 PM

### Admin Users:
1. **Email:** davidkuriyan20@gmail.com ✅
   - **User ID:** ae609eae-6508-426a-b514-ed9a96b938bb
   - **Password:** David@123 ✅ (Known)
   - **Role:** admin
   - **Industry:** IT/Technology
   - **Created:** 1/12/2026, 11:47:18 AM
   - **Status:** ✅ Working - Login Verified

### Other Users:
1. demo@talenthub.com - subscriber

---

## 4. 📊 TechStaff Co
- **ID:** `86e98a55-5a78-4650-9076-4c608a9337bd`
- **Slug:** `techstaff`
- **Status:** ✅ Active
- **Created:** 1/9/2026, 8:17:48 PM

### Admin Users:
⚠️ No admin users found

---

## 🔐 KNOWN TEST CREDENTIALS

### Organization Admin Account (Working ✅)
- **Organization:** TalentHub Solutions
- **Email:** davidkuriyan20@gmail.com
- **Password:** David@123
- **Role:** Admin
- **Login URL:** http://localhost:3000/organization/login

---

## ⚠️ IMPORTANT SECURITY NOTES

### Why Passwords Cannot Be Retrieved:
1. **Hashing:** Passwords are encrypted using secure one-way hashing algorithms (bcrypt/scrypt)
2. **Irreversible:** Hash functions cannot be reversed to obtain the original password
3. **Security Best Practice:** This protects user accounts even if the database is compromised
4. **Industry Standard:** All secure applications use this approach (Google, Facebook, banks, etc.)

### How Authentication Works:
1. User enters password during login
2. System hashes the entered password
3. Compares the hash with the stored hash
4. If they match, login succeeds
5. **Original password is never stored or retrievable**

### If You Need Access to Other Accounts:
1. **Option 1:** Use the password reset functionality (if implemented)
2. **Option 2:** Create new test accounts with known credentials
3. **Option 3:** Use the service role key to update user passwords programmatically
4. **Option 4:** Manually set a new password via Supabase dashboard

---

## 🛠️ Creating New Test Organizations

If you need more test accounts with known credentials, you can:

1. **Via UI:** Register at http://localhost:3000/organization/register
2. **Via Script:** Create a setup script with known credentials
3. **Via Supabase Dashboard:** Manually create users and set passwords

---

## 📝 SUMMARY

- **Total Organizations:** 5
- **Organizations with Admin Users:** 2
  - ACME Corporation
  - TalentHub Solutions ✅ (Your working account)
- **Organizations Missing Admins:** 3
  - TalentHub Recruitment
  - TechStaff Co
  - (Need admin users assigned)

**Your Working Account:**
- Email: davidkuriyan20@gmail.com
- Password: David@123
- Organization: TalentHub Solutions
- Status: ✅ Verified and Working

---

**Last Updated:** 2026-01-12 at 11:56 AM IST
