-- =============================================================
-- RefugeeID RLS Policies
-- Apply via: Supabase SQL Editor or `pnpm run push`
-- =============================================================

-- Enable Row-Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- =============================================================

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS boolean
SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin');
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auth_has_role(role_name text)
RETURNS boolean
SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = role_name::app_role);
END; $$ LANGUAGE plpgsql;

-- =============================================================
-- PROFILES
-- =============================================================

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (auth_is_admin());

-- =============================================================
-- USER ROLES
-- =============================================================

CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_roles_select_admin" ON user_roles FOR SELECT USING (auth_is_admin());
CREATE POLICY "user_roles_insert_admin" ON user_roles FOR INSERT WITH CHECK (auth_is_admin());
CREATE POLICY "user_roles_delete_admin" ON user_roles FOR DELETE USING (auth_is_admin());

-- =============================================================
-- ISSUED CREDENTIALS
-- =============================================================

CREATE POLICY "issued_credentials_select_holder" ON issued_credentials FOR SELECT USING (subject_user_id = auth.uid());
CREATE POLICY "issued_credentials_select_issuer" ON issued_credentials FOR SELECT USING (issuer_id = auth.uid() AND auth_has_role('issuer'));
CREATE POLICY "issued_credentials_select_verifier" ON issued_credentials FOR SELECT USING (auth_has_role('verifier'));
CREATE POLICY "issued_credentials_select_admin" ON issued_credentials FOR SELECT USING (auth_is_admin());
CREATE POLICY "issued_credentials_insert_issuer" ON issued_credentials FOR INSERT WITH CHECK (issuer_id = auth.uid() AND auth_has_role('issuer'));
CREATE POLICY "issued_credentials_update_issuer" ON issued_credentials FOR UPDATE USING (issuer_id = auth.uid() AND auth_has_role('issuer'));

-- =============================================================
-- VERIFICATION LOGS
-- =============================================================

CREATE POLICY "verification_logs_insert" ON verification_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "verification_logs_select_verifier" ON verification_logs FOR SELECT USING (verifier_id = auth.uid() AND auth_has_role('verifier'));
CREATE POLICY "verification_logs_select_admin" ON verification_logs FOR SELECT USING (auth_is_admin());
