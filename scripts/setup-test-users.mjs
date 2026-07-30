const SUPABASE_URL = 'https://sfggjjfoyeinobtbwpii.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZ2dqamZveWVpbm9idGJ3cGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM1NzY5OSwiZXhwIjoyMTAwOTMzNjk5fQ.FZbIIhefggNvaPCpHEqpkEMYDnIZyku9kyXxQGl-71o';

const users = [
  { email: 'admin@rfid.demo', password: 'AdminR3fugee!2025X', role: 'admin', display_name: 'Admin User' },
  { email: 'holder@rfid.demo', password: 'HolderR3fugee!2025X', role: 'holder', display_name: 'Test Holder' },
  { email: 'issuer@rfid.demo', password: 'IssuerR3fugee!2025X', role: 'issuer', display_name: 'UNHCR Officer' },
  { email: 'verifier@rfid.demo', password: 'VerifierR3fugee!2025X', role: 'verifier', display_name: 'Border Agent' },
];

async function supabaseFetch(path, body, method = 'POST') {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log('=== Creating test users ===\n');

  for (const u of users) {
    console.log(`--- ${u.email} (${u.role}) ---`);

    // Check if user already exists via admin API
    const { data: listData } = await supabaseFetch('/auth/v1/admin/users', null, 'GET');
    const existing = Array.isArray(listData?.users)
      ? listData.users.find(us => us.email === u.email)
      : null;

    let userId;
    if (existing) {
      console.log('  ~ Already exists');
      userId = existing.id;
    } else {
      // Create user via admin API
      const { ok, data, status } = await supabaseFetch('/auth/v1/admin/users', {
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { display_name: u.display_name },
      });
      if (!ok) {
        console.log(`  ✗ Create failed (${status}): ${JSON.stringify(data).slice(0, 100)}`);
        continue;
      }
      userId = data?.id;
      console.log('  ✓ Created');
    }

    // Insert profile
    const { ok: profileOk } = await supabaseFetch('/rest/v1/profiles', {
      id: userId,
      display_name: u.display_name,
    });
    if (profileOk) console.log('  ✓ Profile created');

    // Insert role
    const { ok: roleOk } = await supabaseFetch('/rest/v1/user_roles', {
      user_id: userId,
      role: u.role,
    });
    if (roleOk) {
      console.log(`  ✓ Role '${u.role}' assigned`);
    } else {
      // Maybe already exists (unique constraint)
      console.log(`  ~ Role may already exist`);
    }
  }

  console.log('\n===========================================');
  console.log('            TEST CREDENTIALS');
  console.log('===========================================');
  for (const u of users) {
    console.log(`  ${u.role.padEnd(10)} | ${u.email.padEnd(22)} | ${u.password.padEnd(24)}`);
  }
  console.log('===========================================');
  console.log('\n  Web App:  http://localhost:5173/auth');
  console.log('  Admin:    http://localhost:5173/admin');
}

main().catch(console.error);
