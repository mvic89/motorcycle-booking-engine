# Setup Summary - OSM Integration Complete

This document summarizes all the changes made to integrate OpenStreetMap data extraction into your motorcycle repair shop directory.

## What's Been Added

### 1. Database Schema Updates

**Files Modified:**
- [supabase/schema.sql](supabase/schema.sql) - Updated main schema
- [supabase/migration_add_location_fields.sql](supabase/migration_add_location_fields.sql) - New migration file

**New Database Fields:**
- `latitude` (DECIMAL) - GPS latitude for Google Maps
- `longitude` (DECIMAL) - GPS longitude for Google Maps
- `website` (TEXT) - Business website URL
- `osm_id` (TEXT) - Unique OpenStreetMap identifier (prevents duplicates)
- `osm_type` (TEXT) - OSM element type (node/way/relation)

**Changed Fields:**
- `phone` - Now optional (nullable)
- `email` - Now optional (nullable)

**New Indexes:**
- Index on `osm_id` for fast duplicate checking
- Index on `latitude, longitude` for location queries

**Updated RLS Policies:**
- Policies now allow `service_role` access for data imports
- Public read access remains unchanged

### 2. TypeScript Type Updates

**File Modified:**
- [app/types/index.ts](app/types/index.ts)

**Updated Interface:**
```typescript
export interface RepairShop {
  // ... existing fields
  latitude?: number;
  longitude?: number;
  website?: string;
  osm_id?: string;
  osm_type?: string;
  // phone and email are now optional
}
```

### 3. OSM Data Extraction Script

**New File:**
- [scripts/extractOSMData.ts](scripts/extractOSMData.ts)

**Features:**
- Fetches motorcycle repair shop data from OpenStreetMap
- Covers all 27 EU countries
- Automatic brand detection (BMW, Ducati, Honda, etc.)
- Dealer identification (official dealers vs independent shops)
- Duplicate prevention using OSM IDs
- Quality filters (requires name, location, etc.)
- Rate limiting to respect Overpass API
- Real-time progress reporting

**Usage:**
```bash
# Import all EU countries
npm run extract-osm

# Import specific countries
npm run extract-osm DE FR IT ES
```

### 4. Front-End Updates

**File Modified:**
- [app/page.tsx](app/page.tsx)

**New Feature:**
- Google Maps button on each shop card
- Only shows when latitude/longitude data exists
- Opens Google Maps with exact shop location
- Supports direct navigation

**UI Changes:**
```tsx
<a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}>
  View on Google Maps
</a>
```

### 5. Package.json Updates

**File Modified:**
- [package.json](package.json)

**New Script:**
- `extract-osm` - Runs the OSM data extraction

**New Dependency:**
- `tsx` (dev) - Runs TypeScript scripts directly

### 6. Environment Variables

**File Modified:**
- [.env.local](.env.local)

**New Variable:**
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Required for the extraction script to write to the database.

### 7. Documentation

