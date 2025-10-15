# VoyageRisk360 Design Guidelines

## Design Approach

**Selected Approach**: Design System (Carbon Design System) with Maritime Professional Theming

**Justification**: VoyageRisk360 is a data-intensive, utility-focused application for maritime professionals requiring clear information hierarchy, robust data visualization, and professional reliability. Carbon Design System excels at data-heavy enterprise applications with complex dashboards and analytics.

**Key Design Principles**:
- Clarity over decoration - every visual element serves data communication
- Maritime professional aesthetics - inspire confidence and expertise
- Map-first interface - support primary interaction model
- Layered information architecture - reveal complexity progressively

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**:
- Background Primary: `220 25% 12%` (deep navy)
- Background Secondary: `220 20% 16%` (slightly lighter navy)
- Background Elevated: `220 22% 20%` (panel backgrounds)
- Text Primary: `210 20% 98%` (near white)
- Text Secondary: `210 15% 70%` (muted blue-gray)
- Border/Divider: `220 20% 25%` (subtle separation)

**Brand & Risk Colors**:
- Primary (Ocean): `200 85% 45%` (deep cyan-blue)
- Primary Hover: `200 85% 55%`
- Success/Low Risk: `142 76% 36%` (maritime green)
- Warning/Medium Risk: `38 92% 50%` (amber)
- Danger/High Risk: `0 84% 60%` (alert red)
- Critical Risk: `0 90% 45%` (darker red)

**Risk Heatmap Gradient** (Low to Critical):
- Low: `142 76% 36%`
- Medium-Low: `160 60% 45%`
- Medium: `38 92% 50%`
- Medium-High: `20 90% 55%`
- High: `0 84% 60%`
- Critical: `0 90% 35%`

**Data Visualization** (for charts/layers):
- Weather: `210 100% 60%` (sky blue)
- Piracy: `340 82% 52%` (crimson)
- Traffic: `45 93% 47%` (golden amber)
- Claims: `280 67% 58%` (purple)

### B. Typography

**Font Families**:
- Primary: 'Inter', system-ui, sans-serif (UI text, data labels)
- Monospace: 'JetBrains Mono', 'Courier New', monospace (coordinates, risk scores)

**Type Scale**:
- Display (Dashboard Headers): text-3xl font-bold (30px)
- H1 (Section Titles): text-2xl font-semibold (24px)
- H2 (Subsections): text-xl font-semibold (20px)
- H3 (Card Headers): text-lg font-medium (18px)
- Body: text-base (16px)
- Small/Labels: text-sm (14px)
- Tiny/Metadata: text-xs (12px)

**Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing: p-2, gap-2 (component internals)
- Standard spacing: p-4, gap-4, m-4 (cards, buttons)
- Section spacing: p-6, py-8 (panels, modals)
- Page spacing: p-8, gap-12 (main layout)
- Large spacing: py-16 (section separators)

**Grid System**:
- Map area: Full viewport height minus header (primary focus)
- Sidebar panels: 320px-400px width (collapsible)
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Data tables: Full width with horizontal scroll
- Modals: max-w-2xl to max-w-4xl (based on content)

### D. Component Library

**Navigation**:
- Top app bar: h-16, dark navy background, logo left, user menu right
- Secondary navigation tabs: below app bar for main sections (Routes, Dashboard, History, Settings)
- Breadcrumbs: for route/location navigation

**Map Interface**:
- Full-screen map canvas with floating controls
- Layer toggle panel (right side, collapsible)
- Drawing tools toolbar (top-left overlay)
- Risk legend panel (bottom-right, always visible)
- Route info card (draggable, semi-transparent dark backdrop with blur)

**Cards & Panels**:
- Risk Score Card: Large numerical display with color-coded background, breakdown chart
- Route Summary Card: Rounded corners (rounded-lg), p-6, elevated shadow
- Alert Configuration Panel: Glass morphism effect (backdrop-blur-md, bg-opacity-80)
- Layer Control Cards: Compact, icon + label, toggle switch

**Forms & Inputs**:
- Text inputs: Dark background (bg-[220_22%_20%]), border (border-[220_20%_30%]), rounded-md, focus:ring-2 focus:ring-primary
- Select dropdowns: Same styling as text inputs, chevron icon
- Checkboxes/Toggles: Primary color when active, gray when inactive
- Date/Time pickers: Dark themed with calendar overlay

**Buttons**:
- Primary: bg-primary, text-white, rounded-md, px-6 py-2.5, font-medium
- Secondary: border-2 border-primary, text-primary, transparent bg
- Danger: bg-danger variant for critical actions
- Icon buttons: p-2, rounded-md, hover:bg-opacity-10

**Data Display**:
- Risk Meter: Horizontal bar chart with gradient fill
- Score Display: Monospace font, large size (text-4xl), color-coded
- Data Tables: Striped rows, sticky header, sortable columns
- Charts: Use Chart.js with dark theme, matching color palette

**Overlays & Modals**:
- Modal backdrop: bg-black/60 with backdrop-blur-sm
- Modal container: bg-[220_20%_16%], rounded-lg, shadow-2xl, max-h-[90vh]
- Toast notifications: Top-right, slide-in animation, auto-dismiss
- Alert dialogs: Centered, with clear action buttons

**Risk Visualization**:
- Heatmap overlay: Semi-transparent colored regions on map
- Route line: Solid line with gradient based on risk segments
- Waypoint markers: Circular pins with risk color border
- Risk zones: Shaded polygons with opacity based on severity

### E. Interactions & Animations

**Use Sparingly**:
- Map transitions: Smooth pan/zoom (300ms ease-in-out)
- Panel slide-in: Transform translate (250ms)
- Risk score counter: Animated number increment on load
- Hover states: Subtle opacity/scale changes (150ms)

**No animations for**:
- Heatmap rendering
- Layer toggles
- Form interactions
- Data updates

---

## Page-Specific Layouts

### Dashboard View
- Top: App bar with route selector dropdown
- Left sidebar (collapsible): Saved routes list, quick filters
- Main area: 3-column grid of risk summary cards (weather, piracy, traffic, claims)
- Bottom: Recent alerts panel

### Map Interface (Primary View)
- Full-screen map canvas
- Top-left: Drawing tools (line, polygon, import)
- Top-right: Layer controls panel (weather/piracy/traffic/claims toggles)
- Bottom-left: Route details card (draggable)
- Bottom-right: Risk legend with color scale

### Route History
- Table layout with columns: Route Name, Date, Risk Score, Actions
- Filters: date range, risk level, alert status
- Bulk actions: export, delete

### Export Modal
- Split layout: Left (format selection, options), Right (preview)
- Download button prominent at bottom-right

---

## Images

**No hero images** - This is a professional data tool, not a marketing site. However, use:
- Empty state illustrations: Simple line art of ships/maps when no routes exist
- Onboarding graphics: Minimal icons showing feature benefits
- Map markers: Custom SVG icons for risk indicators
- Logo: Maritime themed (anchor or compass rose with modern tech aesthetic)

**Icon Usage**: Font Awesome via CDN for UI icons (map, chart, download, alert, layers)