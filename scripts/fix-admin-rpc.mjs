const API = 'https://api.supabase.com/v1/projects/sfggjjfoyeinobtbwpii/database/query';
const PAT = 'sbp_YOUR_SUPABASE_PAT_HERE';

const query = `CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (user_id uuid, email text, display_name text, roles app_role[], created_at timestamptz)
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can list users';
  END IF;
  RETURN QUERY
  SELECT au.id::uuid, au.email::text, p.display_name,
    COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}'::app_role[]),
    au.created_at
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  LEFT JOIN user_roles ur ON ur.user_id = au.id
  GROUP BY au.id, au.email, p.display_name, au.created_at
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;`;

async function main() {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const body = await res.text();
  if (res.ok) {
    console.log('admin_list_users updated successfully');
  } else {
    console.log(`Failed: ${body}`);
  }
}

main().catch(console.error);
