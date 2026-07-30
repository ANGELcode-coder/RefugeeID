const API = 'https://api.supabase.com/v1/projects/sfggjjfoyeinobtbwpii/database/query';
const PAT = 'sbp_YOUR_SUPABASE_PAT_HERE';

const queries = [
  // RPC: admin_list_users
  `CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (user_id uuid, email text, display_name text, roles app_role[], created_at timestamptz)
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can list users';
  END IF;
  RETURN QUERY
  SELECT au.id, au.email::text, p.display_name,
    COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}'::app_role[]),
    au.created_at
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  LEFT JOIN user_roles ur ON ur.user_id = au.id
  GROUP BY au.id, au.email, p.display_name, au.created_at
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;`,

  // RPC: admin_grant_role
  `CREATE OR REPLACE FUNCTION admin_grant_role(_target_user uuid, _role text)
RETURNS void
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can grant roles';
  END IF;
  INSERT INTO user_roles (user_id, role) VALUES (_target_user, _role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql;`,

  // RPC: admin_revoke_role
  `CREATE OR REPLACE FUNCTION admin_revoke_role(_target_user uuid, _role text)
RETURNS void
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can revoke roles';
  END IF;
  DELETE FROM user_roles WHERE user_id = _target_user AND role = _role::app_role;
END;
$$ LANGUAGE plpgsql;`,

  // RLS: Enable RLS on all tables
  `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;`,

  // RLS: Profiles policies
  `DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);`,

  // RLS: user_roles policies
  `DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_select_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON user_roles;
CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_admin" ON user_roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "user_roles_insert_admin" ON user_roles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "user_roles_delete_admin" ON user_roles FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);`,

  // RLS: issued_credentials policies
  `DROP POLICY IF EXISTS "issued_credentials_select_holder" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_select_issuer" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_select_verifier" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_select_admin" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_insert_issuer" ON issued_credentials;
DROP POLICY IF EXISTS "issued_credentials_update_issuer" ON issued_credentials;
CREATE POLICY "issued_credentials_select_holder" ON issued_credentials FOR SELECT USING (subject_user_id = auth.uid());
CREATE POLICY "issued_credentials_select_issuer" ON issued_credentials FOR SELECT USING (
  issuer_id = auth.uid() AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'issuer')
);
CREATE POLICY "issued_credentials_select_verifier" ON issued_credentials FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'verifier')
);
CREATE POLICY "issued_credentials_select_admin" ON issued_credentials FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "issued_credentials_insert_issuer" ON issued_credentials FOR INSERT WITH CHECK (
  issuer_id = auth.uid() AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'issuer')
);
CREATE POLICY "issued_credentials_update_issuer" ON issued_credentials FOR UPDATE USING (
  issuer_id = auth.uid() AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'issuer')
);`,

  // RLS: verification_logs policies
  `DROP POLICY IF EXISTS "verification_logs_insert" ON verification_logs;
DROP POLICY IF EXISTS "verification_logs_select_verifier" ON verification_logs;
DROP POLICY IF EXISTS "verification_logs_select_admin" ON verification_logs;
CREATE POLICY "verification_logs_insert" ON verification_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "verification_logs_select_verifier" ON verification_logs FOR SELECT USING (
  verifier_id = auth.uid() AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'verifier')
);
CREATE POLICY "verification_logs_select_admin" ON verification_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);`,
];

async function run() {
  for (let i = 0; i < queries.length; i++) {
    console.log(`Query ${i + 1}/${queries.length}...`);
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
      console.log(`  OK (${res.status})`);
    } else {
      console.log(`  FAIL (${res.status}): ${body.slice(0, 200)}`);
    }
  }
  console.log('\nMigration complete.');
}

run().catch(console.error);
