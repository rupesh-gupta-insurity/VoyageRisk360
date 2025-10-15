import { useState } from 'react';
import LayerControl from '../LayerControl';

export default function LayerControlExample() {
  const [layers, setLayers] = useState({
    weather: true,
    piracy: false,
    traffic: false,
    claims: false,
  });

  const handleToggle = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="w-full max-w-sm">
      <LayerControl layers={layers} onLayerToggle={handleToggle} />
    </div>
  );
}
