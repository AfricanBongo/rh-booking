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
  USING (true);

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can search profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can read own registrations"
  ON conference_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registrations"
  ON conference_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own registrations"
  ON conference_registrations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read room groups they belong to"
  ON room_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.room_group_id = room_groups.id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create room groups"
  ON room_groups FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read invitations they sent or received"
  ON invitations FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create invitations as inviter"
  ON invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can update invitation status"
  ON invitations FOR UPDATE
  USING (auth.uid() = invitee_id);

CREATE POLICY "Parents can read own children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert own children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE
  USING (auth.uid() = parent_id);

CREATE POLICY "Users can read own merch orders"
  ON merch_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own merch orders"
  ON merch_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
