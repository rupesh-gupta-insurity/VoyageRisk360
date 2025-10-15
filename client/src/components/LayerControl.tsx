import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Cloud, AlertTriangle, Ship, FileText } from 'lucide-react';

interface LayerControlProps {
  layers: {
    weather: boolean;
    piracy: boolean;
    traffic: boolean;
    claims: boolean;
  };
  onLayerToggle: (layer: keyof LayerControlProps['layers']) => void;
}

export default function LayerControl({ layers, onLayerToggle }: LayerControlProps) {
  const layerItems = [
    { key: 'weather' as const, icon: Cloud, label: 'Weather', color: 'text-chart-1' },
    { key: 'piracy' as const, icon: AlertTriangle, label: 'Piracy', color: 'text-chart-2' },
    { key: 'traffic' as const, icon: Ship, label: 'Traffic', color: 'text-chart-3' },
    { key: 'claims' as const, icon: FileText, label: 'Claims', color: 'text-chart-4' },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-4">Risk Layers</h3>
      <div className="space-y-3">
        {layerItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-sm">{item.label}</span>
            </div>
            <Switch
              checked={layers[item.key]}
              onCheckedChange={() => onLayerToggle(item.key)}
              data-testid={`switch-${item.key}-layer`}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
