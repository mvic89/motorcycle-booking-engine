# n8n Multiple Workflows Setup Guide

This guide shows you how to set up 4 separate n8n workflows to process all EU countries in batches, staying within Vercel's free tier limits.

---

## Overview

Instead of one workflow processing all 27 countries (which times out), we'll create **4 workflows** that each process a region:

```
Week 1 (1st Monday): Nordic & Baltic Countries
Week 2 (2nd Monday): Central Europe
Week 3 (3rd Monday): Western Europe
Week 4 (4th Monday): Eastern & Southern Europe
```

Each workflow processes 5-7 countries and finishes in under 10 seconds ✅

---

## Workflow 1: Nordic & Baltic Countries

### Countries Covered:
- Sweden (SE)
- Denmark (DK)
- Finland (FI)
- Norway (NO) - if applicable
- Estonia (EE)
- Latvia (LV)
- Lithuania (LT)

### Step-by-Step Setup:

1. **Create New Workflow**
   - In n8n, click "+ New Workflow"
   - Name it: `OSM Update - Nordic & Baltic`

2. **Add Schedule Trigger**
   - Add "Schedule Trigger" node
   - **Trigger Interval**: Cron
   - **Cron Expression**: `0 2 1 * 1`
     - Meaning: 2 AM on the 1st Monday of every month

3. **Add HTTP Request**
   - Add "HTTP Request" node
   - **Method**: POST
   - **URL**: `https://motorcycle-booking-engine-qn4i.vercel.app/api/import-osm`
   - **Authentication**: Header Auth
     - Name: `Authorization`
     - Value: `Bearer 49d35eec2e558aaf218af0f73ae19b64`
   - **Body Content Type**: JSON
   - **JSON**:
   ```json
   {
     "countries": ["SE", "DK", "FI", "EE", "LV", "LT"]
   }
   ```

4. **Add Email Notification (Optional)**
   - Add "Gmail" or "Send Email" node
   - **To**: your-email@example.com
   - **Subject**: `Nordic & Baltic OSM Update - {{ $now.format('YYYY-MM-DD') }}`
   - **Text**:
   ```
   Region: Nordic & Baltic Countries
   Status: {{ $json.success ? 'Success ✅' : 'Failed ❌' }}

   Countries: SE, DK, FI, EE, LV, LT
   Total Imported: {{ $json.stats.totalImported }}

   Timestamp: {{ $now.format('YYYY-MM-DD HH:mm:ss') }}
   ```

5. **Save & Test**
   - Click "Save" (name: `OSM Update - Nordic & Baltic`)
   - Click "Execute Workflow" to test
   - Should complete in 5-8 seconds ✅

---

## Workflow 2: Central Europe

### Countries Covered:
- Germany (DE)
- Austria (AT)
- Netherlands (NL)
- Belgium (BE)
- Luxembourg (LU)
- Czech Republic (CZ)
- Poland (PL)

### Setup:

1. **Duplicate Previous Workflow**
   - In n8n, open "OSM Update - Nordic & Baltic"
   - Click "..." menu → "Duplicate"
   - Rename to: `OSM Update - Central Europe`

2. **Update Schedule Trigger**
   - Click Schedule node
   - **Cron Expression**: `0 2 8 * 1`
     - Meaning: 2 AM on the 2nd Monday (8th) of every month

3. **Update HTTP Request Body**
   - Click HTTP Request node
   - **JSON**:
   ```json
   {
     "countries": ["DE", "AT", "NL", "BE", "LU", "CZ", "PL"]
   }
   ```

4. **Update Email Subject** (if using email)
   - **Subject**: `Central Europe OSM Update - {{ $now.format('YYYY-MM-DD') }}`
   - **Text**: Update "Region: Central Europe" and countries list

5. **Save & Test**
   - Click "Save"
   - Click "Execute Workflow"

---

## Workflow 3: Western Europe

### Countries Covered:
- France (FR)
- Spain (ES)
- Portugal (PT)
- Italy (IT)
- Ireland (IE)
- Switzerland (CH) - if applicable

### Setup:

1. **Duplicate Workflow**
   - Duplicate "OSM Update - Central Europe"
   - Rename to: `OSM Update - Western Europe`

2. **Update Schedule Trigger**
   - **Cron Expression**: `0 2 15 * 1`
     - Meaning: 2 AM on the 3rd Monday (15th) of every month

3. **Update HTTP Request Body**
   - **JSON**:
   ```json
   {
     "countries": ["FR", "ES", "PT", "IT", "IE"]
   }
   ```

4. **Update Email** (if using)
   - **Subject**: `Western Europe OSM Update - {{ $now.format('YYYY-MM-DD') }}`
   - Update region and countries list

5. **Save & Test**

---

## Workflow 4: Eastern & Southern Europe

