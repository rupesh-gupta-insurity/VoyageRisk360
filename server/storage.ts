import {
  users,
  routes,
  waypoints,
  alertConfigs,
  type User,
  type UpsertUser,
  type Route,
  type Waypoint,
  type AlertConfig,
  type InsertRoute,
  type InsertAlertConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Route operations
  createRoute(userId: string, route: InsertRoute): Promise<{ route: Route; waypoints: Waypoint[] }>;
  getRoutesByUser(userId: string): Promise<Array<Route & { waypoints: Waypoint[] }>>;
  getRouteById(routeId: string, userId: string): Promise<(Route & { waypoints: Waypoint[] }) | undefined>;
  deleteRoute(routeId: string, userId: string): Promise<void>;

  // Alert configuration operations
  getAlertConfig(userId: string): Promise<AlertConfig | undefined>;
  upsertAlertConfig(userId: string, config: InsertAlertConfig): Promise<AlertConfig>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Route operations
  async createRoute(userId: string, route: InsertRoute): Promise<{ route: Route; waypoints: Waypoint[] }> {
    const [newRoute] = await db
      .insert(routes)
      .values({
        userId,
        name: route.name,
        riskScore: route.riskScore,
        weatherRisk: route.weatherRisk,
        piracyRisk: route.piracyRisk,
        trafficRisk: route.trafficRisk,
        claimsRisk: route.claimsRisk,
      })
      .returning();

    const waypointValues = route.waypoints.map((wp, index) => ({
      routeId: newRoute.id,
      latitude: wp.latitude.toString(),
      longitude: wp.longitude.toString(),
      sequence: index,
    }));

    const newWaypoints = await db.insert(waypoints).values(waypointValues).returning();

    return { route: newRoute, waypoints: newWaypoints };
  }

  async getRoutesByUser(userId: string): Promise<Array<Route & { waypoints: Waypoint[] }>> {
    const userRoutes = await db
      .select()
      .from(routes)
      .where(eq(routes.userId, userId))
      .orderBy(desc(routes.createdAt));

    const routesWithWaypoints = await Promise.all(
      userRoutes.map(async (route) => {
        const routeWaypoints = await db
          .select()
          .from(waypoints)
          .where(eq(waypoints.routeId, route.id))
          .orderBy(waypoints.sequence);

        return { ...route, waypoints: routeWaypoints };
      })
    );

    return routesWithWaypoints;
  }

  async getRouteById(routeId: string, userId: string): Promise<(Route & { waypoints: Waypoint[] }) | undefined> {
    const [route] = await db
      .select()
      .from(routes)
      .where(eq(routes.id, routeId));
    
    // Security: verify route belongs to user
    if (!route || route.userId !== userId) return undefined;

    const routeWaypoints = await db
      .select()
      .from(waypoints)
      .where(eq(waypoints.routeId, routeId))
      .orderBy(waypoints.sequence);

    return { ...route, waypoints: routeWaypoints };
  }

  async deleteRoute(routeId: string, userId: string): Promise<void> {
    // Security: verify ownership BEFORE deleting
    const [route] = await db
      .select()
      .from(routes)
      .where(eq(routes.id, routeId));
    
    if (!route) {
      throw new Error("Route not found");
    }
    
    if (route.userId !== userId) {
      throw new Error("Unauthorized to delete this route");
    }
    
    // Now safe to delete
    await db.delete(routes).where(eq(routes.id, routeId));
  }

  // Alert configuration operations
  async getAlertConfig(userId: string): Promise<AlertConfig | undefined> {
    const [config] = await db
      .select()
      .from(alertConfigs)
      .where(eq(alertConfigs.userId, userId));
    return config;
  }

  async upsertAlertConfig(userId: string, config: InsertAlertConfig): Promise<AlertConfig> {
    const [alertConfig] = await db
      .insert(alertConfigs)
      .values({
        userId,
        enabled: config.enabled,
        threshold: config.threshold,
      })
      .onConflictDoUpdate({
        target: alertConfigs.userId,
        set: {
          enabled: config.enabled,
          threshold: config.threshold,
          updatedAt: new Date(),
        },
      })
      .returning();
    return alertConfig;
  }
}

export const storage = new DatabaseStorage();
