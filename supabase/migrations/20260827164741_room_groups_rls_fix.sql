-- Replace restrictive room_groups RLS with open authenticated CRUD.
-- Room groups are shared booking infrastructure — any authenticated user
-- needs full access during the booking flow (create group, join group, read group).

DROP POLICY IF EXISTS "Users can read room groups they belong to" ON room_groups;
DROP POLICY IF EXISTS "Authenticated users can create room groups" ON room_groups;

CREATE POLICY "Authenticated users can manage room groups"
  ON room_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
