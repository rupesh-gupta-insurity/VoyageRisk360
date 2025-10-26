// Maritime traffic risk assessment using AISstream.io
// Requires free API key from https://aisstream.io/

import WebSocket from 'ws';

interface VesselPosition {
  mmsi: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

interface TrafficRiskResult {
  riskScore: number; // 0-100
  vesselCount: number;
  vesselDensity: number; // vessels per square km
}

/**
 * Create a bounding box around a point (radius in degrees, ~55km per 0.5 degrees at equator)
 */
function createBoundingBox(
  latitude: number,
  longitude: number,
  radiusDegrees: number = 0.5
): [[number, number], [number, number]] {
  return [
    [latitude - radiusDegrees, longitude - radiusDegrees],
    [latitude + radiusDegrees, longitude + radiusDegrees],
  ];
}

/**
 * Calculate area of bounding box in square kilometers (approximate)
 */
function calculateBboxArea(radiusDegrees: number): number {
  // Approximate: 1 degree = 111 km
  const kmPerDegree = 111;
  const sideLength = radiusDegrees * 2 * kmPerDegree;
  return sideLength * sideLength;
}

/**
 * Query vessel density in a specific area using AISstream.io
 * Returns null if API key is not configured or connection fails
 */
export async function getVesselDensity(
  latitude: number,
  longitude: number,
  apiKey?: string,
  timeoutMs: number = 10000
): Promise<TrafficRiskResult | null> {
  // Skip if no API key provided
  if (!apiKey) {
    console.log('AISstream.io API key not configured, using simulated traffic data');
    return null;
  }

  return new Promise((resolve) => {
    const vessels = new Set<string>(); // Use Set to avoid counting duplicates
    const radiusDegrees = 0.5; // ~55km radius
    const bbox = createBoundingBox(latitude, longitude, radiusDegrees);
    
    let ws: WebSocket | null = null;
    let timeout: NodeJS.Timeout;

    const cleanup = () => {
      if (ws) {
        ws.close();
        ws = null;
      }
      if (timeout) {
        clearTimeout(timeout);
      }
    };

    try {
      ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

      // Set timeout for data collection
      timeout = setTimeout(() => {
        cleanup();
        
        const vesselCount = vessels.size;
        const area = calculateBboxArea(radiusDegrees);
        const density = vesselCount / area;
        
        // Calculate risk based on vessel density
        // Thresholds: <0.01 = low, 0.01-0.05 = medium, 0.05-0.1 = high, >0.1 = critical
        let riskScore = 0;
        if (density < 0.01) {
          riskScore = Math.min(density * 1000, 20);
        } else if (density < 0.05) {
          riskScore = 20 + ((density - 0.01) / 0.04) * 30;
        } else if (density < 0.1) {
          riskScore = 50 + ((density - 0.05) / 0.05) * 30;
        } else {
          riskScore = Math.min(80 + (density - 0.1) * 200, 100);
        }

        resolve({
          riskScore: Math.round(riskScore),
          vesselCount,
          vesselDensity: density,
        });
      }, timeoutMs);

      ws.on('open', () => {
        if (!ws) return;
        
        const subscriptionMessage = {
          APIKey: apiKey,
          BoundingBoxes: [bbox],
          FilterMessageTypes: ['PositionReport'],
        };

        ws.send(JSON.stringify(subscriptionMessage));
      });

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.MessageType === 'PositionReport') {
            const position = message.Message?.PositionReport;
            if (position?.UserID) {
              vessels.add(position.UserID.toString());
            }
          }
        } catch (error) {
          console.error('Error parsing AIS message:', error);
        }
      });

      ws.on('error', (error) => {
        console.error('AISstream WebSocket error:', error);
        cleanup();
        resolve(null); // Fallback to simulated data
      });

      ws.on('close', () => {
        cleanup();
      });

    } catch (error) {
      console.error('Error connecting to AISstream:', error);
      cleanup();
      resolve(null);
    }
  });
}

/**
 * Get average traffic risk for multiple waypoints along a route
 */
export async function getRouteTrafficRisk(
  waypoints: Array<{ latitude: number; longitude: number }>,
  apiKey?: string
): Promise<number | null> {
  if (waypoints.length === 0) {
    return null;
  }

  if (!apiKey) {
    return null; // Fallback to simulated data
  }

  // Sample waypoints to reduce API calls - check every 5th waypoint or key points
  const sampleInterval = Math.max(1, Math.floor(waypoints.length / 3));
  const sampledWaypoints = waypoints.filter((_, index) => index % sampleInterval === 0);

  // Query traffic density sequentially to avoid overwhelming the WebSocket connection
  const results: TrafficRiskResult[] = [];
  
  for (const wp of sampledWaypoints) {
    const result = await getVesselDensity(wp.latitude, wp.longitude, apiKey, 8000);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    return null; // All queries failed, fallback to simulated
  }

  // Return average risk score
  const avgRisk = results.reduce((sum, r) => sum + r.riskScore, 0) / results.length;
  return Math.round(avgRisk);
}
