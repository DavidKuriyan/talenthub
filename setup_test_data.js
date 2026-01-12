/**
 * Setup Test Data for Engineer Portal
 * Creates profile and sample data for comprehensive testing
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ANSI Colors
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Load environment variables
function loadEnv() {
    const envFile = path.join(__dirname, '.env.local');
    try {
        const content = fs.readFileSync(envFile, 'utf8');
        const envVars = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                envVars[key] = value;
            }
        });
        return envVars;
    } catch (error) {
        console.error(`${c.red}Error loading .env.local:${c.reset}`, error.message);
        return {};
    }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = 'davidkuriyan20@gmail.com';
const TEST_PASSWORD = 'David@123';

let accessToken = null;
let userId = null;
let tenantId = null;
let profileId = null;

/**
 * Make HTTPS request
 */
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
                        headers: res.headers,
                        data: data ? JSON.parse(data) : null,
                        raw: data
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: null,
                        raw: data
                    });
                }
            });
        });

        req.on('error', error => reject(error));

        if (body) {
            req.write(typeof body === 'object' ? JSON.stringify(body) : body);
        }

        req.end();
    });
}

/**
 * Step 1: Authenticate
 */
async function authenticate() {
    console.log(`\n${c.cyan}Step 1: Authenticating...${c.reset}`);

    const authResponse = await makeRequest(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        },
        {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        }
    );

    if (authResponse.statusCode === 200 && authResponse.data) {
        accessToken = authResponse.data.access_token;
        userId = authResponse.data.user?.id;
        console.log(`${c.green}✓${c.reset} Authenticated as ${TEST_EMAIL}`);
        console.log(`${c.cyan}  User ID: ${userId}${c.reset}`);
        return true;
    } else {
        console.log(`${c.red}✗${c.reset} Authentication failed: ${authResponse.raw}`);
        return false;
    }
}

/**
 * Step 2: Get or create tenant
 */
async function setupTenant() {
    console.log(`\n${c.cyan}Step 2: Setting up tenant...${c.reset}`);

    // Get first active tenant
    const tenantResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/tenants?is_active=eq.true&select=id,name&limit=1`,
        {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        }
    );

    if (tenantResp.statusCode === 200 && tenantResp.data && tenantResp.data.length > 0) {
        tenantId = tenantResp.data[0].id;
        console.log(`${c.green}✓${c.reset} Using tenant: ${tenantResp.data[0].name}`);
        console.log(`${c.cyan}  Tenant ID: ${tenantId}${c.reset}`);
        return true;
    } else {
        console.log(`${c.yellow}⚠${c.reset} No active tenant found. Creating test tenant...`);

        // Create a test tenant
        const createTenant = await makeRequest(
            `${SUPABASE_URL}/rest/v1/tenants`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                }
            },
            {
                name: 'Test Organization',
                slug: 'test-org',
                is_active: true
            }
        );

        if (createTenant.statusCode === 201 && createTenant.data) {
            tenantId = Array.isArray(createTenant.data) ? createTenant.data[0].id : createTenant.data.id;
            console.log(`${c.green}✓${c.reset} Created test tenant`);
            console.log(`${c.cyan}  Tenant ID: ${tenantId}${c.reset}`);
            return true;
        } else {
            console.log(`${c.red}✗${c.reset} Failed to create tenant: ${createTenant.raw}`);
            return false;
        }
    }
}

/**
 * Step 3: Create engineer profile
 */
async function createProfile() {
    console.log(`\n${c.cyan}Step 3: Creating engineer profile...${c.reset}`);

    const profileData = {
        user_id: userId,
        tenant_id: tenantId,
        skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker'],
        experience_years: 5,
        resume_url: 'https://linkedin.com/in/davidkuriyan'
    };

    const createResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/profiles`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        },
        profileData
    );

    if (createResp.statusCode === 201 && createResp.data) {
        profileId = Array.isArray(createResp.data) ? createResp.data[0].id : createResp.data.id;
        console.log(`${c.green}✓${c.reset} Profile created successfully`);
        console.log(`${c.cyan}  Profile ID: ${profileId}${c.reset}`);
        console.log(`${c.cyan}  Skills: ${profileData.skills.join(', ')}${c.reset}`);
        console.log(`${c.cyan}  Experience: ${profileData.experience_years} years${c.reset}`);
        return true;
    } else {
        console.log(`${c.yellow}⚠${c.reset} Profile creation response: ${createResp.statusCode}`);

        // Try to fetch existing profile
        const getResp = await makeRequest(
            `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`,
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
            }
        );

        if (getResp.statusCode === 200 && getResp.data && getResp.data.length > 0) {
            profileId = getResp.data[0].id;
            console.log(`${c.green}✓${c.reset} Profile already exists`);
            console.log(`${c.cyan}  Profile ID: ${profileId}${c.reset}`);
            return true;
        }

        console.log(`${c.red}✗${c.reset} Failed to create profile: ${createResp.raw}`);
        return false;
    }
}

