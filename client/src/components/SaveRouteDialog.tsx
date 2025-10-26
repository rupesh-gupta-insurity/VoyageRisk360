import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cloud, Skull, Ship as ShipIcon, FileText, AlertTriangle, Route } from 'lucide-react';
import { calculateRouteDistance, formatNauticalMiles } from '@/lib/distanceUtils';

interface SaveRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  waypoints?: Array<{ lat: number; lng: number }>;
  riskScores?: {
    overall: number;
    weather: number;
    piracy: number;
    traffic: number;
    claims: number;
  } | null;
  isCalculating?: boolean;
}

export default function SaveRouteDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  waypoints = [],
  riskScores,
  isCalculating = false 
}: SaveRouteDialogProps) {
  const [routeName, setRouteName] = useState('');
  
  const routeDistance = waypoints.length >= 2 
    ? calculateRouteDistance(waypoints)
    : 0;

  const handleSave = () => {
    if (routeName.trim()) {
      onSave(routeName.trim());
      setRouteName('');
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-green-600 dark:text-green-500';
    if (score < 40) return 'text-lime-600 dark:text-lime-500';
    if (score < 60) return 'text-yellow-600 dark:text-yellow-500';
    if (score < 80) return 'text-orange-600 dark:text-orange-500';
    return 'text-red-600 dark:text-red-500';
  };

  const getRiskLevel = (score: number) => {
    if (score < 20) return 'Low';
    if (score < 40) return 'Medium-Low';
    if (score < 60) return 'Medium';
    if (score < 80) return 'Medium-High';
    return 'High';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Route</DialogTitle>
          <DialogDescription>
            Review the risk assessment and provide a name for your route.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isCalculating ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-muted-foreground">Calculating risk scores...</p>
            </div>
          ) : riskScores ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                    <div>
                      <span className="text-sm font-medium">Overall Risk</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-2xl font-bold ${getRiskColor(riskScores.overall)}`}>
                          {riskScores.overall}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getRiskLevel(riskScores.overall)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Route Distance</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Route className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xl font-bold">
                          {formatNauticalMiles(routeDistance)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Weather</p>
                        <p className={`text-sm font-semibold ${getRiskColor(riskScores.weather)}`}>
                          {riskScores.weather}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skull className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Piracy</p>
                        <p className={`text-sm font-semibold ${getRiskColor(riskScores.piracy)}`}>
                          {riskScores.piracy}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShipIcon className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Traffic</p>
                        <p className={`text-sm font-semibold ${getRiskColor(riskScores.traffic)}`}>
                          {riskScores.traffic}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Claims</p>
                        <p className={`text-sm font-semibold ${getRiskColor(riskScores.claims)}`}>
                          {riskScores.claims}%
                        </p>
                      </div>
                    </div>
                  </div>
                  {riskScores.overall >= 75 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">High Risk Route</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          This route exceeds recommended risk thresholds
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
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
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!routeName.trim() || isCalculating} 
            data-testid="button-save-route"
          >
            Save Route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
