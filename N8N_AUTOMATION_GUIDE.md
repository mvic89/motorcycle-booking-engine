# n8n Automation Guide: Automated OSM Data Updates

This guide will walk you through setting up an n8n AI agent to automatically update your motorcycle repair shop data from OpenStreetMap every month.

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Deploy Your Next.js App](#step-1-deploy-your-nextjs-app)
4. [Step 2: Generate API Secret Key](#step-2-generate-api-secret-key)
5. [Step 3: Set Up n8n Account](#step-3-set-up-n8n-account)
6. [Step 4: Create n8n Workflow](#step-4-create-n8n-workflow)
7. [Step 5: Test the Workflow](#step-5-test-the-workflow)
8. [Step 6: Monitor and Maintain](#step-6-monitor-and-maintain)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What We're Building

```
┌──────────────────┐
│   n8n Cloud      │  Triggers monthly on the 1st at 2 AM
│   (Schedule)     │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│   Your Next.js   │  Receives POST request with API key
│   App (Vercel)   │  Runs OSM extraction script
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│   Supabase DB    │  New repair shops added
│   (PostgreSQL)   │  Duplicates skipped automatically
└──────────────────┘
```

### Why This Approach?

- **No Local Server Needed**: Everything runs in the cloud
- **Automated**: Set it and forget it
- **Cost-Effective**: n8n free tier + Vercel free tier
- **Secure**: API key authentication
- **Scalable**: Can process all EU countries

---

## Prerequisites

### What You Need
- ✅ Your Next.js project (already set up)
- ✅ Vercel account (for deploying your app)
- ✅ n8n Cloud account (free tier is fine)
- ✅ Basic understanding of APIs

### Estimated Time
- **First-time setup**: 30-45 minutes
- **Testing**: 10 minutes
- **Total**: About 1 hour

---

## Step 1: Deploy Your Next.js App

You need to deploy your app to the cloud so n8n can access it via a URL.

### Option A: Deploy to Vercel (Recommended)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Connect Your Repository**
   - Click "Add New" → "Project"
   - Import your `motorcycle-booking-engine` repository
   - Vercel will auto-detect it's a Next.js app

3. **Configure Environment Variables**

   In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://fjnpotkadiztiiekrhxr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   API_SECRET_KEY=your_random_secret_key_here
   ```

   ⚠️ **Important**: Use the same values from your local `.env.local` file

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a URL like: `https://motorcycle-booking-engine.vercel.app`

5. **Test Your API Endpoint**

   Open your browser and go to:
   ```
   https://your-app.vercel.app/api/import-osm
   ```

   You should see:
   ```json
   {
     "status": "healthy",
     "endpoint": "/api/import-osm",
     "method": "POST",
     "description": "Trigger OSM data extraction"
   }
   ```

---

## Step 2: Generate API Secret Key

You need a secure random string to protect your API endpoint.

### Generate a Secret Key

**Option 1: Online Generator (Easiest)**
1. Go to [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
2. Copy the generated key
3. Save it somewhere safe (you'll need it twice)

**Option 2: Command Line**
```bash
# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# On Mac/Linux
openssl rand -base64 32
```

### Add to Your `.env.local`

Replace the placeholder in your `.env.local`:
```env
API_SECRET_KEY=abc123xyz789yourActualSecretKeyHere456def
```

### Add to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `API_SECRET_KEY` with the same value
3. Click "Save"
4. **Redeploy your app** (Deployments tab → click "..." → Redeploy)

---

## Step 3: Set Up n8n Account

### Create n8n Cloud Account

1. **Sign Up**
   - Go to [n8n.io/cloud](https://n8n.io/cloud)
   - Click "Start Free"
   - Sign up with email or GitHub

2. **Verify Email**
   - Check your inbox
   - Click verification link

3. **Create First Workflow**
   - Click "Create Workflow"
   - You'll see a blank canvas

---

## Step 4: Create n8n Workflow

Now we'll build the automation workflow step-by-step.

### Node 1: Schedule Trigger

1. **Add Schedule Node**
   - Click the `+` button on canvas
   - Search for "Schedule Trigger"
   - Click to add it

2. **Configure Schedule**
   - Click the Schedule node
   - **Trigger Interval**: Select "Cron"
   - **Cron Expression**: `0 2 1 * *`
     - This means: At 2:00 AM on the 1st day of every month

   **Alternative Schedules:**
   - Weekly (Mondays at 2 AM): `0 2 * * 1`
   - Quarterly (1st of Jan/Apr/Jul/Oct): `0 2 1 1,4,7,10 *`
   - Every 2 weeks: `0 2 1,15 * *`

3. **Save the node**

### Node 2: HTTP Request to Your API

1. **Add HTTP Request Node**
   - Click the `+` button after Schedule node
   - Search for "HTTP Request"
   - Click to add it

2. **Configure HTTP Request**

   **Basic Settings:**
   - **Method**: POST
   - **URL**: `https://your-app.vercel.app/api/import-osm`
     - Replace `your-app.vercel.app` with your actual Vercel URL

   **Authentication:**
   - Click "Add Auth" → "Header Auth"
   - **Name**: `Authorization`
   - **Value**: `Bearer YOUR_API_SECRET_KEY`
     - Replace `YOUR_API_SECRET_KEY` with the key you generated

   **Request Body (Optional):**
   - **Body Content Type**: JSON
   - **JSON**:
   ```json
   {
     "countries": ["DE", "FR", "IT", "ES", "NL", "BE"]
   }
   ```
   - Or leave empty to process all EU countries

3. **Save the node**

### Node 3: Send Email Notification (Optional but Recommended)

This will email you when the update completes.

1. **Add Email Node**
   - Click the `+` button after HTTP Request
   - Search for "Send Email"
   - Click "Gmail" (or your preferred email service)

2. **Connect Gmail**
   - Click "Create New Credential"
   - Follow OAuth flow to connect your Gmail
   - Grant permissions

3. **Configure Email**
   - **To**: your-email@example.com
   - **Subject**: `OSM Data Update Completed - {{ $now.format('YYYY-MM-DD') }}`
   - **Email Type**: Text
   - **Text**:
   ```
   OSM Data Update Results:

   Status: {{ $json.success ? 'Success ✅' : 'Failed ❌' }}

   Stats:
   - Total Imported: {{ $json.stats.totalImported }}
   - Countries Processed: {{ $json.stats.countriesProcessed }}

   Timestamp: {{ $now.format('YYYY-MM-DD HH:mm:ss') }}

   ---
   Automated by n8n
   ```

4. **Save the node**

### Node 4: Error Handling (Optional)

Add this to handle failures gracefully.

1. **Click on HTTP Request node**
2. **Settings tab** (gear icon)
3. **On Error**: Select "Continue"
4. **Add Error Output**: Enable

5. **Add "If" node**
   - Connect to HTTP Request node
   - **Condition**: `{{ $json.success }}` equals `true`
   - **True branch**: Connect to Email (Success)
   - **False branch**: Connect to Error Email

### Save Your Workflow

1. Click the **Save** button (top right)
2. Name it: "OSM Data Auto-Update - Monthly"
3. Click **Save**

---

## Step 5: Test the Workflow

Before leaving it to run automatically, test it manually.

### Manual Test

1. **Click "Execute Workflow"** (top right)
2. **Wait** - It will take a few minutes
3. **Check Results**:
   - ✅ Green checkmarks on all nodes = Success
   - ❌ Red X = Error (check error message)

### Check Your Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project
3. Go to **Table Editor** → `repair_shops`
4. Verify new shops were added
5. Check the `created_at` timestamp

### Test Email Notification

- Check your inbox
- You should receive the summary email

---

## Step 6: Monitor and Maintain

### Activate Your Workflow

1. In n8n, toggle the **Active** switch (top right)
2. Your workflow is now live and will run on schedule

### Where to Monitor

**n8n Execution Log:**
- Go to n8n dashboard
- Click "Executions" in left sidebar
- See all past runs with success/failure status

**Vercel Logs:**
- Go to Vercel Dashboard → Your Project
- Click "Logs" tab
- Filter by `/api/import-osm`

**Supabase Database:**
- Check `repair_shops` table
- Filter by recent `created_at` dates

### Estimated Costs

**Free Tier Limits:**
- **n8n Cloud Free**: 5,000 workflow executions/month
  - Monthly updates = 1 execution/month = ✅ Well within limit
- **Vercel Hobby**: 100 GB bandwidth/month
  - API calls = ~5MB per run = ✅ Well within limit
- **Supabase Free**: 500MB database
  - Each shop = ~1KB = 500,000 shops = ✅ You're fine

**Paid Plans (if needed in future):**
- n8n Cloud Starter: $20/month
- Vercel Pro: $20/month
- Supabase Pro: $25/month

---

## Troubleshooting

### Issue: "Unauthorized: Invalid API key"

**Solution:**
1. Check your `API_SECRET_KEY` in Vercel environment variables
2. Make sure n8n HTTP Request uses `Bearer YOUR_KEY` format
3. Redeploy Vercel app after changing env vars

### Issue: "Missing Supabase credentials"

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Get the key from Supabase Dashboard → Settings → API
4. Redeploy

### Issue: Workflow executes but no data imported

**Possible Causes:**
- OSM data already exists (duplicates are skipped automatically)
- Overpass API is down (check status: [overpass-api.de](https://overpass-api.de/api/status))
- Network timeout (increase timeout in HTTP Request settings)

**Solution:**
- Check n8n execution log for error details
- Check Vercel function logs
- Test manually: `npm run extract-osm SE` locally

### Issue: Workflow times out

**Solution:**
- Reduce countries processed per run
- Split into multiple workflows (e.g., one for each region)
- Increase Vercel function timeout (Pro plan required for >10s)

### Issue: Email not sending

**Solution:**
- Reconnect Gmail OAuth in n8n credentials
- Check spam folder
- Use alternative: Slack, Discord, or Webhook

---

## Advanced: Connecting Local Development to n8n

If you want to test n8n with your local development server:

### Use ngrok to Expose Local Server

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start Your Dev Server**
   ```bash
   npm run dev
   ```

3. **Start ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Use ngrok URL in n8n**
   - Copy the `https://abc123.ngrok.io` URL
   - Use it in n8n HTTP Request: `https://abc123.ngrok.io/api/import-osm`

5. **Test**
   - Run your n8n workflow
   - It will hit your local machine
   - See live logs in your terminal

⚠️ **Note**: ngrok URLs change every time you restart. This is only for testing.

---

## Alternative: Using n8n Self-Hosted

If you prefer to run n8n on your own server:

### Docker Setup (Advanced)

```bash
# Pull n8n image
docker pull n8nio/n8n

# Run n8n
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Access at: `http://localhost:5678`

---

## Summary

### What You've Built

✅ Automated monthly OSM data updates
✅ Secure API endpoint with authentication
✅ Cloud-based workflow (no local server needed)
✅ Email notifications on completion
✅ Error handling and monitoring

### Maintenance Schedule

- **Monthly**: Check email reports
- **Quarterly**: Review data quality in Supabase
- **Yearly**: Update dependencies and review workflow

### Next Steps

1. Deploy to Vercel ✈️
2. Set up n8n workflow 🤖
3. Test it manually ✅
4. Activate and monitor 📊
5. Relax - it's automated! 😎

---

## Questions?

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review n8n execution logs
3. Check Vercel function logs
4. Test the API endpoint manually with curl:

```bash
curl -X POST https://your-app.vercel.app/api/import-osm \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"countries": ["SE"]}'
```

Good luck! 🚀
