# Setup Checklist

Use this checklist to ensure everything is configured correctly.

## ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Project cloned/downloaded

## ✅ Database Setup

- [ ] Supabase project created (name: motorcycle-booking-engine)
- [ ] Opened Supabase SQL Editor
- [ ] Ran migration: `supabase/migration_add_location_fields.sql`
- [ ] Verified table exists in Table Editor
- [ ] RLS policies are active

**Verify with:**
```sql
SELECT * FROM repair_shops LIMIT 1;
```

## ✅ Environment Variables

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (for OSM import)

**Verify with:**
```bash
cat .env.local
```

All three variables should have values (not "your_...here").

## ✅ Dependencies

- [ ] Ran `npm install`
- [ ] No error messages
- [ ] `tsx` package installed (check package.json)

**Verify with:**
```bash
npm list tsx
```

Should show tsx@4.x.x

## ✅ Front-End Test

- [ ] Ran `npm run dev`
- [ ] Opened http://localhost:3000
- [ ] Page loads without errors
- [ ] Can see filters (Country, City, Brand)
- [ ] If data exists: shops display correctly

## ✅ OSM Data Import (Optional but Recommended)

### Test Import
- [ ] Ran `npm run extract-osm DE` (Germany test)
- [ ] Script ran without errors
- [ ] Saw progress messages: "Importing...", "✅ Imported: ..."
- [ ] Checked Supabase Table Editor - new shops appear

### Verify Import
- [ ] Shops have names
- [ ] Shops have latitude/longitude
- [ ] Shops have country/city
- [ ] No error in osm_id column

**Verify with:**
```sql
SELECT name, city, country, latitude, longitude
FROM repair_shops
WHERE country = 'Germany'
LIMIT 5;
```

### Full Import
- [ ] Ran `npm run extract-osm` (all EU countries)
- [ ] Script completed (takes 2-3 hours)
- [ ] Multiple countries now in database

**Verify with:**
```sql
SELECT country, COUNT(*) as count
FROM repair_shops
GROUP BY country
ORDER BY count DESC;
```

## ✅ Google Maps Integration

- [ ] Refreshed frontend (npm run dev)
- [ ] Shops now show "View on Google Maps" button
- [ ] Clicked button - opens Google Maps
- [ ] Correct location shown on map

## ✅ Filtering Test

- [ ] Selected a country - shops filter correctly
- [ ] Selected a city - shops filter correctly
- [ ] Selected a brand - shops filter correctly
- [ ] Search by name - works
- [ ] Reset filters button - works

## ✅ Data Quality Check

- [ ] Random sample of 5-10 shops look correct
- [ ] Shop names are real business names (not generic)
- [ ] Addresses look valid
- [ ] Phone/email present (when available)
- [ ] Brands match shop name/type

## 🎯 Complete Setup

If all checkboxes above are checked, your setup is complete!

## 🔧 Troubleshooting

### Issue: Migration fails with "already exists"

**Solution**: You already have the table. The migration is optional if you're starting fresh.

### Issue: "Missing Supabase credentials"

**Solution**:
1. Check `.env.local` exists
2. Check all three variables are set
3. Restart dev server: `npm run dev`

### Issue: No shops showing

**Solution**:
1. Check if data was imported: SQL Editor → `SELECT COUNT(*) FROM repair_shops;`
2. If zero, run: `npm run extract-osm DE`
3. Refresh browser

### Issue: Google Maps button missing

**Solution**: Shops need latitude/longitude. Import OSM data or manually add coordinates.

### Issue: Script errors with "429 Too Many Requests"

**Solution**: Overpass API rate limit hit. Wait 5 minutes and retry.

## 📚 Documentation

For detailed help, see:

- **Quick start**: [QUICK_START.md](QUICK_START.md)
- **Full OSM guide**: [OSM_DATA_EXTRACTION_GUIDE.md](OSM_DATA_EXTRACTION_GUIDE.md)
- **Database setup**: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Summary of changes**: [SETUP_SUMMARY.md](SETUP_SUMMARY.md)

## 🎉 Next Steps

After completing this checklist:

1. **Test all features** thoroughly
2. **Import more countries** if needed
3. **Customize styling** to match your brand
4. **Deploy to production** (Vercel recommended)
5. **Share with users** and gather feedback

---

**Need help?** All documentation files are in the project root directory.
