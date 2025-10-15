import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin, Layers, AlertTriangle, FileDown } from 'lucide-react';

interface OnboardingOverlayProps {
  onDismiss: () => void;
}

export default function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: MapPin,
      title: 'Draw Your Route',
      description: 'Click "Draw New Route" and click on the map to add waypoints. Connect at least 2 points to create a shipping route.',
    },
    {
      icon: AlertTriangle,
      title: 'View Risk Assessment',
      description: 'Once you save your route, you\'ll see risk scores for weather, piracy, traffic, and insurance claims.',
    },
    {
      icon: Layers,
      title: 'Toggle Risk Layers',
      description: 'Use the Risk Layers panel to visualize different risk zones on the map.',
    },
    {
      icon: FileDown,
      title: 'Export Reports',
      description: 'Export your route analysis as a PDF report for sharing or record-keeping.',
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onDismiss}
            data-testid="button-close-onboarding"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{currentStep.title}</CardTitle>
          </div>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 justify-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="flex-1"
                data-testid="button-next-onboarding"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={onDismiss}
                className="flex-1"
                data-testid="button-finish-onboarding"
              >
                Get Started
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
