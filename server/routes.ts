import type { Express } from "express";
import { createServer, type Server } from "http";
import { calculateRouteRisk } from "./riskEngine";
import { searchLocation, getRouteEndpoints } from "./services/geocodingService";
import { z } from "zod";
import { db } from "./db";
import { policies } from "@shared/schema";
import { eq, and, like, or, sql } from "drizzle-orm";

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

  // Get all policies with optional filters
  app.get('/api/policies', async (req, res) => {
    try {
      const { year, status, type, insurer, search, page = '1', limit = '10' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Build where conditions
      const conditions = [];
      
      if (year) {
        conditions.push(eq(policies.underwritingYear, parseInt(year as string)));
      }
      
      if (status) {
        conditions.push(eq(policies.status, status as string));
      }
      
      if (type) {
        conditions.push(eq(policies.policyType, type as string));
      }
      
      if (insurer) {
        conditions.push(eq(policies.insurer, insurer as string));
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(policies.policyNo, searchTerm),
            like(policies.policyName, searchTerm),
            like(policies.assured, searchTerm)
          )
        );
      }
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(policies)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const total = Number(countResult[0]?.count || 0);
      
      // Get paginated results
      const results = await db
        .select()
        .from(policies)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(sql`${policies.underwritingYear} DESC, ${policies.policyNo} DESC`)
        .limit(limitNum)
        .offset(offset);
      
      res.json({
        data: results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: error.message || "Failed to fetch policies" });
    }
  });
  
  // Get single policy by ID
  app.get('/api/policies/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .select()
        .from(policies)
        .where(eq(policies.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Policy not found' });
      }
      
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error fetching policy:", error);
      res.status(500).json({ message: error.message || "Failed to fetch policy" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
