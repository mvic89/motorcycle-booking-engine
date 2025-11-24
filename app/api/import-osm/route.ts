/**
 * API Route: Import OSM Data
 *
 * This endpoint triggers the OSM data extraction script.
 * It's designed to be called by n8n or other automation tools.
 *
 * Security: Uses API key authentication
 * Method: POST
 * URL: /api/import-osm
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Security: Check API key
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.API_SECRET_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API_SECRET_KEY not configured on server' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    // Parse request body to get countries (optional)
    const body = await request.json().catch(() => ({}));
    const countries = body.countries || []; // e.g., ['DE', 'FR', 'IT']

    // Import the extraction logic
    // Note: We'll create a separate module to avoid running the script directly
    const { runExtraction } = await import('@/lib/osm-extractor');

    // Run the extraction
    const result = await runExtraction(countries);

    return NextResponse.json({
      success: true,
      message: 'OSM data extraction completed',
      stats: result
    });

  } catch (error: any) {
    console.error('Error in import-osm API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import OSM data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/import-osm',
    method: 'POST',
    description: 'Trigger OSM data extraction'
  });
}
