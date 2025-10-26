import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface AddressLookupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRouteCreate: (origin: Location, destination: Location) => void;
}

export default function AddressLookup({ open, onOpenChange, onRouteCreate }: AddressLookupProps) {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originResults, setOriginResults] = useState<Location[]>([]);
  const [destinationResults, setDestinationResults] = useState<Location[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<Location | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Location | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  
  const originTimeoutRef = useRef<NodeJS.Timeout>();
  const destinationTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search for locations
  const searchLocation = async (query: string, isOrigin: boolean) => {
    if (query.trim().length < 3) {
      if (isOrigin) {
        setOriginResults([]);
      } else {
        setDestinationResults([]);
      }
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=5`);
      const results = await response.json();
      
      if (isOrigin) {
        setOriginResults(results);
      } else {
        setDestinationResults(results);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce origin search
  useEffect(() => {
    if (originTimeoutRef.current) {
      clearTimeout(originTimeoutRef.current);
    }

    if (originQuery && !selectedOrigin) {
      originTimeoutRef.current = setTimeout(() => {
        searchLocation(originQuery, true);
      }, 300);
    }

    return () => {
      if (originTimeoutRef.current) {
        clearTimeout(originTimeoutRef.current);
      }
    };
  }, [originQuery, selectedOrigin]);

  // Debounce destination search
  useEffect(() => {
    if (destinationTimeoutRef.current) {
      clearTimeout(destinationTimeoutRef.current);
    }

    if (destinationQuery && !selectedDestination) {
      destinationTimeoutRef.current = setTimeout(() => {
        searchLocation(destinationQuery, false);
      }, 300);
    }

    return () => {
      if (destinationTimeoutRef.current) {
        clearTimeout(destinationTimeoutRef.current);
      }
    };
  }, [destinationQuery, selectedDestination]);

  const handleOriginSelect = (location: Location) => {
    setSelectedOrigin(location);
    setOriginQuery(location.name);
    setShowOriginSuggestions(false);
    setOriginResults([]);
  };

  const handleDestinationSelect = (location: Location) => {
    setSelectedDestination(location);
    setDestinationQuery(location.name);
    setShowDestinationSuggestions(false);
    setDestinationResults([]);
  };

  const handleCreateRoute = () => {
    if (selectedOrigin && selectedDestination) {
      onRouteCreate(selectedOrigin, selectedDestination);
      // Reset form
      setOriginQuery('');
      setDestinationQuery('');
      setSelectedOrigin(null);
      setSelectedDestination(null);
      setOriginResults([]);
      setDestinationResults([]);
    }
  };

  const handleCancel = () => {
    setOriginQuery('');
    setDestinationQuery('');
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setOriginResults([]);
    setDestinationResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Plan Route by Address
          </DialogTitle>
          <DialogDescription>
            Enter origin and destination ports or cities to automatically generate a maritime route.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Origin Input */}
          <div className="space-y-2">
            <Label htmlFor="origin">Origin</Label>
            <div className="relative">
              <Input
                id="origin"
                placeholder="e.g., Port of Singapore, New York Harbor"
                value={originQuery}
                onChange={(e) => {
                  setOriginQuery(e.target.value);
                  setSelectedOrigin(null);
                  setShowOriginSuggestions(true);
                }}
                onFocus={() => setShowOriginSuggestions(true)}
                data-testid="input-origin"
              />
              {isSearching && originQuery && (
                <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              
              {/* Origin Suggestions */}
              {showOriginSuggestions && originResults.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
                  <div className="p-1">
                    {originResults.map((location, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 rounded-sm hover-elevate transition-colors"
                        onClick={() => handleOriginSelect(location)}
                        data-testid={`suggestion-origin-${index}`}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{location.name.split(',')[0]}</p>
                            <p className="text-xs text-muted-foreground truncate">{location.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Destination Input */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <div className="relative">
              <Input
                id="destination"
                placeholder="e.g., Port of Rotterdam, Los Angeles Harbor"
                value={destinationQuery}
                onChange={(e) => {
                  setDestinationQuery(e.target.value);
                  setSelectedDestination(null);
                  setShowDestinationSuggestions(true);
                }}
                onFocus={() => setShowDestinationSuggestions(true)}
                data-testid="input-destination"
              />
              {isSearching && destinationQuery && (
                <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              
              {/* Destination Suggestions */}
              {showDestinationSuggestions && destinationResults.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
                  <div className="p-1">
                    {destinationResults.map((location, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 rounded-sm hover-elevate transition-colors"
                        onClick={() => handleDestinationSelect(location)}
                        data-testid={`suggestion-destination-${index}`}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{location.name.split(',')[0]}</p>
                            <p className="text-xs text-muted-foreground truncate">{location.name}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Selected Locations Summary */}
          {selectedOrigin && selectedDestination && (
            <Card className="p-4 bg-accent/50">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">From:</span>
                  <span className="text-muted-foreground truncate">{selectedOrigin.name.split(',')[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">To:</span>
                  <span className="text-muted-foreground truncate">{selectedDestination.name.split(',')[0]}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-route">
            Cancel
          </Button>
          <Button
            onClick={handleCreateRoute}
            disabled={!selectedOrigin || !selectedDestination}
            data-testid="button-create-route"
          >
            Create Route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
