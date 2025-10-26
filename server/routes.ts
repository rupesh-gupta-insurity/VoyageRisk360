import type { Express } from "express";
import { createServer, type Server } from "http";
import { calculateRouteRisk } from "./riskEngine";
import { searchLocation, getRouteEndpoints } from "./services/geocodingService";
import { z } from "zod";

// Simple schema for risk calculation request
const riskCalculationSchema = z.object({
  waypoints: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    sequence: z.number(),
  })),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Risk calculation endpoint (no auth needed)
  app.post('/api/calculate-risk', async (req, res) => {
    try {
      const { waypoints } = riskCalculationSchema.parse(req.body);
      const riskScores = await calculateRouteRisk(waypoints);
      res.json(riskScores);
    } catch (error: any) {
      console.error("Error calculating risk:", error);
      res.status(400).json({ message: error.message || "Failed to calculate risk" });
    }
  });

  // Geocoding endpoint - search for locations
  app.get('/api/geocode', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 5;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: 'Query parameter "q" is required' });
      }

      const results = await searchLocation(query, limit);
      res.json(results);
    } catch (error: any) {
      console.error("Error geocoding:", error);
      res.status(500).json({ message: error.message || "Failed to geocode location" });
    }
  });

  // Route endpoints - get start and end coordinates for a route
  app.post('/api/route-endpoints', async (req, res) => {
    try {
      const { origin, destination } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({ message: 'Origin and destination are required' });
      }

      const endpoints = await getRouteEndpoints(origin, destination);
      
      if (!endpoints) {
        return res.status(404).json({ message: 'Could not find one or both locations' });
      }

      res.json(endpoints);
    } catch (error: any) {
      console.error("Error finding route endpoints:", error);
      res.status(500).json({ message: error.message || "Failed to find route endpoints" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
