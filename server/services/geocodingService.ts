// Geocoding service using OpenStreetMap Nominatim API
// Free API - no authentication required
// Usage Policy: https://operations.osmfoundation.org/policies/nominatim/

interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  boundingbox?: [string, string, string, string]; // [minlat, maxlat, minlon, maxlon]
}

interface Location {
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

/**
 * Search for locations using Nominatim geocoding API
 * @param query Free-form search query (e.g. "Port of Singapore" or "New York")
 * @param limit Maximum number of results (default: 5, max: 40)
 * @returns Array of matching locations with coordinates
 */
export async function searchLocation(
  query: string,
  limit: number = 5
): Promise<Location[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: Math.min(limit, 40).toString(),
      addressdetails: '1',
      'accept-language': 'en', // Force English language results
      // Include email for usage policy compliance (for large requests)
      email: 'voyagerisk360@replit.com',
    });

    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    
    // Add User-Agent header as required by Nominatim usage policy
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VoyageRisk360/1.0 (Maritime Route Risk Assessment Demo)',
        'Accept-Language': 'en', // Also set in header for redundancy
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return [];
    }

    const results: GeocodingResult[] = await response.json();

    // Convert to simplified Location format
    return results.map(result => ({
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      type: result.type,
    }));

  } catch (error) {
    console.error('Error geocoding location:', error);
    return [];
  }
}

/**
 * Get coordinates for a specific port or maritime location
 * Filters results to prioritize maritime-relevant locations
 */
export async function searchPort(portName: string): Promise<Location | null> {
  const results = await searchLocation(`port of ${portName}`, 5);
  
  if (results.length === 0) {
    // Try without "port of" prefix
    const alternateResults = await searchLocation(portName, 5);
    return alternateResults.length > 0 ? alternateResults[0] : null;
  }
  
  return results[0];
}

/**
 * Get coordinates for two locations and return start/end points
 * Useful for route planning
 */
export async function getRouteEndpoints(
  origin: string,
  destination: string
): Promise<{ start: Location; end: Location } | null> {
  const [startResults, endResults] = await Promise.all([
    searchLocation(origin, 1),
    searchLocation(destination, 1),
  ]);

  if (startResults.length === 0 || endResults.length === 0) {
    return null;
  }

  return {
    start: startResults[0],
    end: endResults[0],
  };
}
