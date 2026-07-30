const API = 'https://api.supabase.com/v1/projects/sfggjjfoyeinobtbwpii/database/query';
const PAT = 'sbp_YOUR_SUPABASE_PAT_HERE';

const queries = [
  // Drop all existing policies on user_roles (the ones causing recursion)
  `DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON user_roles;`,

  // Drop policies on issued_credentials that check user_roles (also recursive)
  `DROP POLICY IF EXISTS "issued_credentials_select_issuer" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_select_verifier" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_select_admin" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_insert_issuer" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_update_issuer" ON issued_credentials;`,

  // Drop policies on verification_logs that check user_roles
  `DROP POLICY IF EXISTS "verification_logs_select_verifier" ON verification_logs;
DROP POLICY IF EXISTS "verification_logs_select_admin" ON verification_logs;`,

  // Drop policies on profiles that check user_roles
  `DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;`,

  // Create a SECURITY DEFINER helper function to check admin role (bypasses RLS)
  `CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql;`,

  // Re-create user_roles policies (no recursion since the admin check uses the helper)
  `CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_admin" ON user_roles FOR SELECT USING (auth_is_admin());
CREATE POLICY "user_roles_insert_admin" ON user_roles FOR INSERT WITH CHECK (auth_is_admin());
CREATE POLICY "user_roles_delete_admin" ON user_roles FOR DELETE USING (auth_is_admin());`,

  // Re-create issued_credentials policies using the helper
  `CREATE POLICY "issued_credentials_select_holder" ON issued_credentials FOR SELECT USING (subject_user_id = auth.uid());
CREATE POLICY "issued_credentials_select_issuer" ON issued_credentials FOR SELECT USING (
  issuer_id = auth.uid() AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'issuer')
);
CREATE POLICY "issued_credentials_select_verifier" ON issued_credentials FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'verifier')
);
CREATE POLICY "issued_credentials_select_admin" ON issued_credentials FOR SELECT USING (auth_is_admin());
CREATE POLICY "issued_credentials_insert_issuer" ON issued_credentials FOR INSERT WITH CHECK (
  issuer_id = auth.uid() AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'issuer')
);
CREATE POLICY "issued_credentials_update_issuer" ON issued_credentials FOR UPDATE USING (
  issuer_id = auth.uid() AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'issuer')
);`,

  // Wait — the issuer/verifier policies on issued_credentials ALSO query user_roles, causing recursion.
  // We need helpers for those too.
  `CREATE OR REPLACE FUNCTION auth_has_role(role_name text)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = role_name::app_role);
END;
$$ LANGUAGE plpgsql;`,

  // Re-drop and re-create issued_credentials policies using the role helper
  `DROP POLICY IF EXISTS "issued_credentials_select_issuer" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_select_verifier" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_select_admin" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_insert_issuer" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_update_issuer" ON issued_credentials;
CREATE POLICY "issued_credentials_select_holder" ON issued_credentials FOR SELECT USING (subject_user_id = auth.uid());
CREATE POLICY "issued_credentials_select_issuer" ON issued_credentials FOR SELECT USING (
  issuer_id = auth.uid() AND auth_has_role('issuer')
);
CREATE POLICY "issued_credentials_select_verifier" ON issued_credentials FOR SELECT USING (
  auth_has_role('verifier')
);
CREATE POLICY "issued_credentials_select_admin" ON issued_credentials FOR SELECT USING (auth_is_admin());
CREATE POLICY "issued_credentials_insert_issuer" ON issued_credentials FOR INSERT WITH CHECK (
  issuer_id = auth.uid() AND auth_has_role('issuer')
);
CREATE POLICY "issued_credentials_update_issuer" ON issued_credentials FOR UPDATE USING (
  issuer_id = auth.uid() AND auth_has_role('issuer')
);`,

  // Re-create verification_logs policies
  `DROP POLICY IF EXISTS "verification_logs_insert" ON verification_logs;
DROP POLICY IF EXISTS "verification_logs_select_verifier" ON verification_logs;
DROP POLICY IF EXISTS "verification_logs_select_admin" ON verification_logs;
CREATE POLICY "verification_logs_insert" ON verification_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "verification_logs_select_verifier" ON verification_logs FOR SELECT USING (
  verifier_id = auth.uid() AND auth_has_role('verifier')
);
CREATE POLICY "verification_logs_select_admin" ON verification_logs FOR SELECT USING (auth_is_admin());`,

  // Re-create profiles delete policy
  `DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (auth_is_admin());`,
];

async function run() {
  for (let i = 0; i < queries.length; i++) {
    const label = queries[i].split('\n')[0].replace(/^-- /, '').trim().slice(0, 60);
    process.stdout.write(`Step ${i + 1}/${queries.length}: ${label || queries[i].slice(0, 50)}... `);
    const res = await fetch(`${API}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: queries[i] }),
    });
    const body = await res.text();
    if (res.ok) {
      console.log('OK');
    } else {
      console.log(`FAIL (${res.status}): ${body.slice(0, 150)}`);
    }
  }

  // Test: sign in as admin and query user_roles
  console.log('\n--- Testing RLS fix ---');
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZ2dqamZveWVpbm9idGJ3cGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTc2OTksImV4cCI6MjEwMDkzMzY5OX0.ljPEbi6ulxlg9uvrE7RyuQkjRpv4dV-m2BBHsSzTTo0';
  const tokenRes = await fetch('https://sfggjjfoyeinobtbwpii.supabase.co/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email: 'admin@rfid.demo', password: 'AdminR3fugee!2025X' }),
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  const rolesRes = await fetch('https://sfggjjfoyeinobtbwpii.supabase.co/rest/v1/user_roles?select=*', {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
  });
  const rolesData = await rolesRes.json();
  if (Array.isArray(rolesData)) {
    console.log('✓ user_roles query works! Roles:', rolesData.map(r => r.role).join(', '));
  } else {
    console.log('✗ user_roles query failed:', JSON.stringify(rolesData).slice(0, 200));
  }
}

run().catch(console.error);
