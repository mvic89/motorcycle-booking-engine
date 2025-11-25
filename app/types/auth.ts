import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Bike {
  id: string;
  user_id: string;
  brand: string;
  year: number;
  mileage: number;
  photos: string[];
  documentation: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}
