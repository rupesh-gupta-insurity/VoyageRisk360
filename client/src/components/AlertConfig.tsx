import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AlertConfigProps {
  threshold: number;
  enabled: boolean;
  onThresholdChange: (value: number) => void;
  onEnabledChange: (enabled: boolean) => void;
  onSave: () => void;
}

export default function AlertConfig({
  threshold,
  enabled,
  onThresholdChange,
  onEnabledChange,
  onSave,
}: AlertConfigProps) {
  const [localThreshold, setLocalThreshold] = useState(threshold.toString());

  useEffect(() => {
    setLocalThreshold(threshold.toString());
  }, [threshold]);

  const handleSave = () => {
    const value = parseInt(localThreshold);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      onThresholdChange(value);
      onSave();
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4" />
        <h3 className="text-sm font-semibold">Alert Configuration</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="alerts-enabled" className="text-sm">Enable Alerts</Label>
          <Switch
            id="alerts-enabled"
            checked={enabled}
            onCheckedChange={onEnabledChange}
            data-testid="switch-alerts-enabled"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="risk-threshold" className="text-sm">Risk Threshold</Label>
          <div className="flex gap-2">
            <Input
              id="risk-threshold"
              type="number"
              min="0"
              max="100"
              value={localThreshold}
              onChange={(e) => setLocalThreshold(e.target.value)}
              disabled={!enabled}
              data-testid="input-risk-threshold"
            />
            <span className="flex items-center text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Alert when route risk exceeds this threshold
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="w-full"
          disabled={!enabled}
          data-testid="button-save-alert-config"
        >
          Save Configuration
        </Button>
      </div>
    </Card>
  );
}
