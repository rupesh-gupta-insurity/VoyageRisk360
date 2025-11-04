# VoyageRisk360 - Maritime Route Risk Assessment Platform

## Overview

VoyageRisk360 is a **public demo application** for maritime route risk assessment. The platform combines interactive mapping, risk analysis, and data visualization to help users explore maritime voyage risks through simulated weather, piracy, traffic density, and historical claims data.

The application features a map-first interface where users can draw routes, visualize multi-layer risk heatmaps, and receive comprehensive risk scores. All data is stored locally in the browser using localStorage, making it perfect for demonstrations and proof-of-concept scenarios.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 4, 2025
- **📦 Shipment Certificates Global View**:
  - **Dedicated Shipments page** - Browse all 192 shipments across 50 policies in one place
  - **Comprehensive filtering** - Filter by status, insurer, source/destination port, commodity, vessel name, date range, and full-text search
  - **Advanced filter panel** - Collapsible panel with 8+ filter criteria for precise searching
  - **Policy integration** - Each shipment links back to its parent policy for easy navigation
  - **Pagination** - Shows 50 shipments per page with total count
  - **Navigation** - Added Shipments link to all page headers (Dashboard, Policies, Shipments)
- **Implementation Details**:
  - Created `/api/shipments` endpoint with comprehensive filtering (status, ports, commodity, vessel, dates, insurer, search)
  - Built `client/src/pages/Shipments.tsx` with filterable table and advanced filter panel
  - Added route `/shipments` to App.tsx
  - Backend joins shipments with policies to enable insurer filtering and display policy info
  - Table displays: certificate number, policy, route, commodity, vessel, dates, insured amount, status
- **Testing**:
  - End-to-end shipment filtering working across all criteria
  - Policy links navigation verified
  - Filter combinations tested successfully

### October 26, 2025
- **🌐 Real Maritime API Integration**:
  - **Open-Meteo Marine Weather API** - Real-time wave heights, sea surface temperature, ocean currents
  - **AISstream.io WebSocket API** - Live vessel traffic density from global AIS data
  - **Nominatim Geocoding** - Address-to-coordinate conversion for route planning
  - **AddressLookup Component** - Search-based route creation with autocomplete suggestions
  - **Graceful Fallback** - Automatically falls back to simulated data when APIs unavailable
- **Implementation Details**:
  - Created `server/services/weatherService.ts` for marine weather data
  - Created `server/services/trafficService.ts` for AIS vessel tracking
  - Created `server/services/geocodingService.ts` for address lookups
  - Updated risk engine to async with real API data integration
  - Added `/api/geocode` and `/api/route-endpoints` endpoints
  - Fixed AddressLookup debounce bug with separate timeout refs
  - Address-based routes create straight-line paths (future: maritime routing API)
- **Testing**:
  - Real weather data successfully integrated with fallback
  - Live vessel traffic density working via WebSocket
  - Address lookup with autocomplete functional
  - End-to-end workflow verified

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
- Address-based route planning with geocoding search and autocomplete
- Multi-layer risk heatmap visualization (toggleable layers)
- Real-time risk score calculation display with live maritime data
- Route management (save, load, delete, export)
- Alert configuration interface
- PDF and CSV export functionality (jsPDF, PapaParse)

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for REST API
- **Risk Calculation:** Server-side risk scoring engine

**API Design:**
- Minimal API surface - risk calculation and geocoding endpoints
- POST `/api/calculate-risk` - Calculates risk scores for route waypoints using real maritime data
- GET `/api/geocode` - Converts address strings to coordinates via Nominatim
- GET `/api/route-endpoints` - Returns major port coordinates for quick route planning
- GET `/api/health` - Health check endpoint
- No authentication required
- Request validation using Zod schemas

**Core Services:**
- **Risk Engine (`server/riskEngine.ts`):** Async risk calculation using real maritime APIs with graceful fallback to simulated data. Integrates weather, vessel traffic, and risk zone data.
- **Weather Service (`server/services/weatherService.ts`):** Fetches real-time marine weather (wave heights, temperature) from Open-Meteo Marine API with OpenWeatherMap backup
- **Traffic Service (`server/services/trafficService.ts`):** Queries live vessel density via AISstream.io WebSocket API using AIS data
- **Geocoding Service (`server/services/geocodingService.ts`):** Converts addresses to coordinates using Nominatim API with proper rate limiting and attribution
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

**Active API Integrations:**
- **Open-Meteo Marine Weather API:** Free, no API key required. Provides real-time wave heights, sea surface temperature, ocean currents, and swell data. Automatically handles rate limiting.
- **AISstream.io WebSocket API:** Free tier available with GitHub signup. Provides live global vessel AIS data for traffic density calculation. Requires `AISSTREAM_API_KEY` environment variable.
- **Nominatim Geocoding (OpenStreetMap):** Free, no API key required. Converts addresses to coordinates for route planning. Requires User-Agent header per usage policy.
- **OpenStreetMap Tiles:** Map tile provider for Leaflet base maps

**Fallback Strategy:**
- All maritime APIs (weather, traffic) gracefully fall back to simulated data if unavailable or rate-limited
- Fallback is logged for transparency but doesn't disrupt user experience
- Simulated data uses realistic risk zones (Gulf of Aden piracy, monsoon regions, major shipping lanes)

**Planned Future Integrations:**
- **OpenWeatherMap API:** Backup weather provider (currently integrated as fallback)
- **Maritime Routing API:** Replace straight-line routes with realistic maritime paths
- **IMB Piracy Reporting Centre:** Real-time piracy incident data
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

**Environment Variables:**
- `AISSTREAM_API_KEY` - Optional, for live vessel traffic data (free tier via GitHub signup)
- `DATABASE_URL` - PostgreSQL connection (not currently used for demo app)
- `SESSION_SECRET` - Session encryption (not used in public demo mode)