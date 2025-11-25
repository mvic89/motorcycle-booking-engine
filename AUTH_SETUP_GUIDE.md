# Authentication & User Profile Setup Guide

This guide will walk you through setting up the authentication system, user profiles, and bike registration functionality.

---

## Overview

You now have a complete authentication system with:
- ✅ User signup and login
- ✅ Protected routes (login required for `/register`)
- ✅ User profile management
- ✅ Bike registration with photo and document uploads
- ✅ Conditional navigation (Login/Logout buttons)

---

## Step 1: Run Database Migration

1. **Open Supabase Dashboard** → Your Project → **SQL Editor**

2. **Open the migration file**: `supabase/migration_add_user_profiles.sql`

3. **Copy and paste** the entire contents into SQL Editor

4. **Click "Run"**

5. **Verify tables created**:
   - Go to **Table Editor**
   - You should see: `profiles`, `bikes`
   - Go to **Storage** → You should see: `bike-photos`, `bike-docs` buckets

---

## Step 2: Enable Email Confirmations (Optional)

By default, Supabase requires email confirmation for new users.

### Option A: Disable Email Confirmation (For Testing)

1. Go to **Authentication** → **Settings**
2. Scroll to **Email Confirmations**
3. Toggle **OFF** "Enable email confirmations"
4. Click **Save**

Now users can sign up and log in immediately without email verification.

### Option B: Keep Email Confirmation (Production)

1. Configure your email templates in **Authentication** → **Email Templates**
2. Customize the confirmation email
3. Users will receive an email to confirm their account

---

## Step 3: Test the Authentication Flow

### Test Signup

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Open** http://localhost:3000

3. **Click "Login"** in the header → Then **"Sign up here"**

4. **Fill out the signup form**:
   - Full Name: Test User
   - Email: test@example.com
   - Password: test123
   - Confirm Password: test123

5. **Click "Create Account"**

6. **If email confirmation is disabled**: You'll be redirected to login

7. **If email confirmation is enabled**: Check your email and click the confirmation link

### Test Login

1. **Go to** http://localhost:3000/login

2. **Enter credentials**:
   - Email: test@example.com
   - Password: test123

3. **Click "Sign In"**

4. **You should be redirected to home** and see:
   - "Register Bike" button in header
   - "Log Out" button in header

### Test Protected Route

1. **While logged out**, try to visit http://localhost:3000/register

2. **You should be redirected** to `/login`

3. **Log in**, then visit http://localhost:3000/register

4. **You should see** the bike registration form ✅

### Test Bike Registration

1. **Go to** http://localhost:3000/register (while logged in)

2. **Fill out the form**:
   - Brand: Select any (e.g., "BMW")
   - Year: 2020
   - Mileage: 15000

3. **Optional**: Upload photos and/or documents

4. **Click "Register Bike"**

5. **You should see**: Success message → Redirected to home

6. **Verify in Supabase**:
   - Go to **Table Editor** → `bikes`
   - You should see your bike entry!

### Test Logout

1. **Click "Log Out"** in the header

2. **You should**:
   - Be logged out
   - See "Login" button instead of "Log Out"
   - "Register Bike" button should disappear

---

## Step 4: Verify Storage Buckets

1. **Go to Supabase Dashboard** → **Storage**

2. **You should see two buckets**:
   - `bike-photos` (public)
   - `bike-docs` (private)

3. **If you uploaded files**, check:
   - Click `bike-photos` → You should see uploaded images
   - Click `bike-docs` → You should see uploaded documents

---

## Features Explained

### Header Component

Location: `components/Header.tsx`

**Features:**
- Logo that links to home (/)
- Conditional rendering:
  - Not logged in: Shows "Login" button
  - Logged in: Shows "Register Bike" and "Log Out" buttons

### Login Page

Location: `app/login/page.tsx`

**Features:**
- Email/password login
- Link to signup page
- Error handling
- Auto-redirect after login

### Signup Page

Location: `app/signup/page.tsx`

**Features:**
- Full name, email, password fields
- Password confirmation validation
- Link to login page
- Auto-creates user profile
- Email confirmation (if enabled)

### Register Page (Protected)

Location: `app/register/page.tsx`

**Features:**
- Protected route (login required)
- Bike brand, year, mileage fields
- Photo upload (max 5 images)
- Documentation upload (max 10 files)
- Progress indicators
- Uploads to Supabase Storage
- Saves to `bikes` table

### Middleware

