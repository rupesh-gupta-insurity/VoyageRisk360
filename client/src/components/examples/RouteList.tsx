import { useState } from 'react';
import RouteList from '../RouteList';

export default function RouteListExample() {
  const [selectedRoute, setSelectedRoute] = useState<string | null>('1');

  const mockRoutes = [
    { id: '1', name: 'Singapore to Rotterdam', riskScore: 65, createdAt: '2024-10-15' },
    { id: '2', name: 'Shanghai to Los Angeles', riskScore: 42, createdAt: '2024-10-14' },
    { id: '3', name: 'Dubai to New York', riskScore: 78, createdAt: '2024-10-13' },
  ];

  return (
    <div className="w-full max-w-md">
      <RouteList
        routes={mockRoutes}
        selectedRoute={selectedRoute}
        onSelectRoute={setSelectedRoute}
        onDeleteRoute={(id) => console.log('Delete route:', id)}
        onExportRoute={(id) => console.log('Export route:', id)}
      />
    </div>
  );
}
