#!/usr/bin/env node

/**
 * Environment Verification Script
 * Checks if all required environment variables are properly configured
 */

const requiredEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (for org registration)',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID': 'Razorpay test key ID',
    'RAZORPAY_SECRET': 'Razorpay secret key'
};

console.log('🔍 Checking environment configuration...\n');

let allPresent = true;
let warnings = [];

for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    const status = value ? '✅' : '❌';
    const masked = value ? `${value.substring(0, 10)}...` : 'NOT SET';

    console.log(`${status} ${key}`);
    console.log(`   ${description}`);
    console.log(`   Value: ${masked}\n`);

    if (!value) {
        allPresent = false;
    }
}

if (allPresent) {
    console.log('✅ All environment variables are configured!\n');
    console.log('Next steps:');
    console.log('1. Test organization registration at /organization/register');
    console.log('2. Test engineer login at /engineer/login');
    console.log('3. Test payment integration');
} else {
    console.log('❌ Some environment variables are missing!\n');
    console.log('Action required:');
    console.log('1. Create .env.local file in project root');
    console.log('2. Add the missing variables (see setup_guide.md)');
    console.log('3. Restart the dev server: npm run dev');
}

// Check if running in development
if (process.env.NODE_ENV === 'production') {
    console.log('\n⚠️  WARNING: Running in production mode');
    console.log('   Make sure to use production keys, not test keys');
}

process.exit(allPresent ? 0 : 1);
