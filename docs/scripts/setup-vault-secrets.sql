-- Run this ONCE per environment via the Supabase Dashboard SQL Editor.
-- Go to: https://supabase.com/dashboard/project/<ref>/sql/new
-- Replace <YOUR_SERVICE_ROLE_KEY> with the service role key from
-- Project Settings > API > service_role (secret) key.

-- STAGING (project: eswjpuapwsehqrfzufpw)
-- SELECT vault.create_secret('https://eswjpuapwsehqrfzufpw.supabase.co', 'project_url');
-- SELECT vault.create_secret('<STAGING_SERVICE_ROLE_KEY>', 'service_role_key');

-- PRODUCTION (project: cagwgqubupwayqewsvlq)
-- SELECT vault.create_secret('https://cagwgqubupwayqewsvlq.supabase.co', 'project_url');
-- SELECT vault.create_secret('<PRODUCTION_SERVICE_ROLE_KEY>', 'service_role_key');

-- If re-running (secret already exists), update instead:
-- UPDATE vault.secrets SET secret = '<NEW_VALUE>' WHERE name = 'project_url';
-- UPDATE vault.secrets SET secret = '<NEW_VALUE>' WHERE name = 'service_role_key';
