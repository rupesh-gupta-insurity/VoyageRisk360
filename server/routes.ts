import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { calculateRouteRisk } from "./riskEngine";
import { createRouteRequestSchema, insertAlertConfigSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Route management
  app.post('/api/routes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const routeRequest = createRouteRequestSchema.parse(req.body);

      // Calculate risk scores
      const riskScores = calculateRouteRisk(routeRequest.waypoints);

      const result = await storage.createRoute(userId, {
        name: routeRequest.name,
        waypoints: routeRequest.waypoints,
        riskScore: riskScores.overall,
        weatherRisk: riskScores.weather,
        piracyRisk: riskScores.piracy,
        trafficRisk: riskScores.traffic,
        claimsRisk: riskScores.claims,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error creating route:", error);
      res.status(400).json({ message: error.message || "Failed to create route" });
    }
  });

  app.get('/api/routes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const routes = await storage.getRoutesByUser(userId);
      res.json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.get('/api/routes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const route = await storage.getRouteById(req.params.id, userId);
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      console.error("Error fetching route:", error);
      res.status(500).json({ message: "Failed to fetch route" });
    }
  });

  app.delete('/api/routes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteRoute(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting route:", error);
      if (error.message?.includes('Unauthorized')) {
        return res.status(403).json({ message: "Unauthorized to delete this route" });
      }
      if (error.message?.includes('not found')) {
        return res.status(404).json({ message: "Route not found" });
      }
      res.status(500).json({ message: "Failed to delete route" });
    }
  });

  // Alert configuration
  app.get('/api/alert-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getAlertConfig(userId);
      
      // Return default config if none exists
      if (!config) {
        return res.json({ enabled: true, threshold: 75 });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching alert config:", error);
      res.status(500).json({ message: "Failed to fetch alert configuration" });
    }
  });

  app.post('/api/alert-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const configData = insertAlertConfigSchema.parse(req.body);
      const config = await storage.upsertAlertConfig(userId, configData);
      res.json(config);
    } catch (error: any) {
      console.error("Error saving alert config:", error);
      res.status(400).json({ message: error.message || "Failed to save alert configuration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
