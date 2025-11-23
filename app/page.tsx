'use client';

import { useState, useMemo } from 'react';
import { FilterOptions } from './types';
import { sampleRepairShops } from './data/sampleShops';

export default function Home() {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    country: '',
    city: '',
    brand: '',
  });

  // Extract unique values for filter dropdowns
  const countries = useMemo(() =>
    Array.from(new Set(sampleRepairShops.map(shop => shop.country))).sort(),
    []
  );

  const cities = useMemo(() =>
    Array.from(new Set(sampleRepairShops.map(shop => shop.city))).sort(),
    []
  );

  const brands = useMemo(() =>
    Array.from(new Set(sampleRepairShops.flatMap(shop => shop.brands))).sort(),
    []
  );

  // Filter repair shops based on current filters
  const filteredShops = useMemo(() => {
    return sampleRepairShops.filter(shop => {
      const matchesSearch = filters.searchQuery === '' ||
        shop.name.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesCountry = filters.country === '' || shop.country === filters.country;
      const matchesCity = filters.city === '' || shop.city === filters.city;
      const matchesBrand = filters.brand === '' || shop.brands.includes(filters.brand);

      return matchesSearch && matchesCountry && matchesCity && matchesBrand;
    });
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      country: '',
      city: '',
      brand: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            EU Motorcycle Repair Shops Directory
          </h1>
          <p className="mt-2 text-gray-600">
            Find certified motorcycle repair shops across Europe
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search by name
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search repair shops..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Country Filter */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  id="country"
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  id="city"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <select
                  id="brand"
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredShops.length}</span> repair shop{filteredShops.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Repair Shops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map(shop => (
            <div
              key={shop.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Shop Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
                  {shop.isDealer && (
                    <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                      Dealer
                    </span>
                  )}
                </div>
                {shop.rating && (
                  <div className="flex items-center mt-2">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span className="text-sm font-medium text-gray-700">{shop.rating}</span>
                  </div>
                )}
              </div>

              {/* Shop Details */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <span className="font-medium w-20">Location:</span>
                  <span>{shop.city}, {shop.country}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-20">Address:</span>
                  <span>{shop.address}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-20">Phone:</span>
                  <span>{shop.phone}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-20">Email:</span>
                  <span className="break-all">{shop.email}</span>
                </div>
              </div>

              {/* Brands */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-700 mb-2">Supported Brands:</p>
                <div className="flex flex-wrap gap-1">
                  {shop.brands.map(brand => (
                    <span
                      key={brand}
                      className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredShops.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No repair shops found matching your criteria.</p>
            <button
              onClick={resetFilters}
              className="mt-4 px-6 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
