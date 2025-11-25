# Quick Reference - Authentication System

## 🚀 What Was Built

✅ Complete authentication system with Supabase
✅ User signup and login pages
✅ Protected bike registration page
✅ File uploads for photos and documents
✅ Conditional navigation header
✅ Row-level security (RLS) policies

---

## 📋 Quick Start (3 Steps)

### 1. Run Database Migration

```bash
# Open Supabase Dashboard → SQL Editor
# Copy contents of: supabase/migration_add_user_profiles.sql
# Paste and run
```

### 2. Disable Email Confirmation (For Testing)

```bash
# Supabase Dashboard → Authentication → Settings
# Toggle OFF "Enable email confirmations"
# Click Save
```

### 3. Test It!

```bash
npm run dev
# Visit http://localhost:3000
# Click "Login" → "Sign up here"
# Create account and test!
```

---

## 🗂️ Files Created

### Core Authentication
- `contexts/AuthContext.tsx` - Authentication state management
- `app/types/auth.ts` - TypeScript types
- `middleware.ts` - Route protection

### Pages
- `app/login/page.tsx` - Login form
- `app/signup/page.tsx` - Signup form
- `app/register/page.tsx` - Bike registration (protected)

### Components
- `components/Header.tsx` - Navigation with conditional buttons

### Database
- `supabase/migration_add_user_profiles.sql` - Complete database setup

### Documentation
- `AUTH_SETUP_GUIDE.md` - Detailed setup instructions
- `QUICK_REFERENCE.md` - This file

---

## 🎯 User Flow

```
1. User visits site → Sees "Login" button

2. Clicks "Login" → Goes to /login
   ↓
   No account? Click "Sign up here"
   ↓
3. Goes to /signup → Fills form → Creates account
   ↓
4. Redirected to /login → Logs in
   ↓
5. Sees "Register Bike" and "Log Out" buttons
   ↓
6. Clicks "Register Bike" → Goes to /register
   ↓
7. Fills bike form → Uploads files → Submits
   ↓
8. Bike saved to database → Redirected home
```

---

## 🔐 Protected Routes

| Route | Access |
|-------|--------|
| `/` | Public |
| `/login` | Public (redirects if logged in) |
| `/signup` | Public (redirects if logged in) |
| `/register` | **Protected** (login required) |

---

## 📊 Database Tables

### `profiles`
- Auto-created on signup
- Stores: id, email, full_name

### `bikes`
- Created when registering bike
- Stores: brand, year, mileage, photos[], documentation[]

---

## 📁 Storage Buckets

### `bike-photos` (Public)
- Anyone can view with URL
- Users can only upload their own

### `bike-docs` (Private)
- Only owner can view
- Users can only upload their own

---

## 🎨 Header States

### Not Logged In
```
[Logo]                    [Login]
```

### Logged In
```
[Logo]      [Register Bike] [Log Out]
```

---

## 🔧 Common Tasks

### Test Authentication
```bash
npm run dev
# Go to /signup → Create account
# Go to /login → Sign in
# Go to /register → Register bike
```

### Check Database
```bash
# Supabase Dashboard → Table Editor
# Check "profiles" and "bikes" tables
```

### Check Uploaded Files
```bash
# Supabase Dashboard → Storage
# Check "bike-photos" and "bike-docs" buckets
```

### Deploy to Vercel
```bash
# Push to GitHub
# Connect to Vercel
# Add environment variables (same as .env.local)
# Deploy!
```

---

## ⚡ Key Features

1. **Automatic Profile Creation**
   - Profile created when user signs up
   - No extra steps needed

2. **Secure File Upload**
   - Photos: Public access
   - Documents: Private (owner only)
   - Organized by user ID

3. **Route Protection**
   - `/register` requires login
   - Middleware handles all protection
   - Redirects with return URL

4. **Conditional UI**
   - Header changes based on auth state
   - No manual state management needed

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't access /register | You need to log in first |
| File upload fails | Check storage buckets exist in Supabase |
| Build errors | Run `npm install` and `npm run build` |
| Auth not working | Check .env.local has Supabase credentials |

---

## 📝 Environment Variables

Make sure `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_SECRET_KEY=your_api_secret_key
```

---

## 🎓 Learn More

- Full setup: `AUTH_SETUP_GUIDE.md`
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs

---

## ✨ What's Next?

- [ ] Add user dashboard to view registered bikes
- [ ] Add edit/delete bike functionality
- [ ] Add user profile settings page
- [ ] Add email templates for better UX
- [ ] Deploy to production

---

**Need help?** Check `AUTH_SETUP_GUIDE.md` for detailed instructions!
