# Supabase Setup Guide

This guide will help you connect your local project to Supabase.

## Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **motorcycle-booking-engine**
3. Click on the **Settings** icon in the sidebar
4. Navigate to **API** section
5. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 2: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Replace the placeholders with your actual values from Step 1.

## Step 3: Create the Database Table

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents from `supabase/schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the script

This will:
- Create the `repair_shops` table
- Set up proper indexes for performance
- Enable Row Level Security (RLS)
- Create policies for public read access
- Add sample data (8 repair shops)

## Step 4: Run Your Development Server

```bash
npm run dev
```

Your app should now be connected to Supabase and display the repair shops from your database!

## Database Schema

The `repair_shops` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| name | TEXT | Shop name |
| country | TEXT | Country location |
| city | TEXT | City location |
| address | TEXT | Full address |
| latitude | DECIMAL(10,8) | GPS latitude for Google Maps |
| longitude | DECIMAL(11,8) | GPS longitude for Google Maps |
| brands | TEXT[] | Array of supported motorcycle brands |
| phone | TEXT | Contact phone (optional) |
| email | TEXT | Contact email (optional) |
| website | TEXT | Business website (optional) |
| rating | DECIMAL(2,1) | Rating from 0-5 |
| is_dealer | BOOLEAN | Whether it's an official dealer |
| osm_id | TEXT | OpenStreetMap ID (prevents duplicates) |
| osm_type | TEXT | OSM element type (node/way/relation) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Adding New Repair Shops

### Option 1: Automated Import from OpenStreetMap (Recommended)

Import verified motorcycle repair shops from OpenStreetMap for all EU countries:

```bash
npm run extract-osm
```

See [QUICK_START.md](QUICK_START.md) for a quick guide or [OSM_DATA_EXTRACTION_GUIDE.md](OSM_DATA_EXTRACTION_GUIDE.md) for detailed instructions.

### Option 2: Manual Entry

1. **Supabase Dashboard**:
   - Go to **Table Editor**
   - Select `repair_shops` table
   - Click **Insert row**

2. **SQL Query**:
   ```sql
   INSERT INTO repair_shops (name, country, city, address, latitude, longitude, brands, phone, email, website, rating, is_dealer)
   VALUES (
     'Shop Name',
     'Country',
     'City',
     'Street Address 123',
     48.1351,  -- latitude
     11.5820,  -- longitude
     ARRAY['Brand1', 'Brand2'],
     '+00 00 000000',
     'email@example.com',
     'https://example.com',
     4.5,
     false
   );
   ```

## Security Notes

- The `.env.local` file is already in `.gitignore` and won't be committed
- The `anon` key is safe to use in client-side code
- Row Level Security is enabled to control data access
- Public read access is allowed for the directory feature
- Only authenticated users can insert/update/delete (you can modify policies as needed)

## Troubleshooting

### Error: "Failed to load repair shops"

1. Check that your environment variables are set correctly
2. Verify the table exists in your Supabase database
3. Make sure Row Level Security policies are set up
4. Restart your development server after adding env variables

### No data showing up

1. Check if the sample data was inserted by running this query in SQL Editor:
   ```sql
   SELECT * FROM repair_shops;
   ```
2. If no data, re-run the INSERT statements from `schema.sql`
