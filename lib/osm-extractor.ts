/**
 * OSM Data Extractor Module
 *
 * This module contains the extraction logic that can be used both by
 * the CLI script and the API endpoint.
 */

import { createClient } from '@supabase/supabase-js';

// EU Countries (ISO 3166-1 alpha-2 codes)
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

const COUNTRY_NAMES: { [key: string]: string } = {
  'AT': 'Austria', 'BE': 'Belgium', 'BG': 'Bulgaria', 'HR': 'Croatia',
  'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DK': 'Denmark', 'EE': 'Estonia',
  'FI': 'Finland', 'FR': 'France', 'DE': 'Germany', 'GR': 'Greece',
  'HU': 'Hungary', 'IE': 'Ireland', 'IT': 'Italy', 'LV': 'Latvia',
  'LT': 'Lithuania', 'LU': 'Luxembourg', 'MT': 'Malta', 'NL': 'Netherlands',
  'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania', 'SK': 'Slovakia',
  'SI': 'Slovenia', 'ES': 'Spain', 'SE': 'Sweden'
};

const MOTORCYCLE_BRANDS = [
  'BMW', 'Ducati', 'Harley-Davidson', 'Honda', 'Kawasaki', 'KTM',
  'Suzuki', 'Triumph', 'Yamaha', 'Aprilia', 'MV Agusta', 'Royal Enfield',
  'Husqvarna', 'Benelli', 'Moto Guzzi', 'Indian', 'Vespa', 'Piaggio'
];

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:postcode'?: string;
    'addr:country'?: string;
    phone?: string;
    'contact:phone'?: string;
    email?: string;
    'contact:email'?: string;
    website?: string;
    'contact:website'?: string;
    brand?: string;
    'brand:wikidata'?: string;
    'service:vehicle:motorcycle'?: string;
    shop?: string;
    craft?: string;
    [key: string]: string | undefined;
  };
}

interface RepairShop {
  name: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  brands: string[];
  phone?: string;
  email?: string;
  website?: string;
  is_dealer: boolean;
  osm_id: string;
  osm_type: string;
}

export interface ExtractionResult {
  totalImported: number;
  countriesProcessed: number;
  errors: string[];
}

class OSMExtractor {
  private supabase;
  private overpassUrl = 'https://overpass-api.de/api/interpreter';

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  private buildOverpassQuery(countryCode: string): string {
    return `
      [out:json][timeout:60];
      area["ISO3166-1"="${countryCode}"][admin_level=2];
      (
        node["shop"="motorcycle_repair"](area);
        way["shop"="motorcycle_repair"](area);
        relation["shop"="motorcycle_repair"](area);
        node["shop"="motorcycle"]["service:vehicle:motorcycle"="yes"](area);
        way["shop"="motorcycle"]["service:vehicle:motorcycle"="yes"](area);
        node["craft"="motorcycle_repair"](area);
        way["craft"="motorcycle_repair"](area);
      );
      out center tags;
    `;
  }

  private async fetchFromOverpass(query: string): Promise<OSMElement[]> {
    const response = await fetch(this.overpassUrl, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.elements || [];
  }

  private extractBrands(tags: OSMElement['tags']): string[] {
    const brands: string[] = [];

    if (tags.brand) {
      const brand = tags.brand.trim();
      const matchedBrand = MOTORCYCLE_BRANDS.find(
        b => b.toLowerCase() === brand.toLowerCase()
      );
      if (matchedBrand) {
        brands.push(matchedBrand);
      }
    }

    if (tags.name) {
      const nameLower = tags.name.toLowerCase();
      MOTORCYCLE_BRANDS.forEach(brand => {
        if (nameLower.includes(brand.toLowerCase()) && !brands.includes(brand)) {
          brands.push(brand);
        }
      });
    }

    return brands;
  }

  private isDealer(element: OSMElement): boolean {
    const tags = element.tags;

    if (tags.shop === 'motorcycle' && tags['service:vehicle:motorcycle'] === 'yes') {
      return true;
    }

    if (tags.brand || tags['brand:wikidata']) {
      return true;
    }

    if (tags.name) {
      const nameLower = tags.name.toLowerCase();
      if (
        nameLower.includes('dealer') ||
        nameLower.includes('center') ||
        nameLower.includes('centre') ||
        nameLower.includes('official')
      ) {
        return true;
      }
    }

    return false;
  }

  private convertToRepairShop(element: OSMElement, countryCode: string): RepairShop | null {
    const tags = element.tags;

    if (!tags.name) return null;

    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    if (!lat || !lon) return null;

    const streetNumber = tags['addr:housenumber'] || '';
    const street = tags['addr:street'] || '';
    const addressParts = [streetNumber, street].filter(Boolean);
    const address = addressParts.join(' ') || 'Address not available';

    const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || 'Unknown';
    const phone = tags.phone || tags['contact:phone'];
    const email = tags.email || tags['contact:email'];
    const website = tags.website || tags['contact:website'];
    const brands = this.extractBrands(tags);
    const isDealer = this.isDealer(element);

    return {
      name: tags.name,
      country: COUNTRY_NAMES[countryCode] || countryCode,
      city,
      address,
      latitude: lat,
      longitude: lon,
      brands,
      phone,
      email,
      website,
      is_dealer: isDealer,
      osm_id: `${element.type}/${element.id}`,
      osm_type: element.type
    };
  }

  private async shopExists(osmId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('repair_shops')
      .select('id')
      .eq('osm_id', osmId)
      .single();

    return !!data;
  }

  private async importShop(shop: RepairShop): Promise<boolean> {
    if (await this.shopExists(shop.osm_id)) {
      return false;
    }

    const { error } = await this.supabase
      .from('repair_shops')
      .insert([shop]);

    return !error;
  }

  async extractCountry(countryCode: string): Promise<{ imported: number; total: number }> {
    const query = this.buildOverpassQuery(countryCode);
    const elements = await this.fetchFromOverpass(query);

    let importedCount = 0;

    for (const element of elements) {
      const shop = this.convertToRepairShop(element, countryCode);
      if (shop) {
        const imported = await this.importShop(shop);
        if (imported) {
          importedCount++;
        }
      }
    }

    return { imported: importedCount, total: elements.length };
  }

  async extractAll(countries: string[] = EU_COUNTRIES): Promise<ExtractionResult> {
    let totalImported = 0;
    const errors: string[] = [];

    for (const countryCode of countries) {
      try {
        const result = await this.extractCountry(countryCode);
        totalImported += result.imported;

        // Rate limiting
        if (countries.indexOf(countryCode) < countries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error: any) {
        errors.push(`${COUNTRY_NAMES[countryCode]}: ${error.message}`);
      }
    }

    return {
      totalImported,
      countriesProcessed: countries.length,
      errors
    };
  }
}

/**
 * Main export function that can be called from API routes or CLI
 */
export async function runExtraction(countries: string[] = []): Promise<ExtractionResult> {
  const extractor = new OSMExtractor();

  if (countries.length > 0) {
    // Validate country codes
    const validCountries = countries.filter(code => EU_COUNTRIES.includes(code.toUpperCase()));
    return await extractor.extractAll(validCountries);
  } else {
    // Extract all EU countries
    return await extractor.extractAll();
  }
}