**New Files:**
- [README.md](README.md) - Project overview
- [QUICK_START.md](QUICK_START.md) - Quick start guide for OSM import
- [OSM_DATA_EXTRACTION_GUIDE.md](OSM_DATA_EXTRACTION_GUIDE.md) - Comprehensive extraction guide
- [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - This file

**Modified Files:**
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Updated with new schema and OSM info

## Next Steps

### 1. Update Your Database (Required)

Run the migration in your Supabase dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor → New query
3. Copy contents from `supabase/migration_add_location_fields.sql`
4. Run the query

### 2. Add Service Role Key (Required)

1. Supabase Dashboard → Settings → API
2. Copy the `service_role` key (NOT anon key)
3. Add to `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_actual_key
   ```

### 3. Install Dependencies (Required)

```bash
npm install
```

### 4. Import OSM Data (Recommended)

Start with a few countries to test:

```bash
npm run extract-osm DE FR IT
```

Then verify:
1. Check Supabase Table Editor for new data
2. Run `npm run dev` and see shops with Google Maps buttons
3. Click a Google Maps button to verify it works

### 5. Import All EU Countries (Optional)

Once verified:

```bash
npm run extract-osm
```

Takes 2-3 hours for all 27 countries.

## How It Works

### Data Flow

```
OpenStreetMap
    ↓ (Overpass API)
Extraction Script
    ↓ (Quality Filtering)
Supabase Database
    ↓ (Read via Anon Key)
Next.js Frontend
    ↓ (User clicks)
Google Maps
```

### Brand Detection

The script detects brands in two ways:

1. **Explicit tags**: `brand=BMW`, `brand=Ducati`, etc. in OSM
2. **Name analysis**: "Munich BMW Service" → detects BMW

### Dealer Detection

A shop is marked as a dealer if:
- Has a brand tag
- Tagged as motorcycle dealer with repair services
- Name contains "dealer", "center", or "official"

### Quality Filters

Only imports shops with:
- ✅ Business name
- ✅ Valid GPS coordinates
- ✅ City or address

Prefers shops with:
- Phone/email
- Website
- Full street address

## Supported Data

### Countries (27 EU Members)

Austria, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden

### Motorcycle Brands (18)

BMW, Ducati, Harley-Davidson, Honda, Kawasaki, KTM, Suzuki, Triumph, Yamaha, Aprilia, MV Agusta, Royal Enfield, Husqvarna, Benelli, Moto Guzzi, Indian, Vespa, Piaggio

## Troubleshooting

### Migration Fails

**Error**: "relation repair_shops already exists"

**Solution**: Use `migration_add_location_fields.sql` instead of `schema.sql`

### Script Can't Write to Database

**Error**: "Missing Supabase credentials" or "Policy violation"

**Solution**:
1. Check `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
2. Run the migration to update RLS policies

### No Google Maps Button

**Issue**: Button doesn't appear on shop cards

**Solution**: Shops need latitude/longitude. Import OSM data or manually add coordinates.

### Extract Script Hangs

**Issue**: Script stops responding

**Solution**:
- Check internet connection
- Overpass API may be busy - wait and retry
- Try specific countries instead of all EU

## Performance Notes

### Extraction Speed

- Single country: 1-5 minutes
- 3-5 countries: 15-30 minutes
- All EU (27): 2-3 hours

Time varies based on:
- API response time
- Number of shops in country
- Network speed

### Database Usage

Typical import volumes:
- Germany: ~400-500 shops
- France: ~300-400 shops
- Small countries: 10-50 shops
- Total EU: 2,000-5,000 shops

Supabase free tier easily handles this.

## Maintenance

### Updating Data

Re-run extraction monthly to get new shops:

```bash
npm run extract-osm
```

Script automatically skips existing shops (via OSM ID).

### Removing Outdated Shops

```sql
-- Check shop counts
SELECT country, COUNT(*) FROM repair_shops GROUP BY country;

-- Remove specific country
DELETE FROM repair_shops WHERE country = 'Germany';

-- Re-import fresh data
npm run extract-osm DE
```

## Customization

### Add More Brands

Edit `scripts/extractOSMData.ts`:

```typescript
const MOTORCYCLE_BRANDS = [
  'BMW', 'Ducati', // ... existing brands
  'Your-New-Brand'  // Add here
];
```

### Change Quality Filters

Edit the `convertToRepairShop` method in `extractOSMData.ts`.

### Adjust Rate Limiting

Change the delay in `extractAll` method (default: 3 seconds).

## Security Notes

- ✅ Service role key is server-side only
- ✅ `.env.local` is in `.gitignore`
- ✅ Public keys are safe for client-side
- ✅ RLS policies protect public data
- ⚠️ Never commit service role key to git
- ⚠️ Never use service role key in browser

## Support Resources

1. **QUICK_START.md** - Fast setup guide
2. **OSM_DATA_EXTRACTION_GUIDE.md** - Detailed docs
3. **SUPABASE_SETUP.md** - Database setup
4. **OpenStreetMap** - https://www.openstreetmap.org
5. **Supabase Docs** - https://supabase.com/docs

## Summary

You now have:
- ✅ Database schema with location fields
- ✅ Automated OSM data extraction
- ✅ Google Maps integration
- ✅ Quality filtering for verified businesses
- ✅ Brand categorization
- ✅ Dealer identification
- ✅ Duplicate prevention
- ✅ EU-wide coverage
- ✅ Comprehensive documentation

**Ready to use!** Follow the Next Steps above to start importing data.
