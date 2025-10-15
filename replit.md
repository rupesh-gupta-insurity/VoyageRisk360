# VoyageRisk360 - Maritime Route Risk Assessment Platform

## Overview

VoyageRisk360 is a data-intensive web application designed for maritime professionals to assess and visualize risks along shipping routes. The platform combines interactive mapping, risk analysis, and data visualization to help users make informed decisions about maritime voyages by analyzing weather, piracy, traffic density, and historical claims data.

The application features a map-first interface where users can draw routes, visualize multi-layer risk heatmaps, and receive comprehensive risk scores for their planned voyages. Users can save routes, configure risk alerts, and export data for reporting purposes.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 15, 2025
- **✅ MVP Complete**: All core features implemented and tested
- **Authentication Domain Fix**:
  - Fixed Replit Auth to handle both `.replit.dev` and `.repl.co` domain variations
  - Passport strategies now automatically registered for both domain families
  - Prevents authentication callback failures when accessing app via different domain variants
  - Added whitespace trimming for defensive domain parsing
- **Security Fixes Applied**:
  - Fixed critical cross-tenant route access vulnerability - all route operations now properly scoped by userId
  - Fixed route deletion to verify ownership BEFORE deleting (prevents unauthorized deletion)
  - Improved error responses: 403 for unauthorized, 404 for not found, 500 for server errors
- **Schema Improvements**:
  - Separated request schema (`createRouteRequestSchema`) from database schema (`insertRouteSchema`)
  - Server now properly injects risk scores during route creation
  - Fixed validation to accept client requests without pre-calculated risk scores
- **Frontend Enhancements**:
  - Added `useCallback` to route creation handler for stable dependency in MapView
  - Improved error handling and user feedback with toast notifications
  - All components have proper `data-testid` attributes for testing
- **Testing**:
  - End-to-end tests passing successfully
  - Verified complete user workflow: login → draw route → save → delete → logout
  - Route creation, risk scoring, alerts, and exports all functional

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack Query (React Query) for server state management
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
- **Database ORM:** Drizzle ORM
- **Authentication:** Replit Auth with OpenID Connect (OIDC)
- **Session Management:** express-session with PostgreSQL session store

**API Design:**
- RESTful endpoints under `/api` namespace
- Authentication middleware protecting all data endpoints
- Request validation using Zod schemas
- Error handling middleware for consistent error responses

**Core Services:**
- **Risk Engine (`server/riskEngine.ts`):** Calculates risk scores based on waypoint coordinates and simulated risk zones. Currently uses hardcoded risk zones (Gulf of Aden for piracy, monsoon regions for weather, etc.) with plans to integrate real APIs (OpenWeatherMap, MarineTraffic, IMB Piracy Reports)
- **Storage Layer (`server/storage.ts`):** Database abstraction interface for all CRUD operations
- **Authentication (`server/replitAuth.ts`):** Handles Replit OIDC authentication flow and session management

### Data Storage

**Database:** PostgreSQL (via Neon serverless)

**Schema Design:**

1. **sessions** - Session storage table (required for Replit Auth)
   - Stores serialized session data with expiration timestamps

2. **users** - User accounts
   - Stores user profile information from OIDC provider
   - Fields: id (UUID), email, firstName, lastName, profileImageUrl, timestamps

3. **routes** - Saved maritime routes
   - Links to users via foreign key with cascade deletion
   - Stores route metadata and aggregated risk scores
   - Fields: id, userId, name, riskScore, weatherRisk, piracyRisk, trafficRisk, claimsRisk, createdAt

4. **waypoints** - Route coordinate points
   - Links to routes via foreign key with cascade deletion
   - Stores individual points with sequence ordering
   - Fields: id, routeId, latitude, longitude, sequence

5. **alert_configs** - User alert preferences
   - One-to-one relationship with users
   - Stores risk threshold and enable/disable state
   - Fields: id, userId, threshold, enabled, timestamps

**Data Flow:**
- Client sends waypoints → Server calculates risks → Saves route with risk scores → Returns complete route object with waypoints
- Risk calculations are performed server-side to maintain consistency and allow future API integration

### Authentication & Authorization

**Authentication Provider:** Replit Auth (OpenID Connect)

**Flow:**
1. Unauthenticated users see landing page
2. Login redirects to Replit OIDC provider
3. Callback creates/updates user record and establishes session
4. Session stored in PostgreSQL with 7-day TTL
5. All API routes protected with `isAuthenticated` middleware
6. Frontend queries `/api/auth/user` to determine auth state

**Session Security:**
- HTTP-only cookies
- Secure flag enabled
- Session secret from environment variable
- PostgreSQL-backed session store for scalability

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