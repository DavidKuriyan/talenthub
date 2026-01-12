/**
 * Fix User Tenant Assignment
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    cyan: '\x1b[36m'
};

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
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = 'davidkuriyan20@gmail.com';
const USER_ID = 'ae609eae-6508-426a-b514-ed9a96b938bb';
const TENANT_ID = '930e6f70-f5cb-41be-84d2-4e5e31f1864e';

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
    console.log(`\n${c.cyan}Updating user tenant assignment...${c.reset}\n`);

    const updateResp = await makeRequest(
        `${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`,
        {
            method: 'PUT',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json'
            }
        },
        {
            user_metadata: {
                tenant_id: TENANT_ID
            },
            app_metadata: {
                tenant_id: TENANT_ID
            }
        }
    );

    if (updateResp.statusCode === 200) {
        console.log(`${c.green}✓ User metadata updated${c.reset}`);
        console.log(`  User: ${TEST_EMAIL}`);
        console.log(`  Tenant ID: ${TENANT_ID}`);
        console.log(`\n${c.cyan}User must log out and log back in for changes to take effect${c.reset}\n`);
    } else {
        console.log(`Failed: ${updateResp.raw}`);
    }
}

main().catch(err => console.error(err));
