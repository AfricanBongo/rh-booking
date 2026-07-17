ALTER TABLE church_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read church branches"
  ON church_branches FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Authenticated users can search profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can read own registrations"
  ON conference_registrations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own registrations"
  ON conference_registrations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own registrations"
  ON conference_registrations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can read room groups they belong to"
  ON room_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.room_group_id = room_groups.id
      AND bookings.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create room groups"
  ON room_groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can read invitations they sent or received"
  ON invitations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = inviter_id OR (select auth.uid()) = invitee_id);

CREATE POLICY "Users can create invitations as inviter"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = inviter_id);

CREATE POLICY "Invitees can update invitation status"
  ON invitations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = invitee_id)
  WITH CHECK ((select auth.uid()) = invitee_id);

CREATE POLICY "Parents can read own children"
  ON children FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = parent_id);

CREATE POLICY "Parents can insert own children"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = parent_id);

CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = parent_id);

CREATE POLICY "Users can read own merch orders"
  ON merch_orders FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own merch orders"
  ON merch_orders FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
