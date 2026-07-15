CREATE TABLE church_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL CHECK (age > 0),
  church_branch_id UUID NOT NULL REFERENCES church_branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conference_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conference_id TEXT NOT NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, conference_id)
);

CREATE TABLE room_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id TEXT NOT NULL,
  room_type_id TEXT NOT NULL,
  bed_preference TEXT NOT NULL CHECK (bed_preference IN ('king', 'double')),
  relationship_type TEXT CHECK (relationship_type IN ('married', 'siblings', 'none')),
  max_occupants INTEGER NOT NULL CHECK (max_occupants IN (1, 2, 4)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_group_id UUID NOT NULL REFERENCES room_groups(id) ON DELETE CASCADE,
  conference_id TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, conference_id)
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_group_id UUID NOT NULL REFERENCES room_groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id),
  invitee_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  age INTEGER NOT NULL CHECK (age > 0),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  is_billable BOOLEAN GENERATED ALWAYS AS (age >= 12) STORED
);

CREATE TABLE merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merch_item_id TEXT NOT NULL,
  pickup_location_id TEXT NOT NULL,
  stripe_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, phone, gender, age, church_branch_id)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'gender',
      (NEW.raw_user_meta_data->>'age')::INTEGER,
      (NEW.raw_user_meta_data->>'church_branch_id')::UUID
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON church_branches TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conference_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON room_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON children TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON merch_orders TO authenticated;
