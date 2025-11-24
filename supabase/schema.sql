-- Create repair_shops table
CREATE TABLE IF NOT EXISTS repair_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  brands TEXT[] NOT NULL DEFAULT '{}',
  phone TEXT,
  email TEXT,
  website TEXT,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  is_dealer BOOLEAN NOT NULL DEFAULT false,
  osm_id TEXT,
  osm_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_repair_shops_country ON repair_shops(country);
CREATE INDEX IF NOT EXISTS idx_repair_shops_city ON repair_shops(city);
CREATE INDEX IF NOT EXISTS idx_repair_shops_brands ON repair_shops USING GIN(brands);
CREATE INDEX IF NOT EXISTS idx_repair_shops_osm_id ON repair_shops(osm_id);
CREATE INDEX IF NOT EXISTS idx_repair_shops_location ON repair_shops(latitude, longitude);

-- Enable Row Level Security (RLS)
ALTER TABLE repair_shops ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read repair shops (public directory)
CREATE POLICY "Allow public read access" ON repair_shops
  FOR SELECT
  USING (true);

-- Create a policy for inserting - allows authenticated users and service role (for data imports)
CREATE POLICY "Allow authenticated and service role insert" ON repair_shops
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Create a policy for updating - allows authenticated users and service role
CREATE POLICY "Allow authenticated and service role update" ON repair_shops
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Create a policy for deleting - allows authenticated users and service role
CREATE POLICY "Allow authenticated and service role delete" ON repair_shops
  FOR DELETE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_repair_shops_updated_at
  BEFORE UPDATE ON repair_shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - you can remove this if you want to add data manually)
INSERT INTO repair_shops (name, country, city, address, brands, phone, email, rating, is_dealer) VALUES
  ('Munich Motorcycle Masters', 'Germany', 'Munich', 'Hauptstraße 45', ARRAY['BMW', 'Ducati', 'KTM'], '+49 89 123456', 'info@munichmoto.de', 4.8, true),
  ('Paris Moto Service', 'France', 'Paris', '23 Rue de la Moto', ARRAY['Yamaha', 'Honda', 'Suzuki'], '+33 1 234567', 'contact@parismoto.fr', 4.5, false),
  ('Amsterdam Bike Workshop', 'Netherlands', 'Amsterdam', 'Motorweg 12', ARRAY['Harley-Davidson', 'Triumph', 'Royal Enfield'], '+31 20 123456', 'service@amsterdambike.nl', 4.7, true),
  ('Berlin Speed Shop', 'Germany', 'Berlin', 'Alexanderplatz 78', ARRAY['Kawasaki', 'Yamaha', 'Suzuki', 'Honda'], '+49 30 987654', 'info@berlinspeed.de', 4.6, false),
  ('Rome Ducati Center', 'Italy', 'Rome', 'Via delle Moto 34', ARRAY['Ducati', 'Aprilia', 'MV Agusta'], '+39 06 111222', 'info@romeducati.it', 4.9, true),
  ('Barcelona Motos', 'Spain', 'Barcelona', 'Carrer de la Moto 56', ARRAY['BMW', 'KTM', 'Husqvarna'], '+34 93 456789', 'hola@barcelonamotos.es', 4.4, true),
  ('Vienna Bike Repair', 'Austria', 'Vienna', 'Motorstraße 89', ARRAY['Honda', 'Yamaha', 'Kawasaki'], '+43 1 234567', 'service@viennabike.at', 4.3, false),
  ('Stockholm Moto Care', 'Sweden', 'Stockholm', 'Motorcykelvägen 23', ARRAY['BMW', 'Triumph', 'Ducati'], '+46 8 765432', 'info@stockholmmoto.se', 4.7, true);
