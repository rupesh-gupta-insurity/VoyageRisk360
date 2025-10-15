// Risk calculation engine with simulated data
// TODO: Replace with real API integrations (OpenWeatherMap, MarineTraffic, IMB Piracy Reports)

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

// Simulated risk zones (in production, these would come from APIs)
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

function isInZone(lat: number, lng: number, zone: { minLat: number; maxLat: number; minLng: number; maxLng: number }): boolean {
  return lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng;
}

function calculateFactorRisk(waypoints: Waypoint[], zones: Array<{ minLat: number; maxLat: number; minLng: number; maxLng: number }>): number {
  let riskPoints = 0;
  let totalChecks = waypoints.length;

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

export function calculateRouteRisk(waypoints: Waypoint[]): RiskScores {
  if (waypoints.length === 0) {
    return { overall: 0, weather: 0, piracy: 0, traffic: 0, claims: 0 };
  }

  const weather = calculateFactorRisk(waypoints, HIGH_RISK_ZONES.weather);
  const piracy = calculateFactorRisk(waypoints, HIGH_RISK_ZONES.piracy);
  const traffic = calculateFactorRisk(waypoints, HIGH_RISK_ZONES.traffic);
  const claims = calculateFactorRisk(waypoints, HIGH_RISK_ZONES.claims);

  // Weighted average for overall risk
  const overall = Math.round((weather * 0.25 + piracy * 0.35 + traffic * 0.2 + claims * 0.2));

  return { overall, weather, piracy, traffic, claims };
}
