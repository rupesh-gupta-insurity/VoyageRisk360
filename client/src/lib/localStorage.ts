import type { AlertConfig } from "@shared/schema";

const ROUTES_KEY = "voyagerisk360_routes";
const ALERT_CONFIG_KEY = "voyagerisk360_alert_config";

// Extended Route type that includes waypoints for localStorage
export interface StoredRoute {
  id: string;
  name: string;
  riskScore: number;
  weatherRisk: number;
  piracyRisk: number;
  trafficRisk: number;
  claimsRisk: number;
  createdAt: Date;
  waypoints: Array<{
    latitude: string;
    longitude: string;
    sequence: number;
  }>;
}

// Generate a simple unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Route Storage
export function saveRoute(route: {
  name: string;
  waypoints: Array<{ latitude: string; longitude: string; sequence: number }>;
  riskScore: number;
  weatherRisk: number;
  piracyRisk: number;
  trafficRisk: number;
  claimsRisk: number;
}): StoredRoute {
  const routes = getAllRoutes();
  const newRoute: StoredRoute = {
    id: generateId(),
    ...route,
    createdAt: new Date(),
  };
  
  routes.push(newRoute);
  localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  return newRoute;
}

export function getAllRoutes(): StoredRoute[] {
  const stored = localStorage.getItem(ROUTES_KEY);
  if (!stored) return [];
  
  try {
    const routes = JSON.parse(stored);
    // Convert date strings back to Date objects
    return routes.map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt),
    }));
  } catch {
    return [];
  }
}

export function getRouteById(id: string): StoredRoute | null {
  const routes = getAllRoutes();
  return routes.find(r => r.id === id) || null;
}

export function deleteRoute(id: string): void {
  const routes = getAllRoutes().filter(r => r.id !== id);
  localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
}

// Alert Config Storage
export function getAlertConfig(): AlertConfig {
  const stored = localStorage.getItem(ALERT_CONFIG_KEY);
  if (!stored) {
    return {
      id: "default",
      userId: "demo-user",
      enabled: true,
      threshold: 75,
      updatedAt: new Date(),
    };
  }
  
  try {
    const config = JSON.parse(stored);
    return {
      ...config,
      updatedAt: new Date(config.updatedAt),
    };
  } catch {
    return {
      id: "default",
      userId: "demo-user",
      enabled: true,
      threshold: 75,
      updatedAt: new Date(),
    };
  }
}

export function saveAlertConfig(config: { enabled: boolean; threshold: number }): AlertConfig {
  const savedConfig: AlertConfig = {
    id: "default",
    userId: "demo-user",
    ...config,
    updatedAt: new Date(),
  };
  
  localStorage.setItem(ALERT_CONFIG_KEY, JSON.stringify(savedConfig));
  return savedConfig;
}
