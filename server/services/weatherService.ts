// Weather risk assessment using Open-Meteo Marine Weather API
// Free API - no authentication required

interface WeatherData {
  wave_height: number;
  wind_wave_height: number;
  swell_wave_height: number;
  ocean_current_velocity: number;
  sea_surface_temperature: number;
}

interface WeatherRiskResult {
  riskScore: number; // 0-100
  factors: {
    waveHeight: number;
    windWaveHeight: number;
    currentVelocity: number;
  };
}

/**
 * Fetch current marine weather data from Open-Meteo API
 */
async function fetchMarineWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'wave_height,wind_wave_height,swell_wave_height,ocean_current_velocity,sea_surface_temperature',
      length_unit: 'metric',
      cell_selection: 'sea'
    });

    const url = `https://marine-api.open-meteo.com/v1/marine?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Open-Meteo API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      wave_height: data.current?.wave_height ?? 0,
      wind_wave_height: data.current?.wind_wave_height ?? 0,
      swell_wave_height: data.current?.swell_wave_height ?? 0,
      ocean_current_velocity: data.current?.ocean_current_velocity ?? 0,
      sea_surface_temperature: data.current?.sea_surface_temperature ?? 0,
    };
  } catch (error) {
    console.error('Error fetching marine weather:', error);
    return null;
  }
}

/**
 * Calculate weather risk score based on marine conditions
 * Returns 0-100 where 100 is highest risk
 */
function calculateWeatherRisk(weather: WeatherData): WeatherRiskResult {
  // Risk thresholds based on maritime standards
  const WAVE_HEIGHT_THRESHOLD = 4.0; // meters - significant wave height
  const WIND_WAVE_THRESHOLD = 3.0; // meters
  const CURRENT_THRESHOLD = 15.0; // km/h - strong currents

  // Calculate individual risk factors (0-100)
  const waveRisk = Math.min((weather.wave_height / WAVE_HEIGHT_THRESHOLD) * 100, 100);
  const windWaveRisk = Math.min((weather.wind_wave_height / WIND_WAVE_THRESHOLD) * 100, 100);
  const currentRisk = Math.min((weather.ocean_current_velocity / CURRENT_THRESHOLD) * 100, 100);
  
  // Swell adds additional risk if combined with high wind waves
  const swellMultiplier = weather.swell_wave_height > 2.0 ? 1.2 : 1.0;
  
  // Weighted average of risk factors
  const overallRisk = Math.min(
    (waveRisk * 0.4 + windWaveRisk * 0.4 + currentRisk * 0.2) * swellMultiplier,
    100
  );

  return {
    riskScore: Math.round(overallRisk),
    factors: {
      waveHeight: weather.wave_height,
      windWaveHeight: weather.wind_wave_height,
      currentVelocity: weather.ocean_current_velocity,
    }
  };
}

/**
 * Get weather risk for a specific coordinate
 * Returns null if API is unavailable (fallback to simulated data)
 */
export async function getWeatherRisk(
  latitude: number,
  longitude: number
): Promise<WeatherRiskResult | null> {
  const weather = await fetchMarineWeather(latitude, longitude);
  
  if (!weather) {
    return null; // Fallback to simulated data
  }

  return calculateWeatherRisk(weather);
}

/**
 * Get average weather risk for multiple waypoints
 */
export async function getRouteWeatherRisk(
  waypoints: Array<{ latitude: number; longitude: number }>
): Promise<number | null> {
  if (waypoints.length === 0) {
    return null;
  }

  // Sample waypoints - check every 3rd waypoint to reduce API calls
  const sampleInterval = Math.max(1, Math.floor(waypoints.length / 5));
  const sampledWaypoints = waypoints.filter((_, index) => index % sampleInterval === 0);

  const riskPromises = sampledWaypoints.map(wp => getWeatherRisk(wp.latitude, wp.longitude));
  const results = await Promise.all(riskPromises);

  // Filter out null results (failed API calls)
  const validResults = results.filter((r): r is WeatherRiskResult => r !== null);

  if (validResults.length === 0) {
    return null; // All API calls failed, fallback to simulated
  }

  // Return average risk score
  const avgRisk = validResults.reduce((sum, r) => sum + r.riskScore, 0) / validResults.length;
  return Math.round(avgRisk);
}
