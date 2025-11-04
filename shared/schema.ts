import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  riskScore: integer("risk_score").notNull(),
  weatherRisk: integer("weather_risk").notNull(),
  piracyRisk: integer("piracy_risk").notNull(),
  trafficRisk: integer("traffic_risk").notNull(),
  claimsRisk: integer("claims_risk").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const waypoints = pgTable("waypoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").notNull().references(() => routes.id, { onDelete: 'cascade' }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  sequence: integer("sequence").notNull(),
});

export const alertConfigs = pgTable("alert_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  enabled: boolean("enabled").notNull().default(true),
  threshold: integer("threshold").notNull().default(75),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const policies = pgTable("policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  policyNo: varchar("policy_no").notNull().unique(),
  policyType: varchar("policy_type").notNull(),
  policyName: varchar("policy_name").notNull(),
  underwritingYear: integer("underwriting_year").notNull(),
  
  insurer: varchar("insurer").notNull(),
  assured: varchar("assured").notNull(),
  broker: varchar("broker"),
  
  effectiveDate: timestamp("effective_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status").notNull().default('Active'),
  
  currency: varchar("currency").notNull().default('USD'),
  sumInsured: decimal("sum_insured", { precision: 15, scale: 2 }).notNull(),
  premium: decimal("premium", { precision: 15, scale: 2 }).notNull(),
  deductible: decimal("deductible", { precision: 15, scale: 2 }),
  
  coverageTerritory: varchar("coverage_territory").notNull(),
  coverageDetails: jsonb("coverage_details"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const policyRouteLinks = pgTable("policy_route_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  policyId: varchar("policy_id").notNull().references(() => policies.id, { onDelete: 'cascade' }),
  routeId: varchar("route_id").notNull().references(() => routes.id, { onDelete: 'cascade' }),
  linkedAt: timestamp("linked_at").defaultNow(),
});

// Zod schemas
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Schema for route creation request (client -> server)
export const createRouteRequestSchema = z.object({
  name: z.string().min(1),
  waypoints: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).min(2),
});

// Schema for full route insertion (server-side)
export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  waypoints: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })),
});

export const insertAlertConfigSchema = createInsertSchema(alertConfigs).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export const insertPolicySchema = createInsertSchema(policies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPolicyRouteLinkSchema = createInsertSchema(policyRouteLinks).omit({
  id: true,
  linkedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type Waypoint = typeof waypoints.$inferSelect;
export type AlertConfig = typeof alertConfigs.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type PolicyRouteLink = typeof policyRouteLinks.$inferSelect;
export type CreateRouteRequest = z.infer<typeof createRouteRequestSchema>;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type InsertAlertConfig = z.infer<typeof insertAlertConfigSchema>;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type InsertPolicyRouteLink = z.infer<typeof insertPolicyRouteLinkSchema>;
