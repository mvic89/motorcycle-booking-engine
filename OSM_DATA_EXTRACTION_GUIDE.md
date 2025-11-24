# OSM Data Extraction Guide

This guide explains how to populate your Supabase database with verified motorcycle repair shop data from OpenStreetMap (OSM).

## Overview

The extraction script fetches motorcycle repair shop data from OpenStreetMap's Overpass API for all EU countries. It focuses on:

- **Verified businesses**: Only shops with proper business information (name, location, address)
- **Quality data**: Filters for shops that appear in both OSM and Google Maps
- **Brand categorization**: Automatically detects and categorizes dealer-affiliated shops
- **Duplicate prevention**: Uses OSM IDs to avoid importing the same shop twice

## Prerequisites

### 1. Install Dependencies

```bash
npm install
```

This will install the `tsx` package needed to run TypeScript scripts.

### 2. Update Your Database Schema

If you already have an existing `repair_shops` table, run the migration:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Open the file `supabase/migration_add_location_fields.sql`
4. Copy and paste the contents into the SQL Editor
5. Click **Run**

If you're setting up a fresh database, use the main schema file:

1. Open `supabase/schema.sql`
2. Copy and paste into the SQL Editor
3. Click **Run**

### 3. Get Your Supabase Service Role Key

The extraction script needs write access to your database. You'll need the **service role key**:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **motorcycle-booking-engine**
3. Click **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)

⚠️ **IMPORTANT**: The service role key bypasses Row Level Security. Never expose it in client-side code or commit it to version control.

### 4. Configure Environment Variables

Add the service role key to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Running the Extraction Script

### Extract All EU Countries

To extract data from all 27 EU countries:

```bash
npm run extract-osm
```

⚠️ **Note**: This will take approximately 2-3 hours due to:
- API rate limiting (3-second delay between requests)
- Processing 27 countries
- Large data volumes

### Extract Specific Countries

To extract data from specific countries only:

```bash
npm run extract-osm DE FR IT ES
```

Use ISO 3166-1 alpha-2 country codes:

| Code | Country       | Code | Country        | Code | Country      |
|------|---------------|------|----------------|------|--------------|
| AT   | Austria       | IE   | Ireland        | PT   | Portugal     |
| BE   | Belgium       | IT   | Italy          | RO   | Romania      |
| BG   | Bulgaria      | LV   | Latvia         | SK   | Slovakia     |
| HR   | Croatia       | LT   | Lithuania      | SI   | Slovenia     |
| CY   | Cyprus        | LU   | Luxembourg     | ES   | Spain        |
| CZ   | Czech Rep.    | MT   | Malta          | SE   | Sweden       |
| DK   | Denmark       | NL   | Netherlands    |      |              |
| EE   | Estonia       | PL   | Poland         |      |              |
| FI   | Finland       |      |                |      |              |
| FR   | France        |      |                |      |              |
| DE   | Germany       |      |                |      |              |
| GR   | Greece        |      |                |      |              |
| HU   | Hungary       |      |                |      |              |

### Examples

Extract data for Germany only:
```bash
npm run extract-osm DE
```

Extract data for major markets (Germany, France, Italy, Spain, UK):
```bash
npm run extract-osm DE FR IT ES
```

Extract Benelux countries:
```bash
npm run extract-osm BE NL LU
```

## What Gets Extracted

The script extracts the following information for each shop:

### Required Fields
- **Name**: Business name
- **Country**: Full country name
- **City**: City location
- **Address**: Street address
- **Latitude/Longitude**: GPS coordinates for Google Maps integration

### Optional Fields
- **Phone**: Contact phone number
- **Email**: Contact email
- **Website**: Business website
- **Brands**: Detected motorcycle brands (for filtering)
- **Is Dealer**: Whether it's an official dealer (vs independent shop)
- **OSM ID**: Unique identifier to prevent duplicates

## How Brand Detection Works

The script automatically detects brands in two ways:

1. **Explicit brand tags**: OSM entries with `brand=BMW`, `brand=Ducati`, etc.
2. **Name analysis**: Business names containing brand names (e.g., "Munich BMW Motorcycles")

Supported brands:
- BMW, Ducati, Harley-Davidson, Honda, Kawasaki, KTM, Suzuki, Triumph, Yamaha
- Aprilia, MV Agusta, Royal Enfield, Husqvarna, Benelli, Moto Guzzi, Indian
- Vespa, Piaggio

## How Dealer Detection Works

A shop is marked as `is_dealer: true` if:

1. It has an explicit `brand` tag in OSM
2. The shop type is `motorcycle` with repair services
3. The name contains: "dealer", "center/centre", or "official"

