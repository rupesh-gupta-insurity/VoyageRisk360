import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Ship, Package, Calendar, DollarSign, MapPin, Search, FileDown } from 'lucide-react';
import type { Policy, ShipmentCertificate } from '@shared/schema';

interface PolicyDetailModalProps {
  policy: Policy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PolicyDetailModal({ policy, open, onOpenChange }: PolicyDetailModalProps) {
  const [shipmentFilters, setShipmentFilters] = useState({
    status: 'all',
    search: '',
  });
  const [shipmentPage, setShipmentPage] = useState(1);

  const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery<{
    data: ShipmentCertificate[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['/api/policies', policy?.id, 'shipments', shipmentFilters, shipmentPage],
    queryFn: async () => {
      if (!policy) return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      const params = new URLSearchParams({
        page: shipmentPage.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(shipmentFilters).filter(([, v]) => v !== '' && v !== 'all')
        ),
      });
      const response = await fetch(`/api/policies/${policy.id}/shipments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      return response.json();
    },
    enabled: !!policy && open,
  });

  if (!policy) return null;

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'Loading':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'In Transit':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'Arrived':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Delivered':
      case 'Completed':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="dialog-policy-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Ship className="w-6 h-6 text-primary" />
            Policy {policy.policyNo}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="shipments" data-testid="tab-shipments">
              Shipments ({shipmentsData?.pagination.total || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Policy Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Policy Name:</span>
                      <span className="text-sm font-medium">{policy.policyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <span className="text-sm font-medium">{policy.policyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Year:</span>
                      <span className="text-sm font-medium">{policy.underwritingYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={getStatusColor(policy.status)} data-testid="badge-policy-status">
                        {policy.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Period</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Effective:</span>
                      <span className="text-sm font-medium">{formatDate(policy.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">End Date:</span>
                      <span className="text-sm font-medium">{formatDate(policy.endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Parties</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Insurer:</span>
                      <span className="text-sm font-medium">{policy.insurer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Assured:</span>
                      <span className="text-sm font-medium">{policy.assured}</span>
                    </div>
                    {policy.broker && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Broker:</span>
                        <span className="text-sm font-medium">{policy.broker}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Financial</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sum Insured:</span>
                      <span className="text-sm font-medium">{formatCurrency(policy.sumInsured, policy.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Premium:</span>
                      <span className="text-sm font-medium">{formatCurrency(policy.premium, policy.currency)}</span>
                    </div>
                    {policy.deductible && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Deductible:</span>
                        <span className="text-sm font-medium">{formatCurrency(policy.deductible, policy.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Coverage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Territory:</span>
                      <span className="text-sm font-medium">{policy.coverageTerritory}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shipments" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments..."
                  value={shipmentFilters.search}
                  onChange={(e) => {
                    setShipmentFilters({ ...shipmentFilters, search: e.target.value });
                    setShipmentPage(1);
                  }}
                  className="pl-10"
                  data-testid="input-search-shipments"
                />
              </div>
              
              <Select
                value={shipmentFilters.status}
                onValueChange={(value) => {
                  setShipmentFilters({ ...shipmentFilters, status: value });
                  setShipmentPage(1);
                }}
              >
                <SelectTrigger className="w-40" data-testid="select-shipment-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Loading">Loading</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Arrived">Arrived</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shipmentsLoading ? (
              <div className="p-12 text-center text-muted-foreground">
                Loading shipments...
              </div>
            ) : !shipmentsData || shipmentsData.data.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No shipments found
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Vessel</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Insured Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipmentsData.data.map((shipment) => (
                      <TableRow key={shipment.id} data-testid={`row-shipment-${shipment.id}`}>
                        <TableCell className="font-medium text-sm">{shipment.certificateNumber}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{shipment.sourcePort} → {shipment.destinationPort}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{shipment.commodity}</TableCell>
                        <TableCell className="text-sm">{shipment.vesselName}</TableCell>
                        <TableCell className="text-sm">
                          {shipment.departureDate ? formatDate(shipment.departureDate) : '-'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatCurrency(shipment.insuredAmount, shipment.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(shipment.status)} data-testid={`badge-shipment-status-${shipment.id}`}>
                            {shipment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(shipmentPage - 1) * 10 + 1} to {Math.min(shipmentPage * 10, shipmentsData.pagination.total)} of {shipmentsData.pagination.total} shipments
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShipmentPage(shipmentPage - 1)}
                      disabled={shipmentPage === 1}
                      data-testid="button-prev-shipments"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShipmentPage(shipmentPage + 1)}
                      disabled={shipmentPage >= shipmentsData.pagination.totalPages}
                      data-testid="button-next-shipments"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
