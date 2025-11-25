-- Migration: Add user profiles and bike registration tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create bikes table for user bike registration
CREATE TABLE IF NOT EXISTS bikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  photos TEXT[], -- Array of photo URLs from Supabase Storage
  documentation TEXT[], -- Array of document URLs from Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bikes_user_id ON bikes(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for bikes table
-- Users can view their own bikes
CREATE POLICY "Users can view own bikes" ON bikes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own bikes
CREATE POLICY "Users can insert own bikes" ON bikes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bikes
CREATE POLICY "Users can update own bikes" ON bikes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own bikes
CREATE POLICY "Users can delete own bikes" ON bikes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bikes_updated_at
  BEFORE UPDATE ON bikes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for bike photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('bike-photos', 'bike-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for bike documentation
INSERT INTO storage.buckets (id, name, public)
VALUES ('bike-docs', 'bike-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for bike-photos bucket (public read, authenticated upload)
CREATE POLICY "Public can view bike photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'bike-photos');

CREATE POLICY "Authenticated users can upload bike photos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bike-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own bike photos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'bike-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own bike photos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'bike-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for bike-docs bucket (private, owner only)
CREATE POLICY "Users can view own bike docs" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'bike-docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own bike docs" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bike-docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own bike docs" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'bike-docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own bike docs" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'bike-docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
