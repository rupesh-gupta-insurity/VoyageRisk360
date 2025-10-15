import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pencil, Check, X, MapPin } from 'lucide-react';

interface DrawingToolsProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  waypointCount?: number;
}

export default function DrawingTools({
  isDrawing,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,
  waypointCount = 0,
}: DrawingToolsProps) {
  return (
    <Card className="p-3 backdrop-blur-md bg-card/90 shadow-lg">
      {!isDrawing ? (
        <Button
          onClick={onStartDrawing}
          variant="default"
          size="default"
          data-testid="button-start-drawing"
          className="w-full"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Draw New Route
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{waypointCount} waypoint{waypointCount !== 1 ? 's' : ''} added</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Click on the map to add waypoints
          </p>
          <div className="flex gap-2">
            <Button
              onClick={onFinishDrawing}
              variant="default"
              size="sm"
              data-testid="button-finish-drawing"
              disabled={waypointCount < 2}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Finish
            </Button>
            <Button
              onClick={onCancelDrawing}
              variant="outline"
              size="sm"
              data-testid="button-cancel-drawing"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {waypointCount < 2 && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Add at least 2 waypoints to create a route
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
