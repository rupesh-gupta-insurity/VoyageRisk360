// Risk calculation engine - integrates real APIs with fallback to simulated data
import { getRouteWeatherRisk } from './services/weatherService';
import { getRouteTrafficRisk } from './services/trafficService';

interface Waypoint {
  latitude: number;
  longitude: number;
}

interface RiskScores {
  overall: number;
  weather: number;
  piracy: number;
  traffic: number;
  claims: number;
}

// ============================================================================
// SIMULATED DATA (Fallback when APIs are unavailable)
// ============================================================================

const HIGH_RISK_ZONES = {
  piracy: [
    { minLat: 0, maxLat: 15, minLng: 40, maxLng: 60 }, // Gulf of Aden
    { minLat: -5, maxLat: 10, minLng: 90, maxLng: 110 }, // Southeast Asia
  ],
  weather: [
    { minLat: 10, maxLat: 30, minLng: 40, maxLng: 80 }, // Monsoon region
    { minLat: 20, maxLat: 40, minLng: 120, maxLng: 160 }, // Pacific typhoon
  ],
  traffic: [
    { minLat: 1, maxLat: 5, minLng: 100, maxLng: 106 }, // Malacca Strait
    { minLat: 30, maxLat: 40, minLng: -10, maxLng: 10 }, // Gibraltar Strait
  ],
  claims: [
    { minLat: 5, maxLat: 20, minLng: 65, maxLng: 85 }, // Arabian Sea
    { minLat: 35, maxLat: 45, minLng: 10, maxLng: 30 }, // Mediterranean
  ],
};

function isInZone(
  lat: number,
  lng: number,
  zone: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  return lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng;
}

function calculateSimulatedRisk(
  waypoints: Waypoint[],
  zones: Array<{ minLat: number; maxLat: number; minLng: number; maxLng: number }>
): number {
  let riskPoints = 0;
  const totalChecks = waypoints.length;

  waypoints.forEach((wp) => {
    const inHighRiskZone = zones.some((zone) => isInZone(wp.latitude, wp.longitude, zone));
    if (inHighRiskZone) {
      riskPoints += 2;
    } else {
      // Add some random variation for realism
      riskPoints += Math.random() * 0.5;
    }
  });

  // Normalize to 0-100 scale
  const avgRisk = (riskPoints / (totalChecks * 2)) * 100;
  return Math.min(Math.round(avgRisk), 100);
}

// ============================================================================
// REAL API INTEGRATION (with fallback)
// ============================================================================

/**
 * Calculate weather risk using real API data from Open-Meteo Marine Weather
 * Falls back to simulated data if API is unavailable
 */
async function calculateWeatherRisk(waypoints: Waypoint[]): Promise<number> {
  console.log('Calculating weather risk using Open-Meteo Marine API...');
  
  const realRisk = await getRouteWeatherRisk(waypoints);
  
  if (realRisk !== null) {
    console.log(`✓ Real weather risk: ${realRisk}%`);
    return realRisk;
  }
  
  // Fallback to simulated data
  console.log('⚠ Open-Meteo unavailable, using simulated weather data');
  return calculateSimulatedRisk(waypoints, HIGH_RISK_ZONES.weather);
}

/**
 * Calculate traffic risk using real AIS data from AISstream.io
 * Falls back to simulated data if API key not configured or unavailable
 */
async function calculateTrafficRisk(waypoints: Waypoint[]): Promise<number> {
  const apiKey = process.env.AISSTREAM_API_KEY;
  
  if (!apiKey) {
    console.log('⚠ AISstream API key not configured, using simulated traffic data');
    return calculateSimulatedRisk(waypoints, HIGH_RISK_ZONES.traffic);
  }

  console.log('Calculating traffic risk using AISstream.io...');
  
  const realRisk = await getRouteTrafficRisk(waypoints, apiKey);
  
  if (realRisk !== null) {
    console.log(`✓ Real traffic risk: ${realRisk}%`);
    return realRisk;
  }
  
  // Fallback to simulated data
  console.log('⚠ AISstream unavailable, using simulated traffic data');
  return calculateSimulatedRisk(waypoints, HIGH_RISK_ZONES.traffic);
}

/**
 * Calculate piracy risk - currently simulated
 * TODO: Integrate IMB Piracy Reporting Centre data when available
 */
function calculatePiracyRisk(waypoints: Waypoint[]): number {
  console.log('Using simulated piracy data (IMB API not available)');
  return calculateSimulatedRisk(waypoints, HIGH_RISK_ZONES.piracy);
}

/**
 * Calculate claims risk - currently simulated
 * TODO: Integrate maritime insurance claims database when available
 */
function calculateClaimsRisk(waypoints: Waypoint[]): number {
  console.log('Using simulated insurance claims data');
  return calculateSimulatedRisk(waypoints, HIGH_RISK_ZONES.claims);
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Calculate comprehensive risk scores for a maritime route
 * Integrates real APIs where available, falls back to simulated data
 */
export async function calculateRouteRisk(waypoints: Waypoint[]): Promise<RiskScores> {
  if (waypoints.length === 0) {
    return { overall: 0, weather: 0, piracy: 0, traffic: 0, claims: 0 };
  }

  console.log(`\n🌊 Calculating risk for route with ${waypoints.length} waypoints...`);

  // Calculate all risk factors (weather and traffic use real APIs)
  const [weather, piracy, traffic, claims] = await Promise.all([
    calculateWeatherRisk(waypoints),
    Promise.resolve(calculatePiracyRisk(waypoints)),
    calculateTrafficRisk(waypoints),
    Promise.resolve(calculateClaimsRisk(waypoints)),
  ]);

  // Weighted average for overall risk
  // Piracy has highest weight (35%), weather 25%, traffic and claims 20% each
  const overall = Math.round(weather * 0.25 + piracy * 0.35 + traffic * 0.2 + claims * 0.2);

  console.log(`✅ Risk calculation complete: Overall=${overall}%, Weather=${weather}%, Piracy=${piracy}%, Traffic=${traffic}%, Claims=${claims}%\n`);

  return { overall, weather, piracy, traffic, claims };
}