## Data Quality Filters

The script only imports shops that meet these criteria:

✅ **Must Have**:
- Business name
- GPS coordinates
- Valid address or city

✅ **Preferred** (improves quality):
- Phone number or email
- Website
- Proper street address

❌ **Excluded**:
- Shops without names
- Shops without location data
- Duplicate entries (same OSM ID)

## Monitoring the Extraction

The script provides real-time progress updates:

```
🚀 Starting OSM data extraction for EU motorcycle repair shops...

🌍 Extracting data for Germany...
📥 Found 450 potential shops
  ✅ Imported: Munich Motorcycle Masters (Munich, Germany)
  ✅ Imported: Berlin Speed Shop (Berlin, Germany)
  ⏭️  Skipping duplicate: Hamburg Bikes
  ...
✨ Imported 387 new shops from Germany

⏳ Waiting 3 seconds before next request...

🌍 Extracting data for France...
...

🎉 Extraction complete! Total shops imported: 2,456
```

## Handling Errors

### API Rate Limiting

If you see errors about rate limiting:

```
❌ Error: 429 Too Many Requests
```

**Solution**: The script already includes 3-second delays. If this happens, wait 5 minutes and try again.

### Invalid Supabase Credentials

```
❌ Missing Supabase credentials
```

**Solution**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### Database Connection Errors

```
❌ Error importing shop: connection timeout
```

**Solution**:
1. Check your internet connection
2. Verify Supabase project is running
3. Check your Supabase dashboard for service issues

## Verifying the Import

After extraction, verify the data in Supabase:

1. Go to **Supabase Dashboard** → **Table Editor**
2. Select the `repair_shops` table
3. Check the imported records

Or run this SQL query:

```sql
-- Count shops by country
SELECT country, COUNT(*) as shop_count
FROM repair_shops
GROUP BY country
ORDER BY shop_count DESC;

-- View sample data
SELECT name, city, country, brands, is_dealer, latitude, longitude
FROM repair_shops
LIMIT 10;
```

## Re-running the Script

The script is safe to re-run. It will:

- ✅ Skip shops that already exist (based on OSM ID)
- ✅ Only import new shops
- ✅ Not create duplicates

## Updating Existing Data

If you want to refresh data for a country:

1. Delete existing entries:
```sql
DELETE FROM repair_shops WHERE country = 'Germany';
```

2. Re-run the extraction:
```bash
npm run extract-osm DE
```

## Cost Considerations

### OpenStreetMap Overpass API
- **FREE** to use
- Rate limited to be respectful
- No API key required

### Supabase
- Writes count toward your database usage
- Most hobby plans can handle 10,000+ shops easily
- Check your [Supabase usage dashboard](https://supabase.com/dashboard/project/_/settings/billing)

## Best Practices

1. **Start small**: Test with 1-2 countries before running all EU
2. **Monitor progress**: Watch the console output for errors
3. **Verify data quality**: Check a few entries in Supabase after import
4. **Schedule updates**: Re-run monthly to get new shops
5. **Backup first**: Export your current data before large imports

## Troubleshooting

### No shops imported for a country

Some smaller countries may have limited OSM data. This is normal for:
- Malta, Cyprus, Luxembourg (smaller populations)
- Newer EU members (less OSM coverage)

### Wrong brands detected

The brand detection is based on naming patterns. You can manually update brands in Supabase:

```sql
UPDATE repair_shops
SET brands = ARRAY['Honda', 'Yamaha']
WHERE id = 'shop-uuid-here';
```

### Missing phone/email

Not all OSM entries have contact information. This is normal. You can:
1. Manually add them in Supabase
2. Encourage users to submit updates to OSM

## Next Steps

After importing data:

1. **Test filtering**: Try the country, city, and brand filters in your app
2. **Verify Google Maps links**: Click the "View on Google Maps" button on some shops
3. **Check data quality**: Review a sample of shops to ensure accuracy
4. **Set up updates**: Schedule periodic re-runs to keep data fresh

## Support

For issues with:
- **The script**: Check the console output for error messages
- **Supabase**: Review your project logs in the dashboard
- **OSM data quality**: Report issues to [OpenStreetMap](https://www.openstreetmap.org)

## Advanced: Customizing the Script

You can modify [scripts/extractOSMData.ts](scripts/extractOSMData.ts) to:

- Add more motorcycle brands to the `MOTORCYCLE_BRANDS` array
- Adjust the Overpass query to include different shop types
- Change quality filters (e.g., require phone numbers)
- Add custom data transformations

Remember to test changes on a single country first!
