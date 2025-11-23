export interface RepairShop {
  id: string;
  name: string;
  country: string;
  city: string;
  address: string;
  brands: string[];
  phone: string;
  email: string;
  rating?: number;
  is_dealer: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FilterOptions {
  searchQuery: string;
  country: string;
  city: string;
  brand: string;
}