/**
 * Step 4: Create sample job requirement (from organization)
 */
async function createJobRequirement() {
    console.log(`\n${c.cyan}Step 4: Creating sample job requirement...${c.reset}`);

    const requirementData = {
        tenant_id: tenantId,
        client_id: userId, // Using engineer's user_id as client for testing
        title: 'Senior Full Stack Developer',
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        budget: 150000000, // ₹15L in paise
        status: 'open'
    };

    const createResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/requirements`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        },
        requirementData
    );

    if (createResp.statusCode === 201 && createResp.data) {
        const requirement = Array.isArray(createResp.data) ? createResp.data[0] : createResp.data;
        console.log(`${c.green}✓${c.reset} Job requirement created`);
        console.log(`${c.cyan}  Title: ${requirement.title}${c.reset}`);
        console.log(`${c.cyan}  Skills: ${requirementData.skills.join(', ')}${c.reset}`);
        console.log(`${c.cyan}  Budget: ₹${(requirementData.budget / 100).toLocaleString()}${c.reset}`);
        return requirement.id;
    } else {
        console.log(`${c.yellow}⚠${c.reset} Could not create requirement: ${createResp.raw}`);
        return null;
    }
}

/**
 * Step 5: Create job match
 */
async function createJobMatch(requirementId) {
    if (!requirementId) {
        console.log(`${c.yellow}⚠${c.reset} Skipping match creation - no requirement`);
        return null;
    }

    console.log(`\n${c.cyan}Step 5: Creating job match...${c.reset}`);

    const matchData = {
        tenant_id: tenantId,
        profile_id: profileId,
        requirement_id: requirementId,
        score: 85,
        status: 'pending'
    };

    const createResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/matches`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        },
        matchData
    );

    if (createResp.statusCode === 201 && createResp.data) {
        const match = Array.isArray(createResp.data) ? createResp.data[0] : createResp.data;
        console.log(`${c.green}✓${c.reset} Match created`);
        console.log(`${c.cyan}  Match Score: ${match.score}%${c.reset}`);
        console.log(`${c.cyan}  Status: ${match.status}${c.reset}`);
        return match.id;
    } else {
        console.log(`${c.yellow}⚠${c.reset} Could not create match: ${createResp.raw}`);
        return null;
    }
}

/**
 * Step 6: Create interview
 */
async function createInterview(matchId) {
    if (!matchId) {
        console.log(`${c.yellow}⚠${c.reset} Skipping interview creation - no match`);
        return null;
    }

    console.log(`\n${c.cyan}Step 6: Creating interview...${c.reset}`);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3); // 3 days from now

    const interviewData = {
        tenant_id: tenantId,
        match_id: matchId,
        scheduled_at: futureDate.toISOString(),
        jitsi_room_id: `talenthub-${Date.now()}`,
        status: 'scheduled',
        notes: 'Technical Interview - Full Stack Developer'
    };

    const createResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/interviews`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        },
        interviewData
    );

    if (createResp.statusCode === 201 && createResp.data) {
        const interview = Array.isArray(createResp.data) ? createResp.data[0] : createResp.data;
        console.log(`${c.green}✓${c.reset} Interview scheduled`);
        console.log(`${c.cyan}  Date: ${new Date(interview.scheduled_at).toLocaleString()}${c.reset}`);
        console.log(`${c.cyan}  Jitsi Room: https://meet.jit.si/${interview.jitsi_room_id}${c.reset}`);
        return interview.id;
    } else {
        console.log(`${c.yellow}⚠${c.reset} Could not create interview: ${createResp.raw}`);
        return null;
    }
}

/**
 * Step 7: Create offer letter
 */
