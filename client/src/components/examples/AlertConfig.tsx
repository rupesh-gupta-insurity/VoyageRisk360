import { useState } from 'react';
import AlertConfig from '../AlertConfig';

export default function AlertConfigExample() {
  const [threshold, setThreshold] = useState(75);
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="w-full max-w-sm">
      <AlertConfig
        threshold={threshold}
        enabled={enabled}
        onThresholdChange={setThreshold}
        onEnabledChange={setEnabled}
        onSave={() => console.log('Alert config saved:', { threshold, enabled })}
      />
    </div>
  );
}
