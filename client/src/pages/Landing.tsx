import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Ship, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Package,
  Activity,
  Calculator,
  Map as MapIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Cloud,
  Anchor,
  Navigation,
  Shield
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import type { Claim, ShipmentCertificate } from '@shared/schema';

interface PlatformStats {
  totalPolicies: number;
  totalShipments: number;
  totalClaims: number;
  activeShipments: number;
  settledClaims: number;
  totalInsuredValue: number;
  totalSettledAmount: number;
}

interface RiskScore {
  overall: number;
  weather: number;
  piracy: number;
  traffic: number;
  claims: number;
}

const POPULAR_ROUTES = [
  {
    id: 'singapore-rotterdam',
    name: 'Singapore → Rotterdam',
    waypoints: [
      { latitude: 1.29, longitude: 103.85, sequence: 0 },
      { latitude: 51.92, longitude: 4.48, sequence: 1 }
    ]
  },
  {
    id: 'shanghai-los-angeles',
    name: 'Shanghai → Los Angeles',
    waypoints: [
      { latitude: 31.23, longitude: 121.47, sequence: 0 },
      { latitude: 33.74, longitude: -118.27, sequence: 1 }
    ]
  },
  {
    id: 'dubai-mumbai',
    name: 'Dubai → Mumbai',
    waypoints: [
      { latitude: 25.27, longitude: 55.30, sequence: 0 },
      { latitude: 18.95, longitude: 72.83, sequence: 1 }
    ]
  },
  {
    id: 'hong-kong-sydney',
    name: 'Hong Kong → Sydney',
    waypoints: [
      { latitude: 22.32, longitude: 114.17, sequence: 0 },
      { latitude: -33.87, longitude: 151.21, sequence: 1 }
    ]
  },
  {
    id: 'suez-gibraltar',
    name: 'Suez Canal → Gibraltar',
    waypoints: [
      { latitude: 29.97, longitude: 32.55, sequence: 0 },
      { latitude: 36.14, longitude: -5.35, sequence: 1 }
    ]
  },
  {
    id: 'panama-miami',
    name: 'Panama Canal → Miami',
    waypoints: [
      { latitude: 9.08, longitude: -79.68, sequence: 0 },
      { latitude: 25.76, longitude: -80.19, sequence: 1 }
    ]
  },
];

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function Landing() {
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [calculatedRisk, setCalculatedRisk] = useState<RiskScore | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activityPage, setActivityPage] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToStats = () => scrollToSection('stats-section');

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ['/api/stats'],
  });

  const { data: recentClaims } = useQuery<Claim[]>({
    queryKey: ['/api/recent-claims'],
    queryFn: async () => {
      const response = await fetch('/api/claims?page=1&limit=5');
      if (!response.ok) throw new Error('Failed to fetch claims');
      const result = await response.json();
      return result.data.map((item: any) => item);
    },
  });

  const { data: recentShipments } = useQuery<Array<ShipmentCertificate & { policy: any }>>({
    queryKey: ['/api/recent-shipments'],
    queryFn: async () => {
      const response = await fetch('/api/shipments?page=1&limit=5');
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const result = await response.json();
      return result.data;
    },
  });

  const handleCalculateRisk = useCallback(async () => {
    if (!selectedRoute) return;

    const route = POPULAR_ROUTES.find(r => r.id === selectedRoute);
    if (!route) return;

    setIsCalculating(true);
    try {
      const response = await fetch('/api/calculate-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waypoints: route.waypoints }),
      });

      if (!response.ok) throw new Error('Failed to calculate risk');
      const scores = await response.json();

      // API returns aggregated scores directly as an object
      setCalculatedRisk({
        overall: scores.overall,
        weather: scores.weather,
        piracy: scores.piracy,
        traffic: scores.traffic,
        claims: scores.claims,
      });
    } catch (error) {
      console.error('Error calculating risk:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (selectedRoute) {
      handleCalculateRisk();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['stats-section', 'calculator-section', 'activity-section', 'features-section'];
      const scrollPosition = window.scrollY + 200; // Offset for better detection

      // Show back to top button after scrolling 300px
      setShowBackToTop(window.scrollY > 300);

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-600 dark:text-green-400';
    if (risk < 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRiskLabel = (risk: number) => {
    if (risk < 30) return 'Low Risk';
    if (risk < 60) return 'Medium Risk';
    return 'High Risk';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRelativeTime = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getClaimStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Settled': 'bg-green-500/10 text-green-700 dark:text-green-400',
      'Approved': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      'Reported': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      'Investigation': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
      'Rejected': 'bg-red-500/10 text-red-700 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ship className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">VoyageRisk360</h1>
          </div>
          <Button variant="outline" asChild data-testid="button-get-started-header">
            <a href="/dashboard">Launch App</a>
          </Button>
        </div>
      </header>

      {/* Side Progress Dots */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4">
        {[
          { id: 'stats-section', label: 'Stats' },
          { id: 'calculator-section', label: 'Calculator' },
          { id: 'activity-section', label: 'Activity' },
          { id: 'features-section', label: 'Features' },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`group relative w-3 h-3 rounded-full transition-all duration-300 ${
              activeSection === section.id
                ? 'bg-primary scale-125'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
            }`}
            data-testid={`dot-${section.id}`}
            aria-label={`Navigate to ${section.label}`}
          >
            <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border">
              {section.label}
            </span>
          </button>
        ))}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-8 right-8 z-40 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          data-testid="button-back-to-top"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <Badge variant="outline" className="text-sm">
              Public Demo Platform
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold">
              Maritime Route Risk Assessment
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Make informed decisions about maritime voyages with comprehensive risk analysis
              combining weather, piracy, traffic, and historical claims data.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                variant="default" 
                onClick={scrollToStats}
                data-testid="button-see-live-data"
                className="group"
              >
                See Live Data
                <ChevronDown className="ml-2 h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <a href="/policies">Explore Demo</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Live Statistics */}
        {stats && (
          <section id="stats-section" className="bg-muted/50 py-12">
            <div className="container mx-auto px-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Live Platform Metrics</h3>
                <p className="text-muted-foreground">Real-time data from our maritime insurance platform</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <Card className="p-6 text-center hover-elevate">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1" data-testid="stat-total-policies">
                    <AnimatedCounter value={stats.totalPolicies} />
                  </div>
                  <div className="text-sm text-muted-foreground">Total Policies</div>
                </Card>

                <Card className="p-6 text-center hover-elevate">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Ship className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1" data-testid="stat-total-shipments">
                    <AnimatedCounter value={stats.totalShipments} />
                  </div>
                  <div className="text-sm text-muted-foreground">Total Shipments</div>
                </Card>

                <Card className="p-6 text-center hover-elevate">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1" data-testid="stat-active-shipments">
                    <AnimatedCounter value={stats.activeShipments} />
                  </div>
                  <div className="text-sm text-muted-foreground">In Transit</div>
                </Card>

                <Card className="p-6 text-center hover-elevate">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1" data-testid="stat-total-claims">
                    <AnimatedCounter value={stats.totalClaims} />
                  </div>
                  <div className="text-sm text-muted-foreground">Total Claims</div>
                </Card>

              </div>
            </div>
          </section>
        )}

        {/* Risk Calculator Widget */}
        <section id="calculator-section" className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Calculator className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold">Route Risk Calculator</h3>
              </div>
              <p className="text-muted-foreground">Select a popular maritime route to see instant risk analysis</p>
            </div>

            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Route</label>
                  <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                    <SelectTrigger data-testid="select-route">
                      <SelectValue placeholder="Choose a maritime route..." />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_ROUTES.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isCalculating && (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-muted-foreground">Analyzing maritime conditions...</p>
                  </div>
                )}

                {calculatedRisk && !isCalculating && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="text-center py-4">
                      <div className={`text-5xl font-bold ${getRiskColor(calculatedRisk.overall)} mb-2`} data-testid="risk-overall-score">
                        <AnimatedCounter value={calculatedRisk.overall} />
                      </div>
                      <div className="text-lg font-medium">{getRiskLabel(calculatedRisk.overall)}</div>
                      <p className="text-sm text-muted-foreground mt-1">Overall Risk Score</p>
                    </div>

                    {/* Radar Chart */}
                    <div className="bg-muted/30 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-center mb-4">Risk Factor Analysis</h4>
                      <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={[
                          { factor: 'Weather', value: calculatedRisk.weather },
                          { factor: 'Piracy', value: calculatedRisk.piracy },
                          { factor: 'Traffic', value: calculatedRisk.traffic },
                          { factor: 'Claims', value: calculatedRisk.claims },
                        ]}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis 
                            dataKey="factor" 
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            style={{ fontSize: '12px' }}
                          />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 100]} 
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            style={{ fontSize: '10px' }}
                          />
                          <Radar 
                            name="Risk Score" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))" 
                            fillOpacity={0.5}
                            animationDuration={1000}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Animated Circular Progress Indicators */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="hsl(var(--muted))"
                              strokeWidth="6"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="hsl(var(--primary))"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - calculatedRisk.weather / 100)}`}
                              className="transition-all duration-1000 ease-out"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">
                              <AnimatedCounter value={calculatedRisk.weather} />%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium">Weather</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="hsl(var(--muted))"
                              strokeWidth="6"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="hsl(var(--destructive))"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - calculatedRisk.piracy / 100)}`}
                              className="transition-all duration-1000 ease-out"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">
                              <AnimatedCounter value={calculatedRisk.piracy} />%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-destructive" />
                          <span className="text-xs font-medium">Piracy</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="hsl(var(--muted))"
                              strokeWidth="6"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="hsl(var(--chart-3))"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - calculatedRisk.traffic / 100)}`}
                              className="transition-all duration-1000 ease-out"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">
                              <AnimatedCounter value={calculatedRisk.traffic} />%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-chart-3" />
                          <span className="text-xs font-medium">Traffic</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/30">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="hsl(var(--muted))"
                              strokeWidth="6"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="hsl(var(--chart-4))"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - calculatedRisk.claims / 100)}`}
                              className="transition-all duration-1000 ease-out"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">
                              <AnimatedCounter value={calculatedRisk.claims} />%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Anchor className="w-4 h-4 text-chart-4" />
                          <span className="text-xs font-medium">Claims</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" asChild data-testid="button-create-custom-route">
                      <a href="/dashboard">Create Custom Route Analysis</a>
                    </Button>
                  </div>
                )}

                {!selectedRoute && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a route above to see risk analysis</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section id="activity-section" className="bg-muted/50 py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-bold">Live Activity Feed</h3>
                  </div>
                  <p className="text-muted-foreground">Recent platform activity</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setActivityPage(Math.max(0, activityPage - 1))}
                    disabled={activityPage === 0}
                    data-testid="button-activity-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setActivityPage(activityPage + 1)}
                    disabled={
                      (!recentClaims || recentClaims.length <= (activityPage + 1) * 3) &&
                      (!recentShipments || recentShipments.length <= (activityPage + 1) * 3)
                    }
                    data-testid="button-activity-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Claims */}
                <Card className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Recent Claims
                  </h4>
                  <div className="space-y-3">
                    {recentClaims?.slice(activityPage * 3, (activityPage + 1) * 3).map((claim, idx) => (
                      <div key={claim.id || idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate">{claim.claimNumber}</span>
                            <Badge variant="outline" className={`text-xs ${getClaimStatusColor(claim.status)}`}>
                              {claim.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{claim.lossType}</div>
                          <div className="text-xs text-muted-foreground">
                            {claim.reportedDate && getRelativeTime(claim.reportedDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent Shipments */}
                <Card className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Ship className="w-4 h-4" />
                    Recent Shipments
                  </h4>
                  <div className="space-y-3">
                    {recentShipments?.slice(activityPage * 3, (activityPage + 1) * 3).map((shipment, idx) => (
                      <div key={shipment.id || idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate">{shipment.certificateNumber}</span>
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400">
                              {shipment.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {shipment.sourcePort} → {shipment.destinationPort}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {shipment.bookingDate && getRelativeTime(shipment.bookingDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Capabilities */}
        <section id="features-section" className="container mx-auto px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-3">Complete Maritime Risk Platform</h3>
              <p className="text-muted-foreground">Everything you need to assess and manage maritime voyage risks</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 hover-elevate">
                <div className="w-14 h-14 rounded-lg bg-chart-1/10 flex items-center justify-center mb-4">
                  <MapPin className="w-7 h-7 text-chart-1" />
                </div>
                <h4 className="text-xl font-semibold mb-3">Interactive Route Mapping</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Draw custom routes with our intuitive map interface. Visualize multi-layer risk heatmaps 
                  showing weather patterns, piracy zones, traffic density, and historical claims data.
                </p>
              </Card>

              <Card className="p-8 hover-elevate">
                <div className="w-14 h-14 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-7 h-7 text-chart-2" />
                </div>
                <h4 className="text-xl font-semibold mb-3">Multi-Factor Risk Analysis</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Comprehensive risk scoring engine analyzing weather conditions, piracy threats, 
                  vessel traffic density, and historical claims to provide accurate voyage assessments.
                </p>
              </Card>

              <Card className="p-8 hover-elevate">
                <div className="w-14 h-14 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                  <Ship className="w-7 h-7 text-chart-3" />
                </div>
                <h4 className="text-xl font-semibold mb-3">Policy & Shipment Tracking</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Manage insurance policies, track shipment certificates, and monitor vessel movements 
                  in real-time with our comprehensive maritime management system.
                </p>
              </Card>

              <Card className="p-8 hover-elevate">
                <div className="w-14 h-14 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-chart-4" />
                </div>
                <h4 className="text-xl font-semibold mb-3">Claims Management</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Track and analyze maritime insurance claims from incident reporting through settlement. 
                  Access historical data to identify patterns and improve risk assessment accuracy.
                </p>
              </Card>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>VoyageRisk360 - Maritime Route Risk Assessment Platform (Demo)</p>
        </div>
      </footer>
    </div>
  );
}
