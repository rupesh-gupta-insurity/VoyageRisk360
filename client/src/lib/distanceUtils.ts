/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate total route distance from waypoints
 * @param waypoints - Array of waypoints with lat and lng
 * @returns Total distance in kilometers
 */
export function calculateRouteDistance(
  waypoints: Array<{ lat: number; lng: number }>
): number {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i];
    const next = waypoints[i + 1];
    totalDistance += calculateDistance(current.lat, current.lng, next.lat, next.lng);
  }

  return totalDistance;
}

/**
 * Format distance for display
 * @param km - Distance in kilometers
 * @returns Formatted string with appropriate unit
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  } else if (km < 10) {
    return `${km.toFixed(1)} km`;
  } else {
    return `${Math.round(km).toLocaleString()} km`;
  }
}

/**
 * Convert kilometers to nautical miles
 */
export function kmToNauticalMiles(km: number): number {
  return km * 0.539957;
}

/**
 * Format distance in nautical miles
 */
export function formatNauticalMiles(km: number): string {
  const nm = kmToNauticalMiles(km);
  if (nm < 10) {
    return `${nm.toFixed(1)} nm`;
  } else {
    return `${Math.round(nm).toLocaleString()} nm`;
  }
}
