import { useState } from 'react';
import MapView from '@/components/MapView';
import RiskScoreCard from '@/components/RiskScoreCard';
import LayerControl from '@/components/LayerControl';
import RouteList from '@/components/RouteList';
import AlertConfig from '@/components/AlertConfig';
import DrawingTools from '@/components/DrawingTools';
import RiskLegend from '@/components/RiskLegend';
import SaveRouteDialog from '@/components/SaveRouteDialog';
import ThemeToggle from '@/components/ThemeToggle';
import { Ship } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

//todo: remove mock functionality
interface Route {
  id: string;
  name: string;
  waypoints: Array<{ lat: number; lng: number }>;
  riskScore: number;
  weather: number;
  piracy: number;
  traffic: number;
  claims: number;
  createdAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      name: 'Singapore to Rotterdam',
      waypoints: [
        { lat: 1.3521, lng: 103.8198 },
        { lat: 15.0, lng: 65.0 },
        { lat: 25.0, lng: 55.0 },
        { lat: 51.9244, lng: 4.4777 },
      ],
      riskScore: 65,
      weather: 45,
      piracy: 75,
      traffic: 60,
      claims: 55,
      createdAt: '2024-10-15',
    },
    {
      id: '2',
      name: 'Shanghai to Los Angeles',
      waypoints: [
        { lat: 31.2304, lng: 121.4737 },
        { lat: 35.0, lng: 160.0 },
        { lat: 34.0522, lng: -118.2437 },
      ],
      riskScore: 42,
      weather: 35,
      piracy: 25,
      traffic: 55,
      claims: 35,
      createdAt: '2024-10-14',
    },
  ]);

  const [selectedRoute, setSelectedRoute] = useState<string | null>('1');
  const [layers, setLayers] = useState({
    weather: true,
    piracy: false,
    traffic: false,
    claims: false,
  });
  const [alertConfig, setAlertConfig] = useState({
    threshold: 75,
    enabled: true,
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempWaypoints, setTempWaypoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const currentRoute = routes.find((r) => r.id === selectedRoute);

  const handleLayerToggle = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleRouteCreate = (waypoints: Array<{ lat: number; lng: number }>) => {
    if (waypoints.length >= 2) {
      setTempWaypoints(waypoints);
      setShowSaveDialog(true);
    }
  };

  const handleSaveRoute = (name: string) => {
    //todo: remove mock functionality - calculate real risk scores
    const newRoute: Route = {
      id: Date.now().toString(),
      name,
      waypoints: tempWaypoints,
      riskScore: Math.floor(Math.random() * 100),
      weather: Math.floor(Math.random() * 100),
      piracy: Math.floor(Math.random() * 100),
      traffic: Math.floor(Math.random() * 100),
      claims: Math.floor(Math.random() * 100),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setRoutes((prev) => [...prev, newRoute]);
    setSelectedRoute(newRoute.id);
    setTempWaypoints([]);
    setShowSaveDialog(false);

    if (alertConfig.enabled && newRoute.riskScore > alertConfig.threshold) {
      toast({
        title: 'High Risk Alert!',
        description: `Route "${name}" exceeds risk threshold (${newRoute.riskScore}%)`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Route Saved',
        description: `"${name}" has been saved successfully`,
      });
    }
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    if (selectedRoute === id) {
      setSelectedRoute(routes.length > 1 ? routes[0].id : null);
    }
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
    doc.text(`Weather Risk: ${route.weather}%`, 20, 60);
    doc.text(`Piracy Risk: ${route.piracy}%`, 20, 70);
    doc.text(`Traffic Risk: ${route.traffic}%`, 20, 80);
    doc.text(`Claims Risk: ${route.claims}%`, 20, 90);
    doc.text(`Date: ${route.createdAt}`, 20, 100);
    
    doc.save(`${route.name.replace(/\s/g, '_')}_risk_report.pdf`);
    
    toast({
      title: 'PDF Exported',
      description: 'Risk report has been downloaded',
    });
  };

  const handleExportCSV = (id: string) => {
    const route = routes.find((r) => r.id === id);
    if (!route) return;

    const data = [
      { Category: 'Overall', Score: route.riskScore },
      { Category: 'Weather', Score: route.weather },
      { Category: 'Piracy', Score: route.piracy },
      { Category: 'Traffic', Score: route.traffic },
      { Category: 'Claims', Score: route.claims },
    ];

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${route.name.replace(/\s/g, '_')}_risk_data.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV Exported',
      description: 'Risk data has been downloaded',
    });
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <Ship className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">VoyageRisk360</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r p-4 space-y-4 overflow-y-auto">
          <RouteList
            routes={routes}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
            onDeleteRoute={handleDeleteRoute}
            onExportRoute={handleExportPDF}
          />

          {currentRoute && (
            <RiskScoreCard
              overall={currentRoute.riskScore}
              weather={currentRoute.weather}
              piracy={currentRoute.piracy}
              traffic={currentRoute.traffic}
              claims={currentRoute.claims}
            />
          )}

          <LayerControl layers={layers} onLayerToggle={handleLayerToggle} />

          <AlertConfig
            threshold={alertConfig.threshold}
            enabled={alertConfig.enabled}
            onThresholdChange={(threshold) =>
              setAlertConfig((prev) => ({ ...prev, threshold }))
            }
            onEnabledChange={(enabled) =>
              setAlertConfig((prev) => ({ ...prev, enabled }))
            }
            onSave={() => {
              toast({
                title: 'Alert Configuration Saved',
                description: `Alerts ${alertConfig.enabled ? 'enabled' : 'disabled'} at ${alertConfig.threshold}% threshold`,
              });
            }}
          />
        </aside>

        <main className="flex-1 relative">
          <MapView
            routes={routes}
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
