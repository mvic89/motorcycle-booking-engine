-- Migration: Add location and OSM fields to existing repair_shops table
-- Run this if you already have the repair_shops table created

-- Add new columns if they don't exist
ALTER TABLE repair_shops
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS osm_id TEXT,
  ADD COLUMN IF NOT EXISTS osm_type TEXT;

-- Make phone and email nullable (since OSM data might not always have them)
ALTER TABLE repair_shops
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_repair_shops_osm_id ON repair_shops(osm_id);
CREATE INDEX IF NOT EXISTS idx_repair_shops_location ON repair_shops(latitude, longitude);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated insert" ON repair_shops;
DROP POLICY IF EXISTS "Allow authenticated update" ON repair_shops;
DROP POLICY IF EXISTS "Allow authenticated delete" ON repair_shops;

-- Create new policies that allow service role access (for data imports)
CREATE POLICY "Allow authenticated and service role insert" ON repair_shops
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated and service role update" ON repair_shops
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated and service role delete" ON repair_shops
  FOR DELETE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
