// Fix SECURITY DEFINER function permissions and enable leaked password protection
const API = 'https://api.supabase.com/v1/projects/sfggjjfoyeinobtbwpii';

async function runSQL(sql) {
  const res = await fetch(`${API}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sbp_YOUR_SUPABASE_PAT_HERE',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  console.log(res.ok ? '  OK' : `  FAIL: ${body.slice(0, 150)}`);
}

async function main() {
  console.log('=== Revoke EXECUTE on admin RPCs from PUBLIC (anon) ===');

  // Step 1: Revoke PUBLIC execution on admin RPCs (prevents anon from calling them)
  console.log('1. Revoke admin_list_users from PUBLIC...');
  await runSQL('REVOKE EXECUTE ON FUNCTION admin_list_users() FROM PUBLIC;');

  console.log('2. Grant admin_list_users to authenticated...');
  await runSQL('GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;');

  console.log('3. Revoke admin_grant_role from PUBLIC...');
  await runSQL('REVOKE EXECUTE ON FUNCTION admin_grant_role(uuid, text) FROM PUBLIC;');

  console.log('4. Grant admin_grant_role to authenticated...');
  await runSQL('GRANT EXECUTE ON FUNCTION admin_grant_role(uuid, text) TO authenticated;');

  console.log('5. Revoke admin_revoke_role from PUBLIC...');
  await runSQL('REVOKE EXECUTE ON FUNCTION admin_revoke_role(uuid, text) FROM PUBLIC;');

  console.log('6. Grant admin_revoke_role to authenticated...');
  await runSQL('GRANT EXECUTE ON FUNCTION admin_revoke_role(uuid, text) TO authenticated;');

  // Helper functions auth_is_admin and auth_has_role stay accessible to all
  // because RLS policies need them for both anon and authenticated users.
  // They use auth.uid() which returns null for anon, so no info leakage.

  console.log('\n=== Apply same fix to updated migration file ===');
  console.log('(already updated in scripts/migrate-schema.sql and lib/db/src/migrations/001_rls_policies.sql)');

  // Step 2: Enable leaked password protection via Auth settings API
  console.log('\n=== Enable Leaked Password Protection ===');
  try {
    const res2 = await fetch(`${API}/auth/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer sbp_YOUR_SUPABASE_PAT_HERE',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ SECURITY_MANUAL_PASSWORD_HIBP: true }),
    });
    const body2 = await res2.text();
    if (res2.ok) console.log('  OK');
    else console.log(`  FAIL: ${body2.slice(0, 200)}`);
  } catch (e) {
    console.log(`  FAIL: ${e.message}`);
  }

  // Step 3: Verify the fix
  console.log('\n=== Verification ===');
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZ2dqamZveWVpbm9idGJ3cGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTc2OTksImV4cCI6MjEwMDkzMzY5OX0.ljPEbi6ulxlg9uvrE7RyuQkjRpv4dV-m2BBHsSzTTo0';

  // Sign in as admin
  const tokenRes = await fetch('https://sfggjjfoyeinobtbwpii.supabase.co/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
    body: JSON.stringify({ email: 'admin@rfid.demo', password: 'AdminR3fugee!2025X' }),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  // Test admin_list_users as authenticated user (should still work)
  const rpcRes = await fetch('https://sfggjjfoyeinobtbwpii.supabase.co/rest/v1/rpc/admin_list_users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
    },
    body: '{}',
  });
  if (rpcRes.ok) {
    const users = await rpcRes.json();
    console.log(`  admin_list_users (authenticated): OK (${users.length} users)`);
  } else {
    console.log(`  admin_list_users (authenticated): FAILED ${rpcRes.status}`);
  }

  // Test admin_list_users as anon (should fail with 401/403)
  const anonRes = await fetch('https://sfggjjfoyeinobtbwpii.supabase.co/rest/v1/rpc/admin_list_users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
    body: '{}',
  });
  if (anonRes.status === 401 || anonRes.status === 403) {
    console.log('  admin_list_users (anon): BLOCKED ✓');
  } else {
    console.log(`  admin_list_users (anon): unexpected ${anonRes.status}`);
  }
}

main().catch(console.error);
