# 🌐 Supabase Connectivity Diagnostic Guide

If you are seeing a "Failed to fetch" error during sign-in, it means your browser cannot connect to the Supabase servers. Use this guide to identify and fix the issue.

## 1. Verify Project URL
Your current project URL is:
`https://vebnppnetiekhpaoknfk.supabase.co`

### Test Connectivity Manually
Open your terminal and run this command:
```powershell
curl.exe -I https://vebnppnetiekhpaoknfk.supabase.co/auth/v1/health
```

**What the results mean:**
- **HTTP/1.1 200 OK**: Your connection is fine. The issue might be a local firewall or strict VPN.
- **Could not resolve host**: This is the most common cause. The project ID is wrong, or the project has been deleted/paused.
- **Connection timed out**: Your network is blocking the connection (Check VPN/Firewall).

## 2. Check Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Check if your project `vebnppnetiekhpaoknfk` is:
    - **Active**: Everything is good.
    - **Paused**: Click "Restore Project" (Supabase pauses projects after 1 week of inactivity).
    - **Deleted/Expired**: You will need to create a new project and update `.env.local`.

## 3. Verify Environment Variables
Check your `d:\Boot Camp\TalentHub\.env.local` file. It should look like this:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vebnppnetiekhpaoknfk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

## 4. Check Browser Console
1. Press **F12** in your browser.
2. Go to the **Console** tab.
3. Look for the log: `--- Supabase Config Loading ---`.
4. Ensure the URL matches the one above and "Anon Key Present" is `true`.

---

### If you need to switch projects:
1. Create a new project on Supabase.
2. Update the keys in `.env.local`.
3. Restart the dev server: `Ctrl+C` then `npm run dev`.
