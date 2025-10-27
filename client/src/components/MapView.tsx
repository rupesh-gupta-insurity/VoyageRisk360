import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  routes: Array<{
    id: string;
    name: string;
    waypoints: Array<{ lat: number; lng: number }>;
    riskScore: number;
  }>;
  selectedRoute: string | null;
  onRouteSelect: (routeId: string | null) => void;
  layers: {
    weather: boolean;
    piracy: boolean;
    traffic: boolean;
    claims: boolean;
  };
  isDrawing: boolean;
  onRouteCreate: (waypoints: Array<{ lat: number; lng: number }>) => void;
  onDrawingUpdate?: (pointCount: number) => void;
}

export default function MapView({
  routes,
  selectedRoute,
  onRouteSelect,
  layers,
  isDrawing,
  onRouteCreate,
  onDrawingUpdate,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const riskLayersRef = useRef<L.LayerGroup | null>(null);
  const drawingLayersRef = useRef<L.LayerGroup | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<Array<{ lat: number; lng: number }>>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([20, 60], 3);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    routeLayersRef.current = L.layerGroup().addTo(map);
    riskLayersRef.current = L.layerGroup().addTo(map);
    drawingLayersRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      routeLayersRef.current = null;
      riskLayersRef.current = null;
      drawingLayersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!routeLayersRef.current) return;

    routeLayersRef.current.clearLayers();

    routes.forEach((route) => {
      if (route.waypoints.length < 2) return;

      const color = getRiskColor(route.riskScore);
      const line = L.polyline(route.waypoints, {
        color,
        weight: route.id === selectedRoute ? 5 : 3,
        opacity: route.id === selectedRoute ? 1 : 0.7,
      });

      line.on('click', () => {
        onRouteSelect(route.id);
      });

      routeLayersRef.current?.addLayer(line);

      route.waypoints.forEach((point, index) => {
        const marker = L.circleMarker(point, {
          radius: 6,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        marker.bindPopup(`Waypoint ${index + 1}`);
        routeLayersRef.current?.addLayer(marker);
      });
    });
  }, [routes, selectedRoute, onRouteSelect]);

  useEffect(() => {
    if (!riskLayersRef.current) return;

    riskLayersRef.current.clearLayers();

    if (layers.weather) {
      const weatherZone = L.rectangle(
        [[10, 40], [30, 80]],
        { color: '#3b82f6', weight: 1, fillOpacity: 0.2 }
      );
      weatherZone.bindPopup('Storm Warning Zone');
      riskLayersRef.current.addLayer(weatherZone);
    }

    if (layers.piracy) {
      const piracyZone = L.rectangle(
        [[0, 40], [15, 60]],
        { color: '#ef4444', weight: 1, fillOpacity: 0.2 }
      );
      piracyZone.bindPopup('Piracy Risk Zone');
      riskLayersRef.current.addLayer(piracyZone);
    }

    if (layers.traffic) {
      const trafficZone = L.rectangle(
        [[25, 50], [40, 70]],
        { color: '#f59e0b', weight: 1, fillOpacity: 0.2 }
      );
      trafficZone.bindPopup('High Traffic Zone');
      riskLayersRef.current.addLayer(trafficZone);
    }

    if (layers.claims) {
      const claimsZone = L.rectangle(
        [[5, 65], [20, 85]],
        { color: '#a855f7', weight: 1, fillOpacity: 0.2 }
      );
      claimsZone.bindPopup('Historical Claims Zone');
      riskLayersRef.current.addLayer(claimsZone);
    }
  }, [layers]);

  useEffect(() => {
    if (!drawingLayersRef.current) return;

    drawingLayersRef.current.clearLayers();

    if (drawingPoints.length > 0) {
      drawingPoints.forEach((point, index) => {
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: 6,
          fillColor: '#3b82f6',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });
        marker.bindPopup(`Point ${index + 1}`);
        drawingLayersRef.current?.addLayer(marker);
      });

      if (drawingPoints.length > 1) {
        const line = L.polyline(drawingPoints, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 5',
        });
        drawingLayersRef.current?.addLayer(line);
      }
    }

    onDrawingUpdate?.(drawingPoints.length);
  }, [drawingPoints, onDrawingUpdate]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return;
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      setDrawingPoints((prev) => [...prev, newPoint]);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawing]);

  useEffect(() => {
    if (!isDrawing && drawingPoints.length > 0) {
      onRouteCreate(drawingPoints);
      setDrawingPoints([]);
      drawingLayersRef.current?.clearLayers();
    }
  }, [isDrawing, drawingPoints, onRouteCreate]);

  return <div ref={containerRef} className="w-full h-full" data-testid="map-view" />;
}

function getRiskColor(score: number): string {
  if (score < 20) return '#22c55e';
  if (score < 40) return '#84cc16';
  if (score < 60) return '#eab308';
  if (score < 80) return '#f97316';
  return '#ef4444';
}
