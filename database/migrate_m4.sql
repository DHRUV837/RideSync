-- Migrate M4

-- 1. Add new enum values to booking_status (Requires Postgres 9.1+)
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- 2. Add columns to ride_bookings
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS pickup_stop_sequence INT DEFAULT 0 NOT NULL;
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS dropoff_stop_sequence INT DEFAULT 0 NOT NULL;

-- 3. Rename confirmed_at to accepted_at
ALTER TABLE ride_bookings RENAME COLUMN confirmed_at TO accepted_at;
