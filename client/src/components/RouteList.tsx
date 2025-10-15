import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateRouteDistance, formatNauticalMiles } from '@/lib/distanceUtils';

interface Route {
  id: string;
  name: string;
  riskScore: number;
  createdAt: string;
  waypoints: Array<{ lat: number; lng: number }>;
}

interface RouteListProps {
  routes: Route[];
  selectedRoute: string | null;
  onSelectRoute: (id: string) => void;
  onDeleteRoute: (id: string) => void;
  onExportRoute: (id: string) => void;
}

export default function RouteList({
  routes,
  selectedRoute,
  onSelectRoute,
  onDeleteRoute,
  onExportRoute,
}: RouteListProps) {
  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-green-600 dark:text-green-500';
    if (score < 40) return 'text-lime-600 dark:text-lime-500';
    if (score < 60) return 'text-yellow-600 dark:text-yellow-500';
    if (score < 80) return 'text-orange-600 dark:text-orange-500';
    return 'text-red-600 dark:text-red-500';
  };

  const getRiskBgColor = (score: number) => {
    if (score < 20) return 'bg-green-500/10 border-green-500/20';
    if (score < 40) return 'bg-lime-500/10 border-lime-500/20';
    if (score < 60) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score < 80) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Saved Routes</h3>
        {routes.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {routes.length}
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {routes.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No routes saved yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Draw a route on the map to get started
            </p>
          </div>
        ) : (
          routes.map((route) => {
            const distance = calculateRouteDistance(route.waypoints);
            return (
              <div
                key={route.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover-elevate ${
                  selectedRoute === route.id 
                    ? 'bg-accent border-accent-foreground/20 shadow-sm' 
                    : 'border-border'
                }`}
                onClick={() => onSelectRoute(route.id)}
                data-testid={`route-item-${route.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{route.name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {route.createdAt}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {route.waypoints.length} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`px-2 py-1 rounded-md border ${getRiskBgColor(route.riskScore)}`}>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className={`w-3 h-3 ${getRiskColor(route.riskScore)}`} />
                          <span className={`text-xs font-bold ${getRiskColor(route.riskScore)}`}>
                            {route.riskScore}%
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatNauticalMiles(distance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportRoute(route.id);
                        }}
                        data-testid={`button-export-${route.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRoute(route.id);
                        }}
                        data-testid={`button-delete-${route.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
