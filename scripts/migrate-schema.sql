-- =============================================================
-- RefugeeID Full Schema Migration
-- Apply via Supabase SQL Editor or psql
-- =============================================================

DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS credential_status CASCADE;
DROP TYPE IF EXISTS verification_method CASCADE;
DROP TYPE IF EXISTS verification_result CASCADE;
DROP TYPE IF EXISTS face_verification_status CASCADE;
DROP FUNCTION IF EXISTS admin_list_users CASCADE;
DROP FUNCTION IF EXISTS admin_grant_role CASCADE;
DROP FUNCTION IF EXISTS admin_revoke_role CASCADE;
DROP FUNCTION IF EXISTS auth_is_admin CASCADE;
DROP FUNCTION IF EXISTS auth_has_role CASCADE;

CREATE TYPE app_role AS ENUM ('holder', 'issuer', 'verifier', 'admin');
CREATE TYPE credential_status AS ENUM ('active', 'revoked');
CREATE TYPE verification_method AS ENUM ('qr', 'code', 'nfc');
CREATE TYPE verification_result AS ENUM ('valid', 'revoked', 'unknown');
CREATE TYPE face_verification_status AS ENUM ('pending', 'verified', 'failed');

CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  display_name text,
  face_embedding text,
  face_image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE issued_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  given_name text NOT NULL,
  family_name text NOT NULL,
  date_of_birth text NOT NULL,
  nationality text NOT NULL,
  gender text NOT NULL,
  case_number text NOT NULL,
  arrival_site text NOT NULL,
  status credential_status NOT NULL DEFAULT 'active',
  issuer_id uuid NOT NULL,
  issuer_did text NOT NULL,
  subject_did text NOT NULL,
  subject_user_id uuid,
  claim_code text,
  claim_code_expires_at timestamptz,
  claimed_at timestamptz,
  face_image_url text,
  face_embedding text,
  face_verification_status face_verification_status DEFAULT 'pending',
  vc_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_id uuid NOT NULL,
  method verification_method NOT NULL,
  result verification_result NOT NULL,
  holder_alias text NOT NULL,
  issuer text NOT NULL,
  credential_type text NOT NULL,
  notes text,
  subject_did text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- =============================================================

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean
SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin');
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auth_has_role(role_name text)
RETURNS boolean
SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = role_name::app_role);
END; $$ LANGUAGE plpgsql;

-- =============================================================
-- RPC FUNCTIONS
-- =============================================================

CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (user_id uuid, email text, display_name text, roles app_role[], created_at timestamptz)
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') THEN
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_grant_role(_target_user uuid, _role text)
RETURNS void
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can grant roles';
  END IF;
  INSERT INTO user_roles (user_id, role) VALUES (_target_user, _role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_revoke_role(_target_user uuid, _role text)
RETURNS void
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can revoke roles';
  END IF;
  DELETE FROM user_roles WHERE user_id = _target_user AND role = _role::app_role;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- RLS POLICIES
-- =============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (auth_is_admin());

CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_admin" ON user_roles FOR SELECT USING (auth_is_admin());
CREATE POLICY "user_roles_insert_admin" ON user_roles FOR INSERT WITH CHECK (auth_is_admin());
CREATE POLICY "user_roles_delete_admin" ON user_roles FOR DELETE USING (auth_is_admin());

CREATE POLICY "issued_credentials_select_holder" ON issued_credentials FOR SELECT USING (subject_user_id = auth.uid());
CREATE POLICY "issued_credentials_select_issuer" ON issued_credentials FOR SELECT USING (issuer_id = auth.uid() AND auth_has_role('issuer'));
CREATE POLICY "issued_credentials_select_verifier" ON issued_credentials FOR SELECT USING (auth_has_role('verifier'));
CREATE POLICY "issued_credentials_select_admin" ON issued_credentials FOR SELECT USING (auth_is_admin());
CREATE POLICY "issued_credentials_insert_issuer" ON issued_credentials FOR INSERT WITH CHECK (issuer_id = auth.uid() AND auth_has_role('issuer'));
CREATE POLICY "issued_credentials_update_issuer" ON issued_credentials FOR UPDATE USING (issuer_id = auth.uid() AND auth_has_role('issuer'));

CREATE POLICY "verification_logs_insert" ON verification_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "verification_logs_select_verifier" ON verification_logs FOR SELECT USING (verifier_id = auth.uid() AND auth_has_role('verifier'));
CREATE POLICY "verification_logs_select_admin" ON verification_logs FOR SELECT USING (auth_is_admin());

-- =============================================================
-- FUNCTION PERMISSIONS
-- =============================================================

-- Admin RPCs: only authenticated users can call them via REST API
REVOKE EXECUTE ON FUNCTION admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;
REVOKE EXECUTE ON FUNCTION admin_grant_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_grant_role(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION admin_revoke_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_revoke_role(uuid, text) TO authenticated;

-- Helper functions remain accessible to all (used internally by RLS policies)
-- auth_is_admin() and auth_has_role(text) - no change needed
