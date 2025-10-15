import { useState } from 'react';
import SaveRouteDialog from '../SaveRouteDialog';
import { Button } from '@/components/ui/button';

export default function SaveRouteDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <Button onClick={() => setOpen(true)}>Open Save Dialog</Button>
      <SaveRouteDialog
        open={open}
        onOpenChange={setOpen}
        onSave={(name) => {
          console.log('Route saved:', name);
          setOpen(false);
        }}
      />
    </div>
  );
}
