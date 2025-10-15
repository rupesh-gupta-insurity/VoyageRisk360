import { useState } from 'react';
import DrawingTools from '../DrawingTools';

export default function DrawingToolsExample() {
  const [isDrawing, setIsDrawing] = useState(false);

  return (
    <div className="w-full">
      <DrawingTools
        isDrawing={isDrawing}
        onStartDrawing={() => setIsDrawing(true)}
        onFinishDrawing={() => {
          setIsDrawing(false);
          console.log('Drawing finished');
        }}
        onCancelDrawing={() => {
          setIsDrawing(false);
          console.log('Drawing cancelled');
        }}
      />
    </div>
  );
}
