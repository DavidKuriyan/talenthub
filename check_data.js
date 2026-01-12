/**
 * Quick diagnostic script to check data visibility
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors
const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m'
};

// Load env
function loadEnv() {
    const envFile = path.join(__dirname, '.env.local');
    const content = fs.readFileSync(envFile, 'utf8');
    const envVars = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });
    return envVars;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = 'davidkuriyan20@gmail.com';
const TEST_PASSWORD = 'David@123';

function makeRequest(url, options = {}, body = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = protocol.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: data ? JSON.parse(data) : null,
                        raw: data
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: null,
                        raw: data
                    });
                }
            });
        });

        req.on('error', error => reject(error));

        if (body) req.write(typeof body === 'object' ? JSON.stringify(body) : body);
        req.end();
    });
}

async function main() {
    console.log(`\n${c.cyan}Diagnostic Check${c.reset}\n`);

    // Auth
    const authResp = await makeRequest(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        },
        { email: TEST_EMAIL, password: TEST_PASSWORD }
    );

    const accessToken = authResp.data?.access_token;
    const userId = authResp.data?.user?.id;

    console.log(`User ID: ${userId}`);
    console.log(`Has Token: ${!!accessToken}\n`);

    // Check with service key
    console.log(`${c.cyan}With SERVICE KEY:${c.reset}`);
    const serviceResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`,
        {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        }
    );
    console.log(`Profiles found: ${serviceResp.data?.length || 0}`);
    if (serviceResp.data && serviceResp.data.length > 0) {
        console.log(`Profile ID: ${serviceResp.data[0].id}`);
        console.log(`Skills: ${JSON.stringify(serviceResp.data[0].skills)}`);
    }

    // Check with user token
    console.log(`\n${c.cyan}With USER TOKEN:${c.reset}`);
    const userResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`,
        {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );
    console.log(`Profiles found: ${userResp.data?.length || 0}`);
    if (userResp.data && userResp.data.length > 0) {
        console.log(`${c.green}✓ Profile accessible with user token${c.reset}`);
    } else {
        console.log(`${c.red}✗ Profile NOT accessible - RLS issue${c.reset}`);
        console.log(`Response: ${userResp.raw}`);
    }

    // Check matches
    const profileId = serviceResp.data?.[0]?.id;
    if (profileId) {
        console.log(`\n${c.cyan}MATCHES (with user token):${c.reset}`);
        const matchesResp = await makeRequest(
            `${SUPABASE_URL}/rest/v1/matches?profile_id=eq.${profileId}&select=*`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        console.log(`Matches found: ${matchesResp.data?.length || 0}`);
        console.log(`Status: ${matchesResp.statusCode}`);
    }

    console.log();
}

main().catch(err => console.error(err));
