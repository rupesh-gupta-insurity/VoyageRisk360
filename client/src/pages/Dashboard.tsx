import { useState, useEffect, useCallback, useRef } from 'react';
import MapView, { type MapViewRef } from '@/components/MapView';
import RiskScoreCard from '@/components/RiskScoreCard';
import RiskTrendChart from '@/components/RiskTrendChart';
import LayerControl from '@/components/LayerControl';
import RouteList from '@/components/RouteList';
import AlertConfig from '@/components/AlertConfig';
import DrawingTools from '@/components/DrawingTools';
import MapControls from '@/components/MapControls';
import RiskLegend from '@/components/RiskLegend';
import SaveRouteDialog from '@/components/SaveRouteDialog';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import AddressLookup from '@/components/AddressLookup';
import PageHeader from '@/components/PageHeader';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllRoutes, saveRoute, deleteRoute as deleteRouteLS, getAlertConfig, saveAlertConfig, type StoredRoute } from '@/lib/localStorage';
import jsPDF from 'jspdf';

export default function Dashboard() {
  const { toast } = useToast();
  const mapRef = useRef<MapViewRef>(null);
  
  const [routes, setRoutes] = useState<StoredRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [layers, setLayers] = useState({
    weather: true,
    piracy: false,
    traffic: false,
    claims: false,
  });
  const [layerOpacity, setLayerOpacity] = useState(50);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [tempWaypoints, setTempWaypoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [previewRiskScores, setPreviewRiskScores] = useState<{
    overall: number;
    weather: number;
    piracy: number;
    traffic: number;
    claims: number;
  } | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ enabled: true, threshold: 75 });
  const [isSaving, setIsSaving] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddressLookup, setShowAddressLookup] = useState(false);

  // Load routes and alert config from localStorage on mount
  useEffect(() => {
    setRoutes(getAllRoutes());
    setAlertConfig(getAlertConfig());
    
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('voyagerisk360_onboarding_completed');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleDismissOnboarding = () => {
    localStorage.setItem('voyagerisk360_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const currentRoute = routes.find((r) => r.id === selectedRoute);

  const handleLayerToggle = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleRouteCreate = useCallback(async (waypoints: Array<{ lat: number; lng: number }>) => {
    if (waypoints.length >= 2) {
      setTempWaypoints(waypoints);
      setShowSaveDialog(true);
      setIsSaving(true);
      setAiInsights(null);
      
      try {
        // Calculate risk scores immediately
        const response = await fetch('/api/calculate-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            waypoints: waypoints.map((wp, i) => ({
              latitude: wp.lat,
              longitude: wp.lng,
              sequence: i,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate risk');
        }

        const riskScores = await response.json();
        setPreviewRiskScores(riskScores);

        // Generate AI insights
        setIsInsightsLoading(true);
        try {
          const insightsResponse = await fetch('/api/ai-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              riskScores,
              routeInfo: {
                name: 'Custom Route',
                waypoints: waypoints.map(wp => ({
                  latitude: wp.lat,
                  longitude: wp.lng,
                })),
              },
            }),
          });

          if (insightsResponse.ok) {
            const { insights } = await insightsResponse.json();
            setAiInsights(insights);
          } else {
            setAiInsights('AI insights temporarily unavailable.');
          }
        } catch (insightsError) {
          console.error('Failed to generate AI insights:', insightsError);
          setAiInsights('AI insights temporarily unavailable.');
        } finally {
          setIsInsightsLoading(false);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to calculate risk scores',
          variant: 'destructive',
        });
        setShowSaveDialog(false);
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({
        title: 'Insufficient Waypoints',
        description: 'Please add at least 2 waypoints to create a route',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSaveRoute = async (name: string) => {
    if (!previewRiskScores) return;
    
    setIsSaving(true);
    try {
      // Save route to localStorage with waypoints
      const newRoute = saveRoute({
        name,
        waypoints: tempWaypoints.map((wp, i) => ({
          id: `${Date.now()}-${i}`,
          routeId: '', // Will be set after saving
          latitude: wp.lat.toString(),
          longitude: wp.lng.toString(),
          sequence: i,
        })),
        riskScore: previewRiskScores.overall,
        weatherRisk: previewRiskScores.weather,
        piracyRisk: previewRiskScores.piracy,
        trafficRisk: previewRiskScores.traffic,
        claimsRisk: previewRiskScores.claims,
      });

      setRoutes(getAllRoutes());
      setSelectedRoute(newRoute.id);
      setTempWaypoints([]);
      setPreviewRiskScores(null);
      setShowSaveDialog(false);

      // Check if route exceeds alert threshold
      if (alertConfig.enabled && previewRiskScores.overall > alertConfig.threshold) {
        toast({
          title: 'High Risk Alert!',
          description: `Route exceeds risk threshold (${previewRiskScores.overall}%)`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Route Saved',
          description: 'Route has been saved successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save route',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoute = (id: string) => {
    if (selectedRoute === id) {
      const remainingRoutes = routes.filter(r => r.id !== id);
      setSelectedRoute(remainingRoutes.length > 0 ? remainingRoutes[0].id : null);
    }
    deleteRouteLS(id);
    setRoutes(getAllRoutes());
    toast({
      title: 'Route Deleted',
      description: 'Route has been removed',
    });
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

  const handleUpdateAlertConfig = (config: { enabled: boolean; threshold: number }) => {
    saveAlertConfig(config);
    setAlertConfig(config);
    toast({
      title: 'Alert Configuration Saved',
      description: 'Your alert settings have been updated',
    });
  };

  const handleAddressRouteCreate = async (
    origin: { latitude: number; longitude: number; name: string },
    destination: { latitude: number; longitude: number; name: string }
  ) => {
    // Create a simple straight-line route between origin and destination
    // In a production app, you'd use a proper maritime routing API
    const waypoints = [
      { lat: origin.latitude, lng: origin.longitude },
      { lat: destination.latitude, lng: destination.longitude },
    ];

    setShowAddressLookup(false);
    
    // Use the same flow as manual drawing
    await handleRouteCreate(waypoints);
    
    toast({
      title: 'Route Created',
      description: `Route from ${origin.name.split(',')[0]} to ${destination.name.split(',')[0]}`,
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

  return (
    <div className="flex h-screen flex-col">
      <PageHeader activePage="dashboard" />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r bg-card p-4 space-y-4 overflow-y-auto">
          <RouteList
            routes={formattedRoutes}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
            onDeleteRoute={handleDeleteRoute}
            onExportRoute={handleExportPDF}
          />

          {currentRoute && (
            <>
              <RiskScoreCard
                overall={currentRoute.riskScore}
                weather={currentRoute.weatherRisk}
                piracy={currentRoute.piracyRisk}
                traffic={currentRoute.trafficRisk}
                claims={currentRoute.claimsRisk}
                alertThreshold={alertConfig.threshold}
                alertEnabled={alertConfig.enabled}
              />
              
              <RiskTrendChart
                weather={currentRoute.weatherRisk}
                piracy={currentRoute.piracyRisk}
                traffic={currentRoute.trafficRisk}
                claims={currentRoute.claimsRisk}
              />
            </>
          )}

          <LayerControl
            layers={layers}
            onLayerToggle={handleLayerToggle}
            opacity={layerOpacity}
            onOpacityChange={setLayerOpacity}
          />

          <AlertConfig
            threshold={alertConfig.threshold}
            enabled={alertConfig.enabled}
            onThresholdChange={(threshold) => {
              handleUpdateAlertConfig({ ...alertConfig, threshold });
            }}
            onEnabledChange={(enabled) => {
              handleUpdateAlertConfig({ ...alertConfig, enabled });
            }}
            onSave={() => {
              // Already handled in change handlers
            }}
          />
        </aside>

        <main className="flex-1 relative">
          <MapView
            ref={mapRef}
            routes={formattedRoutes}
            selectedRoute={selectedRoute}
            onRouteSelect={setSelectedRoute}
            layers={layers}
            layerOpacity={layerOpacity}
            isDrawing={isDrawing}
            onRouteCreate={handleRouteCreate}
            onDrawingUpdate={(count: number) => setDrawingPoints(Array(count).fill({ lat: 0, lng: 0 }))}
          />

          <div className="absolute top-4 left-4 z-[1000]">
            <DrawingTools
              isDrawing={isDrawing}
              waypointCount={drawingPoints.length}
              onStartDrawing={() => setIsDrawing(true)}
              onFinishDrawing={() => setIsDrawing(false)}
              onCancelDrawing={() => {
                setIsDrawing(false);
                setDrawingPoints([]);
                setTempWaypoints([]);
              }}
              onOpenAddressLookup={() => setShowAddressLookup(true)}
            />
          </div>

          <div className="absolute top-4 right-4 z-[1000]">
            <MapControls
              onZoomIn={() => mapRef.current?.zoomIn()}
              onZoomOut={() => mapRef.current?.zoomOut()}
              onResetView={() => mapRef.current?.resetView()}
            />
          </div>

          <div className="absolute bottom-4 right-4 z-[1000]">
            <RiskLegend />
          </div>
        </main>
      </div>

      <SaveRouteDialog
        open={showSaveDialog}
        onOpenChange={(open) => {
          setShowSaveDialog(open);
          if (!open) {
            setPreviewRiskScores(null);
            setAiInsights(null);
            setIsInsightsLoading(false);
          }
        }}
        onSave={handleSaveRoute}
        waypoints={tempWaypoints}
        riskScores={previewRiskScores}
        aiInsights={aiInsights}
        isInsightsLoading={isInsightsLoading}
        isCalculating={isSaving && !previewRiskScores}
      />

      <AddressLookup
        open={showAddressLookup}
        onOpenChange={setShowAddressLookup}
        onRouteCreate={handleAddressRouteCreate}
      />

      {showOnboarding && (
        <OnboardingOverlay onDismiss={handleDismissOnboarding} />
      )}
    </div>
  );
}
