import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, Crosshair, Maximize, Minimize } from 'lucide-react';
import { useState } from 'react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onResetView,
}: MapControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <Card className="p-2 backdrop-blur-md bg-card/90 shadow-lg">
      <div className="flex flex-col gap-1">
        <Button
          onClick={onZoomIn}
          variant="ghost"
          size="icon"
          data-testid="button-zoom-in"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={onZoomOut}
          variant="ghost"
          size="icon"
          data-testid="button-zoom-out"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <div className="h-px bg-border my-1" />
        
        <Button
          onClick={onResetView}
          variant="ghost"
          size="icon"
          data-testid="button-reset-view"
          title="Reset View"
        >
          <Crosshair className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={toggleFullscreen}
          variant="ghost"
          size="icon"
          data-testid="button-fullscreen"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}