async function createOffer() {
    console.log(`\n${c.cyan}Step 7: Creating offer letter...${c.reset}`);

    const joiningDate = new Date();
    joiningDate.setDate(joiningDate.getDate() + 30); // 30 days from now

    // Get a match_id for the offer (we need to create an offer linked to a match)
    const matchResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/matches?profile_id=eq.${profileId}&select=id&limit=1`,
        {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        }
    );

    let offerMatchId = null;
    if (matchResp.statusCode === 200 && matchResp.data && matchResp.data.length > 0) {
        offerMatchId = matchResp.data[0].id;
    }

    if (!offerMatchId) {
        console.log(`${c.yellow}⚠${c.reset} Skipping offer creation - no match found`);
        return null;
    }

    const offerData = {
        tenant_id: tenantId,
        match_id: offerMatchId,
        salary: 150000000, // ₹15L in paise
        start_date: joiningDate.toISOString().split('T')[0],
        status: 'pending'
    };

    const createResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/offer_letters`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        },
        offerData
    );

    if (createResp.statusCode === 201 && createResp.data) {
        const offer = Array.isArray(createResp.data) ? createResp.data[0] : createResp.data;
        console.log(`${c.green}✓${c.reset} Offer letter created`);
        console.log(`${c.cyan}  Salary: ₹${(offer.salary / 100000).toFixed(1)}L/year${c.reset}`);
        console.log(`${c.cyan}  Start Date: ${new Date(offer.start_date).toLocaleDateString()}${c.reset}`);
        return offer.id;
    } else {
        console.log(`${c.yellow}⚠${c.reset} Could not create offer: ${createResp.raw}`);
        return null;
    }
}

/**
 * Step 8: Create payment/invoice record
 */
async function createPayment() {
    console.log(`\n${c.cyan}Step 8: Creating payment record...${c.reset}`);

    const invoiceData = {
        engineer_id: userId,
        tenant_id: tenantId,
        amount: 10000000, // ₹1L in paise
        description: 'Placement Fee - Senior Full Stack Developer',
        status: 'paid',
        razorpay_payment_id: `pay_test_${Date.now()}`
    };

    const createResp = await makeRequest(
        `${SUPABASE_URL}/rest/v1/invoices`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        },
        invoiceData
    );

    if (createResp.statusCode === 201 && createResp.data) {
        const invoice = Array.isArray(createResp.data) ? createResp.data[0] : createResp.data;
        console.log(`${c.green}✓${c.reset} Payment record created`);
        console.log(`${c.cyan}  Amount: ₹${(invoice.amount / 100).toLocaleString()}${c.reset}`);
        console.log(`${c.cyan}  Status: ${invoice.status}${c.reset}`);
        console.log(`${c.cyan}  Payment ID: ${invoice.razorpay_payment_id}${c.reset}`);
        return invoice.id;
    } else {
        console.log(`${c.yellow}⚠${c.reset} Could not create payment: ${createResp.raw}`);
        return null;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log(`\n${c.blue}${c.bold}╔════════════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.blue}${c.bold}║         Engineer Portal - Test Data Setup                         ║${c.reset}`);
    console.log(`${c.blue}${c.bold}╚════════════════════════════════════════════════════════════════════╝${c.reset}\n`);

    try {
        const authSuccess = await authenticate();
        if (!authSuccess) {
            console.log(`\n${c.red}Setup failed - authentication error${c.reset}`);
            process.exit(1);
        }

        const tenantSuccess = await setupTenant();
        if (!tenantSuccess) {
            console.log(`\n${c.red}Setup failed - tenant error${c.reset}`);
            process.exit(1);
        }

        const profileSuccess = await createProfile();
        if (!profileSuccess) {
            console.log(`\n${c.red}Setup failed - profile creation error${c.reset}`);
            process.exit(1);
        }

        const requirementId = await createJobRequirement();
        const matchId = await createJobMatch(requirementId);
        await createInterview(matchId);
        await createOffer();
        await createPayment();

        console.log(`\n${c.green}${c.bold}✓ Test data setup complete!${c.reset}\n`);
        console.log(`${c.cyan}Summary:${c.reset}`);
        console.log(`  User ID: ${userId}`);
        console.log(`  Tenant ID: ${tenantId}`);
        console.log(`  Profile ID: ${profileId}`);
        console.log(`\n${c.yellow}You can now run: node test_engineer_portal.js${c.reset}\n`);

    } catch (error) {
        console.error(`${c.red}${c.bold}Fatal error:${c.reset}`, error);
        process.exit(1);
    }
}

main();
