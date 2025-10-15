import { Card } from '@/components/ui/card';

export default function RiskLegend() {
  const legendItems = [
    { label: 'Low', color: 'bg-risk-low' },
    { label: 'Medium-Low', color: 'bg-risk-medium-low' },
    { label: 'Medium', color: 'bg-risk-medium' },
    { label: 'Medium-High', color: 'bg-risk-medium-high' },
    { label: 'High', color: 'bg-risk-high' },
    { label: 'Critical', color: 'bg-risk-critical' },
  ];

  return (
    <Card className="p-3 backdrop-blur-md bg-card/90">
      <h3 className="text-xs font-semibold mb-2">Risk Level</h3>
      <div className="space-y-1">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-sm ${item.color}`} />
            <span className="text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
