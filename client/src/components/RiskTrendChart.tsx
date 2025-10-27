import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RiskTrendChartProps {
  weather: number;
  piracy: number;
  traffic: number;
  claims: number;
}

export default function RiskTrendChart({
  weather,
  piracy,
  traffic,
  claims,
}: RiskTrendChartProps) {
  const data = [
    { name: 'Weather', value: weather, color: '#3b82f6' },
    { name: 'Piracy', value: piracy, color: '#ef4444' },
    { name: 'Traffic', value: traffic, color: '#f59e0b' },
    { name: 'Claims', value: claims, color: '#8b5cf6' },
  ];

  return (
    <Card data-testid="card-risk-trend">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Risk Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`${value}%`, 'Risk Score']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
