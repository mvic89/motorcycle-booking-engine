export interface RepairShop {
  id: string;
  name: string;
  country: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  brands: string[];
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  is_dealer: boolean;
  osm_id?: string;
  osm_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterOptions {
  searchQuery: string;
  country: string;
  city: string;
  brand: string;
}
