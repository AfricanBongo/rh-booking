INSERT INTO church_branches (name) VALUES
  ('Royalhouse, CT | Victory Center'),
  ('Royalhouse, DC | DC Mission'),
  ('Royalhouse DE | Delaware Fellowship'),
  ('Royalhouse, ATL | Miracle Life Center'),
  ('Royalhouse, MA | Mt. Zion Center'),
  ('Royalhouse, MD | Frederick Campus'),
  ('Royalhouse MD | Grace2Grace Center'),
  ('Royalhouse, NC | Bread of Life Center'),
  ('Royalhouse, NC | Dunamis Center'),
  ('Royalhouse, NC | Glory Center'),
  ('Royalhouse, NJ | Covenant Center'),
  ('Royalhouse, NY | Buffalo Fellowship'),
  ('Royalhouse, NY | Kingdom Center'),
  ('Royalhouse, NY | Latter Rain Center'),
  ('Royalhouse, PA | Philadelphia Mission'),
  ('Royalhouse, PA | Pittsburg Mission'),
  ('Royalhouse, TX | Houston Mission'),
  ('Royalhouse, VA | Breakthrough Center'),
  ('Royalhouse, VA | Norfolk Mission'),
  ('Royalhouse, WA | Washington Fellowship'),
  ('Royalhouse Canada | Canada Fellowship'),
  ('Royalhouse, NY | Orange & Rockland Fellowship');

SELECT vault.create_secret('http://host.docker.internal:54321', 'project_url');
SELECT vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU', 'service_role_key');
