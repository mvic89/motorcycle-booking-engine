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
  isDealer: boolean;
}

export interface FilterOptions {
  searchQuery: string;
  country: string;
  city: string;
  brand: string;
}
