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
}

export default function MapView({
  routes,
  selectedRoute,
  onRouteSelect,
  layers,
  isDrawing,
  onRouteCreate,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawingPoints, setDrawingPoints] = useState<Array<{ lat: number; lng: number }>>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([20, 60], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.Rectangle) {
        map.removeLayer(layer);
      }
    });

    routes.forEach((route) => {
      if (route.waypoints.length < 2) return;

      const color = getRiskColor(route.riskScore);
      const line = L.polyline(route.waypoints, {
        color,
        weight: route.id === selectedRoute ? 5 : 3,
        opacity: route.id === selectedRoute ? 1 : 0.7,
      }).addTo(map);

      line.on('click', () => {
        onRouteSelect(route.id);
      });

      route.waypoints.forEach((point, index) => {
        const marker = L.circleMarker(point, {
          radius: 6,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(map);

        marker.bindPopup(`Waypoint ${index + 1}`);
      });
    });

    if (layers.weather) {
      const weatherZone = L.rectangle(
        [[10, 40], [30, 80]],
        { color: '#3b82f6', weight: 1, fillOpacity: 0.2 }
      ).addTo(map);
      weatherZone.bindPopup('Storm Warning Zone');
    }

    if (layers.piracy) {
      const piracyZone = L.rectangle(
        [[0, 40], [15, 60]],
        { color: '#ef4444', weight: 1, fillOpacity: 0.2 }
      ).addTo(map);
      piracyZone.bindPopup('Piracy Risk Zone');
    }

    if (layers.traffic) {
      const trafficZone = L.rectangle(
        [[25, 50], [40, 70]],
        { color: '#f59e0b', weight: 1, fillOpacity: 0.2 }
      ).addTo(map);
      trafficZone.bindPopup('High Traffic Zone');
    }

    if (layers.claims) {
      const claimsZone = L.rectangle(
        [[5, 65], [20, 85]],
        { color: '#a855f7', weight: 1, fillOpacity: 0.2 }
      ).addTo(map);
      claimsZone.bindPopup('Historical Claims Zone');
    }
  }, [routes, selectedRoute, layers, onRouteSelect]);

  useEffect(() => {
    if (!mapRef.current || !isDrawing) return;

    const map = mapRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
      setDrawingPoints((prev) => [...prev, newPoint]);

      L.circleMarker(e.latlng, {
        radius: 6,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);
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
      
      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.CircleMarker) {
            mapRef.current?.removeLayer(layer);
          }
        });
      }
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