### Countries Covered:
- Greece (GR)
- Romania (RO)
- Bulgaria (BG)
- Hungary (HU)
- Croatia (HR)
- Slovenia (SI)
- Slovakia (SK)
- Cyprus (CY)
- Malta (MT)

### Setup:

1. **Duplicate Workflow**
   - Duplicate "OSM Update - Western Europe"
   - Rename to: `OSM Update - Eastern & Southern Europe`

2. **Update Schedule Trigger**
   - **Cron Expression**: `0 2 22 * 1`
     - Meaning: 2 AM on the 4th Monday (22nd) of every month

3. **Update HTTP Request Body**
   - **JSON**:
   ```json
   {
     "countries": ["GR", "RO", "BG", "HU", "HR", "SI", "SK", "CY", "MT"]
   }
   ```

4. **Update Email** (if using)
   - **Subject**: `Eastern & Southern Europe OSM Update - {{ $now.format('YYYY-MM-DD') }}`
   - Update region and countries list

5. **Save & Test**

---

## Schedule Summary

| Workflow | Runs On | Countries | Cron |
|----------|---------|-----------|------|
| Nordic & Baltic | 1st Monday, 2 AM | SE, DK, FI, EE, LV, LT | `0 2 1 * 1` |
| Central Europe | 2nd Monday, 2 AM | DE, AT, NL, BE, LU, CZ, PL | `0 2 8 * 1` |
| Western Europe | 3rd Monday, 2 AM | FR, ES, PT, IT, IE | `0 2 15 * 1` |
| Eastern & Southern | 4th Monday, 2 AM | GR, RO, BG, HU, HR, SI, SK, CY, MT | `0 2 22 * 1` |

---

## Alternative: Simpler Weekly Schedule

If monthly is too slow, run each region **weekly**:

| Workflow | Runs On | Cron |
|----------|---------|------|
| Nordic & Baltic | Every Monday 2 AM | `0 2 * * 1` |
| Central Europe | Every Tuesday 2 AM | `0 2 * * 2` |
| Western Europe | Every Wednesday 2 AM | `0 2 * * 3` |
| Eastern & Southern | Every Thursday 2 AM | `0 2 * * 4` |

**To use weekly:**
- Change cron to `0 2 * * 1` (Monday), `0 2 * * 2` (Tuesday), etc.
- Each region updates every week instead of monthly

---

## Activating All Workflows

Once you've created and tested all 4 workflows:

1. **Open each workflow** in n8n
2. **Toggle the "Active" switch** (top right) to ON
3. **Verify** - You should see "Active" badge on each

All workflows are now automated! 🎉

---

## Monitoring

### Check Execution History

1. Go to n8n Dashboard
2. Click "Executions" in sidebar
3. Filter by workflow name
4. See success/failure status

### Email Reports

If you set up email notifications, you'll receive:
- 4 emails per month (one per region)
- Summary of imported shops
- Any errors

---

## Testing Before Going Live

**Test each workflow manually:**

1. Open workflow in n8n
2. Click "Execute Workflow"
3. Wait 5-10 seconds
4. Check for ✅ green checkmarks
5. Verify email received (if configured)
6. Check Supabase database for new entries

**Only activate after all 4 tests pass!**

---

## Cost Breakdown

✅ **100% FREE**

- n8n Cloud Free: 5,000 executions/month
  - Your usage: 4 workflows × 1/month = 4 executions/month
  - **Well within limit**

- Vercel Hobby Free: 100GB bandwidth, 10s function limit
  - Each request: ~5MB, completes in 5-8 seconds
  - **Well within limits**

- Supabase Free: 500MB database
  - Each shop: ~1KB
  - **Can store 500,000 shops**

**Total Cost: $0/month** 💰

---

## Troubleshooting

### Workflow times out
- Reduce countries in that batch
- Split into 2 workflows

### "Unauthorized" error
- Check API key in HTTP Request
- Verify "Bearer " prefix

### No data imported
- Check Vercel environment variables
- Check Supabase service role key
- Run `npm run extract-osm SE` locally to test

### Email not received
- Check spam folder
- Reconnect Gmail OAuth
- Try different email provider

---

## Advanced: Dynamic Country Selection

If you want to get fancy, you can make n8n automatically detect which countries need updating based on `updated_at` timestamps in your database. But for now, this simple approach works great!

---

## Summary

You now have:
- ✅ 4 automated workflows
- ✅ All 27 EU countries covered
- ✅ Each workflow finishes in <10 seconds
- ✅ Completely free
- ✅ Monthly updates for all regions
- ✅ Email notifications (optional)

**Next Steps:**
1. Create all 4 workflows following this guide
2. Test each one manually
3. Activate them all
4. Relax - your data updates automatically! 😎
