CREATE TABLE booking_dining_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  dining_pass_id TEXT NOT NULL,
  dining_pass_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  for_guest_index INTEGER NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE booking_dining_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dining passes"
  ON booking_dining_passes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_dining_passes.booking_id
    AND bookings.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own dining passes"
  ON booking_dining_passes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_dining_passes.booking_id
    AND bookings.user_id = auth.uid()
  ));

GRANT SELECT, INSERT, DELETE ON booking_dining_passes TO authenticated;
