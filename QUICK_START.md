# Quick Start Guide - OSM Data Import

Follow these steps to populate your database with real motorcycle repair shop data from OpenStreetMap.

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

This installs all required packages including `dotenv` (for loading environment variables) and `tsx` (for running TypeScript scripts).

## Step 2: Update Database Schema (2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** → **New query**
3. Open the file: `supabase/migration_add_location_fields.sql`
4. Copy & paste the contents into SQL Editor
5. Click **Run**

✅ Your database now has location fields for Google Maps integration!

## Step 3: Get Service Role Key (1 minute)

1. In Supabase Dashboard, go to **Settings** → **API**
2. Find the **service_role** key (in the "Project API keys" section)
3. Click the eye icon to reveal it
4. Copy the key

⚠️ **Important**: This is NOT the same as the anon key!

## Step 4: Add Service Role Key (1 minute)

Open `.env.local` and add your service role key:

```env
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

Save the file.

## Step 5: Run Your First Import (5-10 minutes)

Start with a few countries to test:

```bash
npm run extract-osm DE FR IT
```

This will import motorcycle repair shops from Germany, France, and Italy.

Watch the console for progress:
```
🌍 Extracting data for Germany...
📥 Found 450 potential shops
  ✅ Imported: Munich Motorcycle Masters
  ✅ Imported: Berlin Speed Shop
  ...
✨ Imported 387 new shops from Germany
```

## Step 6: Verify Import (2 minutes)

1. Go to Supabase Dashboard → **Table Editor**
2. Select `repair_shops` table
3. You should see your imported shops with location data!

## Step 7: Test Google Maps Integration (1 minute)

```bash
npm run dev
```

Open http://localhost:3000 and:
1. You should see the imported repair shops
2. Each shop card should have a blue "View on Google Maps" button
3. Click it to verify it opens the correct location in Google Maps

## Step 8: Import All EU Countries (Optional)

Once you've verified everything works, import all EU countries:

```bash
npm run extract-osm
```

⏰ **Time**: 2-3 hours (processes 27 countries with API rate limiting)

---

## Common Issues

### "Missing Supabase credentials"
→ Make sure you added the service role key to `.env.local`

### "Policy violation" error
→ Run the migration SQL script (Step 2)

### No "View on Google Maps" button showing
→ The shops need latitude/longitude data (from OSM import)

### Want to re-import a country?
```sql
-- In Supabase SQL Editor, delete existing data first:
DELETE FROM repair_shops WHERE country = 'Germany';
```
Then run: `npm run extract-osm DE`

---

## What's Next?

See [OSM_DATA_EXTRACTION_GUIDE.md](OSM_DATA_EXTRACTION_GUIDE.md) for:
- Detailed explanations
- Troubleshooting
- Advanced customization
- Data quality tips

## Country Codes Reference

| Code | Country   | Code | Country     | Code | Country    |
|------|-----------|------|-------------|------|------------|
| AT   | Austria   | HU   | Hungary     | PT   | Portugal   |
| BE   | Belgium   | IE   | Ireland     | RO   | Romania    |
| BG   | Bulgaria  | IT   | Italy       | SK   | Slovakia   |
| HR   | Croatia   | LV   | Latvia      | SI   | Slovenia   |
| CY   | Cyprus    | LT   | Lithuania   | ES   | Spain      |
| CZ   | Czech Rep.| LU   | Luxembourg  | SE   | Sweden     |
| DK   | Denmark   | MT   | Malta       |      |            |
| EE   | Estonia   | NL   | Netherlands |      |            |
| FI   | Finland   | PL   | Poland      |      |            |
| FR   | France    |      |             |      |            |
| DE   | Germany   |      |             |      |            |
| GR   | Greece    |      |             |      |            |

**Examples:**
- Germany only: `npm run extract-osm DE`
- Benelux: `npm run extract-osm BE NL LU`
- Nordic: `npm run extract-osm SE FI DK`
- All EU: `npm run extract-osm`
