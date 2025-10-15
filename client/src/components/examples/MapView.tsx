import MapView from '../MapView';

export default function MapViewExample() {
  const mockRoutes = [
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
    },
  ];

  return (
    <div className="h-[600px] w-full">
      <MapView
        routes={mockRoutes}
        selectedRoute="1"
        onRouteSelect={(id) => console.log('Route selected:', id)}
        layers={{ weather: true, piracy: false, traffic: false, claims: false }}
        isDrawing={false}
        onRouteCreate={(waypoints) => console.log('Route created:', waypoints)}
      />
    </div>
  );
}
