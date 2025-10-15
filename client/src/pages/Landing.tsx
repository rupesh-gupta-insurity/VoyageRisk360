import { Button } from '@/components/ui/button';
import { Ship, MapPin, AlertTriangle, FileText } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ship className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">VoyageRisk360</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Maritime Route Risk Assessment Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Make informed decisions about maritime voyages with comprehensive risk analysis
              combining weather, piracy, traffic, and historical claims data.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/dashboard">Get Started</a>
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-6 pt-12">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6 text-chart-1" />
              </div>
              <h3 className="font-semibold">Interactive Mapping</h3>
              <p className="text-sm text-muted-foreground">
                Draw routes and visualize risks with multi-layer heatmaps
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-chart-2" />
              </div>
              <h3 className="font-semibold">Risk Scoring</h3>
              <p className="text-sm text-muted-foreground">
                Multi-factor analysis of weather, piracy, traffic, and claims
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mx-auto">
                <Ship className="w-6 h-6 text-chart-3" />
              </div>
              <h3 className="font-semibold">Route Management</h3>
              <p className="text-sm text-muted-foreground">
                Save, manage, and export route assessments
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-chart-4" />
              </div>
              <h3 className="font-semibold">Custom Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Configure thresholds and receive risk notifications
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
