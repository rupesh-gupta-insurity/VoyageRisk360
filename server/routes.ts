import type { Express } from "express";
import { createServer, type Server } from "http";
import { calculateRouteRisk } from "./riskEngine";
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
      const riskScores = calculateRouteRisk(waypoints);
      res.json(riskScores);
    } catch (error: any) {
      console.error("Error calculating risk:", error);
      res.status(400).json({ message: error.message || "Failed to calculate risk" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
