/**
 * OSM Data Extraction Script for Motorcycle Repair Shops
 *
 * This script fetches verified motorcycle repair shop data from OpenStreetMap
 * for EU countries and imports it into the Supabase database.
 *
 * Features:
 * - Fetches only shops with proper business tags (name, address, etc.)
 * - Filters for motorcycle-specific shops
 * - Maps brands to your filtering system
 * - Validates data quality before import
 * - Prevents duplicates using OSM IDs
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// EU Countries (ISO 3166-1 alpha-2 codes)
const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
];

// Country code to full name mapping
const COUNTRY_NAMES: { [key: string]: string } = {
  'AT': 'Austria', 'BE': 'Belgium', 'BG': 'Bulgaria', 'HR': 'Croatia',
  'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DK': 'Denmark', 'EE': 'Estonia',
  'FI': 'Finland', 'FR': 'France', 'DE': 'Germany', 'GR': 'Greece',
  'HU': 'Hungary', 'IE': 'Ireland', 'IT': 'Italy', 'LV': 'Latvia',
  'LT': 'Lithuania', 'LU': 'Luxembourg', 'MT': 'Malta', 'NL': 'Netherlands',
  'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania', 'SK': 'Slovakia',
  'SI': 'Slovenia', 'ES': 'Spain', 'SE': 'Sweden'
};

// Motorcycle brands mapping - helps determine if it's a dealer
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

class OSMDataExtractor {
  private supabase;
  private overpassUrl = 'https://overpass-api.de/api/interpreter';

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    }

    // Use service role key for write access
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Build Overpass QL query for motorcycle repair shops in a country
   */
  private buildOverpassQuery(countryCode: string): string {
    return `
      [out:json][timeout:60];
      area["ISO3166-1"="${countryCode}"][admin_level=2];
      (
        // Motorcycle repair shops
        node["shop"="motorcycle_repair"](area);
        way["shop"="motorcycle_repair"](area);
        relation["shop"="motorcycle_repair"](area);

        // Motorcycle dealers (they usually offer repair services)
        node["shop"="motorcycle"]["service:vehicle:motorcycle"="yes"](area);
        way["shop"="motorcycle"]["service:vehicle:motorcycle"="yes"](area);

        // Craft businesses specializing in motorcycles
        node["craft"="motorcycle_repair"](area);
        way["craft"="motorcycle_repair"](area);
      );
      out center tags;
    `;
  }

  /**
   * Fetch data from Overpass API
   */
  private async fetchFromOverpass(query: string): Promise<OSMElement[]> {
    try {
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
    } catch (error) {
      console.error('Error fetching from Overpass API:', error);
      throw error;
    }
  }

  /**
   * Extract brands from OSM tags
   */
  private extractBrands(tags: OSMElement['tags']): string[] {
    const brands: string[] = [];

    // Check for explicit brand tag
    if (tags.brand) {
      const brand = tags.brand.trim();
      const matchedBrand = MOTORCYCLE_BRANDS.find(
        b => b.toLowerCase() === brand.toLowerCase()
      );
      if (matchedBrand) {
        brands.push(matchedBrand);
      }
    }

    // Check name for brand mentions
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

  /**
   * Determine if shop is a dealer
   */
  private isDealer(element: OSMElement): boolean {
    const tags = element.tags;

    // Explicit dealer tags
    if (tags.shop === 'motorcycle' && tags['service:vehicle:motorcycle'] === 'yes') {
      return true;
    }

    // Has brand tag (usually indicates official dealer)
    if (tags.brand || tags['brand:wikidata']) {
      return true;
    }

    // Name contains dealer-like terms
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

  /**
   * Convert OSM element to RepairShop object
   */
  private convertToRepairShop(element: OSMElement, countryCode: string): RepairShop | null {
    const tags = element.tags;

    // Must have a name
    if (!tags.name) {
      return null;
    }

    // Must have coordinates
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    if (!lat || !lon) {
      return null;
    }

    // Build address
    const streetNumber = tags['addr:housenumber'] || '';
    const street = tags['addr:street'] || '';
    const addressParts = [streetNumber, street].filter(Boolean);
    const address = addressParts.join(' ') || 'Address not available';

    // Get city
    const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || 'Unknown';

    // Get contact info
    const phone = tags.phone || tags['contact:phone'];
    const email = tags.email || tags['contact:email'];
    const website = tags.website || tags['contact:website'];

    // Extract brands
    const brands = this.extractBrands(tags);

    // Determine if dealer
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

  /**
   * Check if shop already exists in database
   */
  private async shopExists(osmId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('repair_shops')
      .select('id')
      .eq('osm_id', osmId)
      .single();

    return !!data && !error;
  }

  /**
   * Import shop into database
   */
  private async importShop(shop: RepairShop): Promise<boolean> {
    try {
      // Check if already exists
      if (await this.shopExists(shop.osm_id)) {
        console.log(`  ⏭️  Skipping duplicate: ${shop.name}`);
        return false;
      }

      const { error } = await this.supabase
        .from('repair_shops')
        .insert([shop]);

      if (error) {
        console.error(`  ❌ Error importing ${shop.name}:`, error.message);
        return false;
      }

      console.log(`  ✅ Imported: ${shop.name} (${shop.city}, ${shop.country})`);
      return true;
    } catch (error) {
      console.error(`  ❌ Error importing shop:`, error);
      return false;
    }
  }

  /**
   * Extract data for a single country
   */
  async extractCountry(countryCode: string): Promise<number> {
    console.log(`\n🌍 Extracting data for ${COUNTRY_NAMES[countryCode]}...`);

    try {
      const query = this.buildOverpassQuery(countryCode);
      const elements = await this.fetchFromOverpass(query);

      console.log(`📥 Found ${elements.length} potential shops`);

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

      console.log(`✨ Imported ${importedCount} new shops from ${COUNTRY_NAMES[countryCode]}`);
      return importedCount;

    } catch (error) {
      console.error(`❌ Error processing ${COUNTRY_NAMES[countryCode]}:`, error);
      return 0;
    }
  }

  /**
   * Extract data for all EU countries
   */
  async extractAll(countries: string[] = EU_COUNTRIES): Promise<void> {
    console.log('🚀 Starting OSM data extraction for EU motorcycle repair shops...\n');

    let totalImported = 0;

    for (const countryCode of countries) {
      const imported = await this.extractCountry(countryCode);
      totalImported += imported;

      // Rate limiting - wait 3 seconds between requests to be respectful to Overpass API
      if (countries.indexOf(countryCode) < countries.length - 1) {
        console.log('⏳ Waiting 3 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log(`\n🎉 Extraction complete! Total shops imported: ${totalImported}`);
  }
}

// Main execution
async function main() {
  try {
    const extractor = new OSMDataExtractor();

    // Check if specific countries are provided as arguments
    const args = process.argv.slice(2);

    if (args.length > 0) {
      // Extract only specified countries
      const countries = args.map(arg => arg.toUpperCase()).filter(code =>
        EU_COUNTRIES.includes(code)
      );

      if (countries.length === 0) {
        console.error('❌ Invalid country codes provided. Use ISO 3166-1 alpha-2 codes (e.g., DE, FR, IT)');
        process.exit(1);
      }

      await extractor.extractAll(countries);
    } else {
      // Extract all EU countries
      console.log('ℹ️  No countries specified. Extracting all EU countries...');
      console.log('💡 Tip: You can specify countries like: npm run extract-osm DE FR IT\n');
      await extractor.extractAll();
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