Location: `middleware.ts`

**Features:**
- Protects `/register` route
- Redirects to login if not authenticated
- Redirects to home if logged in user tries to access login/signup

---

## Database Schema

### `profiles` Table

Automatically created when user signs up.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | User ID (from auth.users) |
| email | TEXT | User email |
| full_name | TEXT | User's full name |
| created_at | TIMESTAMP | When profile was created |
| updated_at | TIMESTAMP | Last update time |

### `bikes` Table

Created when user registers a bike.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Bike ID |
| user_id | UUID | Owner's user ID |
| brand | TEXT | Motorcycle brand |
| year | INTEGER | Year of manufacture |
| mileage | INTEGER | Current mileage (km) |
| photos | TEXT[] | Array of photo URLs |
| documentation | TEXT[] | Array of document URLs |
| created_at | TIMESTAMP | When registered |
| updated_at | TIMESTAMP | Last update |

---

## Storage Buckets

### `bike-photos` (Public)

- **Purpose**: Store bike photos
- **Access**: Public (anyone can view)
- **Folder structure**: `{user_id}/{timestamp}-{random}.{ext}`
- **File types**: Images (jpg, png, etc.)

### `bike-docs` (Private)

- **Purpose**: Store service/repair documentation
- **Access**: Owner only
- **Folder structure**: `{user_id}/{timestamp}-{random}.{ext}`
- **File types**: PDF, DOC, DOCX, JPG, PNG

---

## Customization

### Change Logo

Edit `components/Header.tsx`:

```tsx
<span className="text-2xl font-bold text-gray-900">
  🏍️ YourSiteName
</span>
```

### Add More Motorcycle Brands

Edit `app/register/page.tsx`:

```tsx
<option value="YourBrand">YourBrand</option>
```

### Change File Upload Limits

Edit `app/register/page.tsx`:

```tsx
// Photos limit
if (fileArray.length > 10) { // Change from 5 to 10
  setError('Maximum 10 photos allowed');
  return;
}
```

### Styling

All pages use Tailwind CSS. Modify classes in:
- `components/Header.tsx`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/register/page.tsx`

---

## Troubleshooting

### Issue: "Cannot find module '../contexts/AuthContext'"

**Solution:**
Run `npm run dev` to rebuild. The context should be available.

### Issue: "Missing Supabase credentials"

**Solution:**
1. Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Restart dev server

### Issue: "User is not authenticated" when accessing /register

**Solution:**
This is correct! You need to log in first. Go to `/login`.

### Issue: File upload fails

**Solution:**
1. Check storage buckets exist in Supabase
2. Verify RLS policies are set correctly
3. Check file size (default limit is 50MB)

### Issue: "Profile already exists" error on signup

**Solution:**
The user already signed up. Try logging in instead.

### Issue: Photos/docs don't appear after upload

**Solution:**
1. Check Supabase Storage → `bike-photos` or `bike-docs`
2. Check `bikes` table → your entry should have URLs in photos/documentation arrays

---

## Security Notes

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only view/edit their own profiles
- Users can only view/edit their own bikes
- Users can only access their own files in storage

### Authentication

- Passwords are hashed by Supabase Auth
- Sessions are managed securely
- Protected routes checked on server-side (middleware)

### File Uploads

- Photos are public (anyone with URL can view)
- Documentation is private (only owner can access)
- Files stored in user-specific folders

---

## Next Steps

1. **Deploy to Vercel** (if not already deployed)

2. **Set up custom domain** (optional)

3. **Add email templates** in Supabase for better UX

4. **Create user dashboard** to view registered bikes

5. **Add edit/delete bike functionality**

6. **Add profile settings page**

---

## API Endpoints Created

Your authentication system uses:

### Supabase Auth Endpoints

- `POST /auth/signup` - Create new user
- `POST /auth/signin` - Sign in user
- `POST /auth/signout` - Sign out user
- `GET /auth/session` - Get current session

### Database Tables

- `profiles` - User profiles
- `bikes` - User bike registrations

### Storage Buckets

- `bike-photos` - Public photo storage
- `bike-docs` - Private document storage

---

## Summary

You now have a complete authentication system with:

✅ User registration and login
✅ Protected routes
✅ User profiles (auto-created)
✅ Bike registration with file uploads
✅ Conditional navigation
✅ Secure file storage
✅ Row-level security

**Everything is connected to Supabase!**

Need help? Check the troubleshooting section above or review the code comments in each file.
