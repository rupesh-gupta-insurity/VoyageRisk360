# VoyageRisk360 - Maritime Route Risk Assessment Platform

## Overview

VoyageRisk360 is a **public demo application** for maritime route risk assessment. The platform combines interactive mapping, risk analysis, and data visualization to help users explore maritime voyage risks through simulated weather, piracy, traffic density, and historical claims data.

The application features a map-first interface where users can draw routes, visualize multi-layer risk heatmaps, and receive comprehensive risk scores. All data is stored locally in the browser using localStorage, making it perfect for demonstrations and proof-of-concept scenarios.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 15, 2025
- **🎉 Converted to Public Demo App**:
  - **Removed all authentication** - app now works without login
  - **localStorage persistence** - all routes and settings saved in browser
  - **Simplified backend** - only risk calculation endpoint remains
  - **Demo Mode badge** - clearly indicates public demo status
  - **Direct access** - "Get Started" button goes straight to dashboard
- **Implementation Details**:
  - Created `StoredRoute` type for localStorage with embedded waypoints
  - Backend reduced to `/api/calculate-risk` and `/api/health` endpoints only
  - All CRUD operations handled client-side with localStorage helpers
  - Removed: Replit Auth, session management, database user/route storage
  - Routes stored with key: `voyagerisk360_routes`
  - Alert config stored with key: `voyagerisk360_alert_config`
- **Testing**:
  - End-to-end tests passing successfully
  - Verified complete workflow: draw route → save → load → delete → export
  - Risk calculation, alerts, and PDF exports all functional

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** localStorage for client-side persistence
- **UI Components:** Radix UI primitives with shadcn/ui design system (New York variant)
- **Styling:** Tailwind CSS with custom maritime-themed design tokens
- **Mapping:** Leaflet for interactive map visualization

**Design System:**
- Dark-mode-first approach with maritime professional theming (deep navy backgrounds, ocean blue accents)
- Custom risk color gradient (low to critical: green → amber → red)
- Data visualization colors for different risk layers (weather, piracy, traffic, claims)
- Component library based on Carbon Design System principles adapted for maritime use

**Key Frontend Features:**
- Interactive map with drawing tools for route creation
- Multi-layer risk heatmap visualization (toggleable layers)
- Real-time risk score calculation display
- Route management (save, load, delete, export)
- Alert configuration interface
- PDF and CSV export functionality (jsPDF, PapaParse)

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for REST API
- **Risk Calculation:** Server-side risk scoring engine

**API Design:**
- Minimal API surface - only risk calculation endpoint
- POST `/api/calculate-risk` - Calculates risk scores for route waypoints
- GET `/api/health` - Health check endpoint
- No authentication required
- Request validation using Zod schemas

**Core Services:**
- **Risk Engine (`server/riskEngine.ts`):** Calculates risk scores based on waypoint coordinates and simulated risk zones. Uses hardcoded risk zones (Gulf of Aden for piracy, monsoon regions for weather, etc.) to demonstrate risk calculation capabilities
- **localStorage Helper (`client/src/lib/localStorage.ts`):** Client-side storage for routes and alert configuration

### Data Storage

**Storage Method:** Browser localStorage (client-side only)

**Data Structure:**

1. **Routes** (`voyagerisk360_routes`)
   ```typescript
   interface StoredRoute {
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
   ```

2. **Alert Configuration** (`voyagerisk360_alert_config`)
   ```typescript
   interface AlertConfig {
     id: string;
     userId: string;  // Always "demo-user"
     enabled: boolean;
     threshold: number;
     updatedAt: Date;
   }
   ```

**Data Flow:**
- Client draws waypoints → Sends to `/api/calculate-risk` → Server returns risk scores → Client saves complete route to localStorage
- All route CRUD operations handled entirely in browser
- Data persists only on current browser/device

### No Authentication

The application is a **public demo** with no authentication:
- **Landing page** (`/`) - Shows features and "Get Started" button
- **Dashboard** (`/dashboard`) - Main application, accessible to anyone
- **Demo Mode badge** - Displayed in header to indicate demo status
- **No user accounts** - No login, registration, or session management
- **Browser-only persistence** - Data saved in localStorage, not shared across devices

### External Dependencies

**Current Dependencies:**
- **Neon PostgreSQL:** Serverless PostgreSQL database hosting
- **Replit Auth:** Identity provider for user authentication
- **OpenStreetMap:** Map tile provider for Leaflet

**Planned Integrations (currently simulated):**
- **OpenWeatherMap API:** Real-time weather data and forecasts
- **MarineTraffic API:** Live vessel traffic density data
- **IMB Piracy Reporting Centre:** Piracy incident reports and risk zones
- **Insurance Claims Database:** Historical maritime insurance claims data

**Client Libraries:**
- Leaflet for map rendering
- jsPDF for PDF report generation
- PapaParse for CSV data export
- Various Radix UI components for accessible UI primitives

**Development Tools:**
- Replit-specific Vite plugins for development banner and cartographer
- TypeScript for type safety across frontend and backend
- Drizzle Kit for database migrations