import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import MapView from '@/components/MapView';
import RiskScoreCard from '@/components/RiskScoreCard';
import LayerControl from '@/components/LayerControl';
import RouteList from '@/components/RouteList';
import AlertConfig from '@/components/AlertConfig';
import DrawingTools from '@/components/DrawingTools';
import RiskLegend from '@/components/RiskLegend';
import SaveRouteDialog from '@/components/SaveRouteDialog';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Ship, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

interface Route {
  id: string;
  name: string;
  riskScore: number;
  weatherRisk: number;
  piracyRisk: number;
  trafficRisk: number;
  claimsRisk: number;
  createdAt: string;
  waypoints: Array<{ 
    latitude: string;
    longitude: string;
    sequence: number;
  }>;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [layers, setLayers] = useState({
    weather: true,
    piracy: false,
    traffic: false,
    claims: false,
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempWaypoints, setTempWaypoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  const { data: routes = [], isLoading: routesLoading } = useQuery<Route[]>({
    queryKey: ['/api/routes'],
    enabled: !!user,
  });

  const { data: alertConfig } = useQuery<{ enabled: boolean; threshold: number }>({
    queryKey: ['/api/alert-config'],
    enabled: !!user,
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data: { name: string; waypoints: Array<{ latitude: number; longitude: number }> }) => {
      const res = await apiRequest('POST', '/api/routes', data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      setSelectedRoute(data.route.id);
      setTempWaypoints([]);
      setShowSaveDialog(false);

      if (alertConfig?.enabled && data.route.riskScore > alertConfig.threshold) {
        toast({
          title: 'High Risk Alert!',
          description: `Route exceeds risk threshold (${data.route.riskScore}%)`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Route Saved',
          description: 'Route has been saved successfully',
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to save route',
        variant: 'destructive',
      });
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/routes/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: 'Route Deleted',
        description: 'Route has been removed',
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to delete route',
        variant: 'destructive',
      });
    },
  });

  const updateAlertConfigMutation = useMutation({
    mutationFn: async (config: { enabled: boolean; threshold: number }) => {
      const res = await apiRequest('POST', '/api/alert-config', config);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-config'] });
      toast({
        title: 'Alert Configuration Saved',
        description: 'Your alert settings have been updated',
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to save alert configuration',
        variant: 'destructive',
      });
    },
  });

  const currentRoute = routes.find((r) => r.id === selectedRoute);

  const handleLayerToggle = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleRouteCreate = useCallback((waypoints: Array<{ lat: number; lng: number }>) => {
    if (waypoints.length >= 2) {
      setTempWaypoints(waypoints);
      setShowSaveDialog(true);
    } else {
      toast({
        title: 'Insufficient Waypoints',
        description: 'Please add at least 2 waypoints to create a route',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSaveRoute = (name: string) => {
    createRouteMutation.mutate({
      name,
      waypoints: tempWaypoints.map(wp => ({ latitude: wp.lat, longitude: wp.lng })),
    });
  };

  const handleDeleteRoute = (id: string) => {
    if (selectedRoute === id) {
      setSelectedRoute(routes.length > 1 ? routes[0].id : null);
    }
    deleteRouteMutation.mutate(id);
  };

  const handleExportPDF = (id: string) => {
    const route = routes.find((r) => r.id === id);
    if (!route) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('VoyageRisk360 - Route Risk Assessment', 20, 20);
    doc.setFontSize(12);
    doc.text(`Route: ${route.name}`, 20, 40);
    doc.text(`Overall Risk Score: ${route.riskScore}%`, 20, 50);
    doc.text(`Weather Risk: ${route.weatherRisk}%`, 20, 60);
    doc.text(`Piracy Risk: ${route.piracyRisk}%`, 20, 70);
    doc.text(`Traffic Risk: ${route.trafficRisk}%`, 20, 80);
    doc.text(`Claims Risk: ${route.claimsRisk}%`, 20, 90);
    doc.text(`Date: ${new Date(route.createdAt).toLocaleDateString()}`, 20, 100);
    
    doc.save(`${route.name.replace(/\s/g, '_')}_risk_report.pdf`);
    
    toast({
      title: 'PDF Exported',
      description: 'Risk report has been downloaded',
    });
  };

  const formattedRoutes = routes.map(route => ({
    ...route,
    waypoints: route.waypoints.map(wp => ({
      lat: parseFloat(wp.latitude),
      lng: parseFloat(wp.longitude),
    })),
    createdAt: new Date(route.createdAt).toLocaleDateString(),
  }));

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <Ship className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">VoyageRisk360</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild data-testid="button-logout">
            <a href="/api/logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </a>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r p-4 space-y-4 overflow-y-auto">
          <RouteList
            routes={formattedRoutes}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
            onDeleteRoute={handleDeleteRoute}
            onExportRoute={handleExportPDF}
          />

          {currentRoute && (
            <RiskScoreCard
              overall={currentRoute.riskScore}
              weather={currentRoute.weatherRisk}
              piracy={currentRoute.piracyRisk}
              traffic={currentRoute.trafficRisk}
              claims={currentRoute.claimsRisk}
            />
          )}

          <LayerControl layers={layers} onLayerToggle={handleLayerToggle} />

          <AlertConfig
            threshold={alertConfig?.threshold ?? 75}
            enabled={alertConfig?.enabled ?? true}
            onThresholdChange={(threshold) => {
              updateAlertConfigMutation.mutate({
                enabled: alertConfig?.enabled ?? true,
                threshold,
              });
            }}
            onEnabledChange={(enabled) => {
              updateAlertConfigMutation.mutate({
                enabled,
                threshold: alertConfig?.threshold ?? 75,
              });
            }}
            onSave={() => {
              // Already handled in mutations
            }}
          />
        </aside>

        <main className="flex-1 relative">
          <MapView
            routes={formattedRoutes}
            selectedRoute={selectedRoute}
            onRouteSelect={setSelectedRoute}
            layers={layers}
            isDrawing={isDrawing}
            onRouteCreate={handleRouteCreate}
          />

          <div className="absolute top-4 left-4 z-[1000]">
            <DrawingTools
              isDrawing={isDrawing}
              onStartDrawing={() => setIsDrawing(true)}
              onFinishDrawing={() => setIsDrawing(false)}
              onCancelDrawing={() => {
                setIsDrawing(false);
                setTempWaypoints([]);
              }}
            />
          </div>

          <div className="absolute bottom-4 right-4 z-[1000]">
            <RiskLegend />
          </div>
        </main>
      </div>

      <SaveRouteDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveRoute}
      />
    </div>
  );
}
