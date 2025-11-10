import type { Express } from "express";
import { createServer, type Server } from "http";
import { calculateRouteRisk } from "./riskEngine";
import { searchLocation, getRouteEndpoints } from "./services/geocodingService";
import { generateRiskInsights, generateChatResponseStream } from "./services/aiService";
import { z } from "zod";
import { db } from "./db";
import { policies, shipmentCertificates, claims, insertShipmentCertificateSchema, insertClaimSchema } from "@shared/schema";
import { eq, and, like, or, sql, desc, gte, lte } from "drizzle-orm";

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

  // AI Risk Insights endpoint
  app.post('/api/ai-insights', async (req, res) => {
    try {
      const { riskScores, routeInfo } = req.body;
      
      if (!riskScores || !routeInfo) {
        return res.status(400).json({ message: 'Risk scores and route info are required' });
      }

      const insights = await generateRiskInsights(riskScores, routeInfo);
      res.json({ insights });
    } catch (error: any) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: error.message || "Failed to generate insights" });
    }
  });

  // AI Chat endpoint with streaming
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, context } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: 'Messages array is required' });
      }

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await generateChatResponseStream(messages, context);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error("Error in chat:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: error.message || "Failed to generate response" });
      }
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

  // Platform statistics endpoint
  app.get('/api/stats', async (req, res) => {
    try {
      // Get total policies
      const policiesCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(policies);
      
      // Get total shipments
      const shipmentsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(shipmentCertificates);
      
      // Get total claims
      const claimsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(claims);
      
      // Get active shipments (Booked, Loading, In Transit)
      const activeShipmentsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(shipmentCertificates)
        .where(
          or(
            eq(shipmentCertificates.status, 'Booked'),
            eq(shipmentCertificates.status, 'Loading'),
            eq(shipmentCertificates.status, 'In Transit')
          )
        );
      
      // Get settled claims
      const settledClaimsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(claims)
        .where(eq(claims.status, 'Settled'));
      
      // Get total insured value (sum of all policy coverages)
      const totalInsuredResult = await db
        .select({ total: sql<number>`COALESCE(SUM(${policies.sumInsured}::numeric), 0)` })
        .from(policies);
      
      // Get total settled amount
      const totalSettledResult = await db
        .select({ total: sql<number>`COALESCE(SUM(${claims.settledAmount}::numeric), 0)` })
        .from(claims)
        .where(eq(claims.status, 'Settled'));
      
      res.json({
        totalPolicies: Number(policiesCount[0]?.count || 0),
        totalShipments: Number(shipmentsCount[0]?.count || 0),
        totalClaims: Number(claimsCount[0]?.count || 0),
        activeShipments: Number(activeShipmentsCount[0]?.count || 0),
        settledClaims: Number(settledClaimsCount[0]?.count || 0),
        totalInsuredValue: Number(totalInsuredResult[0]?.total || 0),
        totalSettledAmount: Number(totalSettledResult[0]?.total || 0),
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch statistics" });
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

  // Get all shipments for a policy
  app.get('/api/policies/:policyId/shipments', async (req, res) => {
    try {
      const { policyId } = req.params;
      const { status, search, page = '1', limit = '10' } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Build where conditions
      const conditions = [eq(shipmentCertificates.policyId, policyId)];
      
      if (status) {
        conditions.push(eq(shipmentCertificates.status, status as string));
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(shipmentCertificates.certificateNumber, searchTerm),
            like(shipmentCertificates.sourcePort, searchTerm),
            like(shipmentCertificates.destinationPort, searchTerm),
            like(shipmentCertificates.commodity, searchTerm),
            like(shipmentCertificates.vesselName, searchTerm)
          )
        );
      }
      
      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(shipmentCertificates)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const total = Number(countResult[0]?.count || 0);
      
      // Get paginated results
      const results = await db
        .select()
        .from(shipmentCertificates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(shipmentCertificates.bookingDate))
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
      console.error("Error fetching shipments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch shipments" });
    }
  });

  // Create new shipment
  app.post('/api/policies/:policyId/shipments', async (req, res) => {
    try {
      const { policyId } = req.params;
      
      // Verify policy exists
      const policyCheck = await db
        .select()
        .from(policies)
        .where(eq(policies.id, policyId))
        .limit(1);
      
      if (policyCheck.length === 0) {
        return res.status(404).json({ message: 'Policy not found' });
      }
      
      const validated = insertShipmentCertificateSchema.parse({
        ...req.body,
        policyId,
      });
      
      const result = await db
        .insert(shipmentCertificates)
        .values(validated)
        .returning();
      
      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error("Error creating shipment:", error);
      res.status(400).json({ message: error.message || "Failed to create shipment" });
    }
  });

  // Get single shipment by ID
  app.get('/api/shipments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .select()
        .from(shipmentCertificates)
        .where(eq(shipmentCertificates.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Shipment not found' });
      }
      
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error fetching shipment:", error);
      res.status(500).json({ message: error.message || "Failed to fetch shipment" });
    }
  });

  // Update shipment
  app.patch('/api/shipments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .update(shipmentCertificates)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(shipmentCertificates.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Shipment not found' });
      }
      
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error updating shipment:", error);
      res.status(400).json({ message: error.message || "Failed to update shipment" });
    }
  });

  // Delete shipment
  app.delete('/api/shipments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .delete(shipmentCertificates)
        .where(eq(shipmentCertificates.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Shipment not found' });
      }
      
      res.json({ message: 'Shipment deleted successfully' });
    } catch (error: any) {
      console.error("Error deleting shipment:", error);
      res.status(500).json({ message: error.message || "Failed to delete shipment" });
    }
  });

  // Get all shipments (global view across all policies)
  app.get('/api/shipments', async (req, res) => {
    try {
      const {
        status,
        sourcePort,
        destinationPort,
        commodity,
        vesselName,
        insurer,
        dateFrom,
        dateTo,
        search,
        page = '1',
        limit = '50'
      } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Build where conditions
      const conditions = [];
      
      if (status) {
        conditions.push(eq(shipmentCertificates.status, status as string));
      }
      
      if (sourcePort) {
        conditions.push(like(shipmentCertificates.sourcePort, `%${sourcePort}%`));
      }
      
      if (destinationPort) {
        conditions.push(like(shipmentCertificates.destinationPort, `%${destinationPort}%`));
      }
      
      if (commodity) {
        conditions.push(like(shipmentCertificates.commodity, `%${commodity}%`));
      }
      
      if (vesselName) {
        conditions.push(like(shipmentCertificates.vesselName, `%${vesselName}%`));
      }
      
      if (dateFrom) {
        conditions.push(sql`${shipmentCertificates.bookingDate} >= ${new Date(dateFrom as string)}`);
      }
      
      if (dateTo) {
        conditions.push(sql`${shipmentCertificates.bookingDate} <= ${new Date(dateTo as string)}`);
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(shipmentCertificates.certificateNumber, searchTerm),
            like(shipmentCertificates.sourcePort, searchTerm),
            like(shipmentCertificates.destinationPort, searchTerm),
            like(shipmentCertificates.commodity, searchTerm),
            like(shipmentCertificates.vesselName, searchTerm),
            like(shipmentCertificates.billOfLadingNo, searchTerm)
          )
        );
      }
      
      // If insurer filter is provided, join with policies
      let query = db
        .select({
          shipment: shipmentCertificates,
          policy: {
            id: policies.id,
            policyNo: policies.policyNo,
            insurer: policies.insurer,
            policyType: policies.policyType,
          }
        })
        .from(shipmentCertificates)
        .leftJoin(policies, eq(shipmentCertificates.policyId, policies.id));
      
      if (insurer) {
        conditions.push(eq(policies.insurer, insurer as string));
      }
      
      // Get total count
      const countQuery = conditions.length > 0 
        ? query.where(and(...conditions))
        : query;
      
      const countResult = await countQuery.execute();
      const total = countResult.length;
      
      // Get paginated results
      const resultsQuery = conditions.length > 0
        ? query.where(and(...conditions))
        : query;
      
      const results = await resultsQuery
        .orderBy(desc(shipmentCertificates.bookingDate))
        .limit(limitNum)
        .offset(offset)
        .execute();
      
      res.json({
        data: results.map(r => ({
          ...r.shipment,
          policy: r.policy
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error("Error fetching shipments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch shipments" });
    }
  });

  // Get all claims (global view)
  app.get('/api/claims', async (req, res) => {
    try {
      const {
        status,
        lossType,
        insurer,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        search,
        page = '1',
        limit = '50'
      } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      // Build where conditions
      const conditions = [];
      
      if (status) {
        conditions.push(eq(claims.status, status as string));
      }
      
      if (lossType) {
        conditions.push(eq(claims.lossType, lossType as string));
      }
      
      if (dateFrom) {
        conditions.push(gte(claims.incidentDate, new Date(dateFrom as string)));
      }
      
      if (dateTo) {
        conditions.push(lte(claims.incidentDate, new Date(dateTo as string)));
      }
      
      if (minAmount) {
        conditions.push(sql`CAST(${claims.claimedAmount} AS DECIMAL) >= ${parseFloat(minAmount as string)}`);
      }
      
      if (maxAmount) {
        conditions.push(sql`CAST(${claims.claimedAmount} AS DECIMAL) <= ${parseFloat(maxAmount as string)}`);
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          or(
            like(claims.claimNumber, searchTerm),
            like(claims.incidentDescription, searchTerm),
            like(claims.claimant, searchTerm),
            like(claims.affectedCommodity, searchTerm),
            like(claims.vesselName, searchTerm)
          )
        );
      }
      
      // Join with policies and shipments
      let query = db
        .select({
          claim: claims,
          policy: {
            id: policies.id,
            policyNo: policies.policyNo,
            insurer: policies.insurer,
          },
          shipment: {
            id: shipmentCertificates.id,
            certificateNumber: shipmentCertificates.certificateNumber,
          }
        })
        .from(claims)
        .leftJoin(policies, eq(claims.policyId, policies.id))
        .leftJoin(shipmentCertificates, eq(claims.shipmentId, shipmentCertificates.id));
      
      if (insurer) {
        conditions.push(eq(policies.insurer, insurer as string));
      }
      
      // Get total count
      const countQuery = conditions.length > 0 
        ? query.where(and(...conditions))
        : query;
      
      const countResult = await countQuery.execute();
      const total = countResult.length;
      
      // Get paginated results
      const resultsQuery = conditions.length > 0
        ? query.where(and(...conditions))
        : query;
      
      const results = await resultsQuery
        .orderBy(desc(claims.incidentDate))
        .limit(limitNum)
        .offset(offset)
        .execute();
      
      res.json({
        data: results.map(r => ({
          ...r.claim,
          policy: r.policy,
          shipment: r.shipment
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ message: error.message || "Failed to fetch claims" });
    }
  });

  // Get claims for a specific policy
  app.get('/api/policies/:policyId/claims', async (req, res) => {
    try {
      const { policyId } = req.params;
      
      const results = await db
        .select({
          claim: claims,
          shipment: {
            id: shipmentCertificates.id,
            certificateNumber: shipmentCertificates.certificateNumber,
          }
        })
        .from(claims)
        .leftJoin(shipmentCertificates, eq(claims.shipmentId, shipmentCertificates.id))
        .where(eq(claims.policyId, policyId))
        .orderBy(desc(claims.incidentDate))
        .execute();
      
      res.json(results.map(r => ({
        ...r.claim,
        shipment: r.shipment
      })));
    } catch (error: any) {
      console.error("Error fetching policy claims:", error);
      res.status(500).json({ message: error.message || "Failed to fetch policy claims" });
    }
  });

  // Get claims for a specific shipment
  app.get('/api/shipments/:shipmentId/claims', async (req, res) => {
    try {
      const { shipmentId } = req.params;
      
      const results = await db
        .select()
        .from(claims)
        .where(eq(claims.shipmentId, shipmentId))
        .orderBy(desc(claims.incidentDate))
        .execute();
      
      res.json(results);
    } catch (error: any) {
      console.error("Error fetching shipment claims:", error);
      res.status(500).json({ message: error.message || "Failed to fetch shipment claims" });
    }
  });

  // Create new claim
  app.post('/api/claims', async (req, res) => {
    try {
      const validated = insertClaimSchema.parse(req.body);
      
      const result = await db
        .insert(claims)
        .values(validated)
        .returning();
      
      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error("Error creating claim:", error);
      res.status(400).json({ message: error.message || "Failed to create claim" });
    }
  });

  // Get single claim
  app.get('/api/claims/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .select({
          claim: claims,
          policy: {
            id: policies.id,
            policyNo: policies.policyNo,
            insurer: policies.insurer,
          },
          shipment: {
            id: shipmentCertificates.id,
            certificateNumber: shipmentCertificates.certificateNumber,
            sourcePort: shipmentCertificates.sourcePort,
            destinationPort: shipmentCertificates.destinationPort,
          }
        })
        .from(claims)
        .leftJoin(policies, eq(claims.policyId, policies.id))
        .leftJoin(shipmentCertificates, eq(claims.shipmentId, shipmentCertificates.id))
        .where(eq(claims.id, id))
        .limit(1);
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Claim not found' });
      }
      
      res.json({
        ...result[0].claim,
        policy: result[0].policy,
        shipment: result[0].shipment
      });
    } catch (error: any) {
      console.error("Error fetching claim:", error);
      res.status(500).json({ message: error.message || "Failed to fetch claim" });
    }
  });

  // Update claim
  app.patch('/api/claims/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .update(claims)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(claims.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Claim not found' });
      }
      
      res.json(result[0]);
    } catch (error: any) {
      console.error("Error updating claim:", error);
      res.status(400).json({ message: error.message || "Failed to update claim" });
    }
  });

  // Delete claim
  app.delete('/api/claims/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await db
        .delete(claims)
        .where(eq(claims.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: 'Claim not found' });
      }
      
      res.json({ message: 'Claim deleted successfully' });
    } catch (error: any) {
      console.error("Error deleting claim:", error);
      res.status(500).json({ message: error.message || "Failed to delete claim" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
