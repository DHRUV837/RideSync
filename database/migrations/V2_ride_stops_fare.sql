-- M1: Ride stops fare-from-origin and stop name
-- Run against an existing carpooling_db when not using Hibernate ddl-auto: update

ALTER TABLE ride_stops
    ADD COLUMN IF NOT EXISTS stop_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fare_from_origin DECIMAL(10,2);

-- Backfill legacy rows (if any) before enforcing NOT NULL
UPDATE ride_stops
SET stop_name = COALESCE(NULLIF(TRIM(stop_name), ''), address, 'Stop'),
    fare_from_origin = COALESCE(fare_from_origin, 0)
WHERE stop_name IS NULL OR fare_from_origin IS NULL;

ALTER TABLE ride_stops
    ALTER COLUMN stop_name SET NOT NULL,
    ALTER COLUMN fare_from_origin SET NOT NULL;

ALTER TABLE rides
    ADD COLUMN IF NOT EXISTS route_geometry TEXT;

CREATE INDEX IF NOT EXISTS idx_ride_stops_ride_order ON ride_stops(ride_id, stop_order);
