import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pencil, Check, X } from 'lucide-react';

interface DrawingToolsProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
}

export default function DrawingTools({
  isDrawing,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,
}: DrawingToolsProps) {
  return (
    <Card className="p-2 backdrop-blur-md bg-card/90">
      {!isDrawing ? (
        <Button
          onClick={onStartDrawing}
          variant="default"
          size="sm"
          data-testid="button-start-drawing"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Draw Route
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={onFinishDrawing}
            variant="default"
            size="sm"
            data-testid="button-finish-drawing"
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
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}
