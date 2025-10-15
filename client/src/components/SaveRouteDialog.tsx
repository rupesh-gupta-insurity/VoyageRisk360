import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SaveRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export default function SaveRouteDialog({ open, onOpenChange, onSave }: SaveRouteDialogProps) {
  const [routeName, setRouteName] = useState('');

  const handleSave = () => {
    if (routeName.trim()) {
      onSave(routeName.trim());
      setRouteName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Route</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="route-name">Route Name</Label>
            <Input
              id="route-name"
              placeholder="e.g., Singapore to Rotterdam"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              data-testid="input-route-name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!routeName.trim()} data-testid="button-save-route">
            Save Route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
