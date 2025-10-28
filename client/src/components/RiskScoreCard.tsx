import { Card } from '@/components/ui/card';
import { AlertTriangle, Cloud, Ship, FileText } from 'lucide-react';

interface RiskScoreCardProps {
  overall: number;
  weather: number;
  piracy: number;
  traffic: number;
  claims: number;
  alertThreshold?: number;
  alertEnabled?: boolean;
}

export default function RiskScoreCard({ overall, weather, piracy, traffic, claims, alertThreshold, alertEnabled }: RiskScoreCardProps) {
  const exceedsThreshold = alertEnabled && alertThreshold !== undefined && overall > alertThreshold;
  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-risk-low';
    if (score < 40) return 'text-risk-medium-low';
    if (score < 60) return 'text-risk-medium';
    if (score < 80) return 'text-risk-medium-high';
    return 'text-risk-high';
  };

  const getRiskBgColor = (score: number) => {
    if (score < 20) return 'bg-risk-low/10';
    if (score < 40) return 'bg-risk-medium-low/10';
    if (score < 60) return 'bg-risk-medium/10';
    if (score < 80) return 'bg-risk-medium-high/10';
    return 'bg-risk-high/10';
  };

  const getRiskLabel = (score: number) => {
    if (score < 20) return 'Low';
    if (score < 40) return 'Medium-Low';
    if (score < 60) return 'Medium';
    if (score < 80) return 'High';
    return 'Critical';
  };

  const factors = [
    { icon: Cloud, label: 'Weather', score: weather, color: 'text-chart-1' },
    { icon: AlertTriangle, label: 'Piracy', score: piracy, color: 'text-chart-2' },
    { icon: Ship, label: 'Traffic', score: traffic, color: 'text-chart-3' },
    { icon: FileText, label: 'Claims', score: claims, color: 'text-chart-4' },
  ];

  return (
    <Card className="p-6">
      {exceedsThreshold && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive font-medium">
            Exceeds risk threshold ({alertThreshold}%)
          </p>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Overall Risk Score</p>
          <div className={`text-6xl font-mono font-bold ${getRiskColor(overall)}`} data-testid="text-overall-score">
            {overall}
          </div>
          <div className={`mt-2 inline-block px-3 py-1 rounded-md text-sm font-medium ${getRiskBgColor(overall)} ${getRiskColor(overall)}`}>
            {getRiskLabel(overall)}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Risk Breakdown</p>
          {factors.map((factor) => (
            <div key={factor.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <factor.icon className={`w-4 h-4 ${factor.color}`} />
                <span className="text-sm">{factor.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getRiskBgColor(factor.score)}`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <span className={`text-sm font-mono font-medium w-8 ${getRiskColor(factor.score)}`} data-testid={`text-${factor.label.toLowerCase()}-score`}>
                  {factor.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
