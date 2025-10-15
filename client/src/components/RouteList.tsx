import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Route {
  id: string;
  name: string;
  riskScore: number;
  createdAt: string;
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
  const getRiskBadgeVariant = (score: number) => {
    if (score < 40) return 'default';
    if (score < 70) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-4">Saved Routes</h3>
      <div className="space-y-2">
        {routes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No routes saved yet</p>
        ) : (
          routes.map((route) => (
            <div
              key={route.id}
              className={`p-3 rounded-md border cursor-pointer transition-colors hover-elevate ${
                selectedRoute === route.id ? 'bg-accent' : ''
              }`}
              onClick={() => onSelectRoute(route.id)}
              data-testid={`route-item-${route.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{route.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{route.createdAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRiskBadgeVariant(route.riskScore)}>
                    {route.riskScore}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
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
          ))
        )}
      </div>
    </Card>
  );
}
