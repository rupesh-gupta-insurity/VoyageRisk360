import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Ship, Package, Search, Filter, Calendar, MapPin, DollarSign, FileText, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ShipmentCertificate } from '@shared/schema';

type ShipmentWithPolicy = ShipmentCertificate & {
  policy: {
    id: string;
    policyNo: string;
    insurer: string;
    policyType: string;
  };
};

export default function Shipments() {
  const [filters, setFilters] = useState({
    status: 'all',
    insurer: 'all',
    sourcePort: '',
    destinationPort: '',
    commodity: '',
    vesselName: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    data: ShipmentWithPolicy[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['/api/shipments', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '' && v !== 'all')
        ),
      });
      const response = await fetch(`/api/shipments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      return response.json();
    },
  });

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
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

  const clearFilters = () => {
    setFilters({
      status: 'all',
      insurer: 'all',
      sourcePort: '',
      destinationPort: '',
      commodity: '',
      vesselName: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => value !== '' && value !== 'all'
  );

  const uniqueInsurers = data?.data
    ? Array.from(new Set(data.data.map(s => s.policy.insurer))).sort()
    : [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader activePage="shipments" sticky />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Shipment Certificates
            </h1>
            <p className="text-muted-foreground mt-2">
              Recently booked shipments across all policies
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by certificate number, port, commodity, vessel, or B/L number..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              className="pl-10"
              data-testid="input-search-shipments"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && !showFilters && (
              <Badge className="ml-2 bg-primary text-primary-foreground" data-testid="badge-active-filters">
                {Object.entries(filters).filter(([, v]) => v !== '' && v !== 'all').length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent>
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => {
                      setFilters({ ...filters, status: value });
                      setPage(1);
                    }}
                  >
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Insurer</label>
                  <Select
                    value={filters.insurer}
                    onValueChange={(value) => {
                      setFilters({ ...filters, insurer: value });
                      setPage(1);
                    }}
                  >
                    <SelectTrigger data-testid="select-insurer-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Insurers</SelectItem>
                      {uniqueInsurers.map((insurer) => (
                        <SelectItem key={insurer} value={insurer}>
                          {insurer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Source Port</label>
                  <Input
                    placeholder="e.g., Shanghai"
                    value={filters.sourcePort}
                    onChange={(e) => {
                      setFilters({ ...filters, sourcePort: e.target.value });
                      setPage(1);
                    }}
                    data-testid="input-source-port"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination Port</label>
                  <Input
                    placeholder="e.g., Rotterdam"
                    value={filters.destinationPort}
                    onChange={(e) => {
                      setFilters({ ...filters, destinationPort: e.target.value });
                      setPage(1);
                    }}
                    data-testid="input-destination-port"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Commodity</label>
                  <Input
                    placeholder="e.g., Electronics"
                    value={filters.commodity}
                    onChange={(e) => {
                      setFilters({ ...filters, commodity: e.target.value });
                      setPage(1);
                    }}
                    data-testid="input-commodity"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Vessel Name</label>
                  <Input
                    placeholder="e.g., MSC Napoli"
                    value={filters.vesselName}
                    onChange={(e) => {
                      setFilters({ ...filters, vesselName: e.target.value });
                      setPage(1);
                    }}
                    data-testid="input-vessel-name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Booking From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => {
                      setFilters({ ...filters, dateFrom: e.target.value });
                      setPage(1);
                    }}
                    data-testid="input-date-from"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Booking To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => {
                      setFilters({ ...filters, dateTo: e.target.value });
                      setPage(1);
                    }}
                    data-testid="input-date-to"
                  />
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Shipments Table */}
        <Card>
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              Loading shipments...
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No shipments found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Vessel</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Insured Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((shipment) => (
                    <TableRow
                      key={shipment.id}
                      className="hover-elevate"
                      data-testid={`row-shipment-${shipment.id}`}
                    >
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {shipment.certificateNumber}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Link href="/policies">
                          <a className="text-primary hover:underline cursor-pointer" data-testid={`link-policy-${shipment.policy.id}`}>
                            {shipment.policy.policyNo}
                          </a>
                        </Link>
                        <div className="text-xs text-muted-foreground">{shipment.policy.insurer}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{shipment.sourcePort}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>→ {shipment.destinationPort}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{shipment.commodity}</div>
                        {shipment.hazardClass && (
                          <Badge variant="outline" className="mt-1 bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs">
                            {shipment.hazardClass}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Ship className="w-3 h-3 text-muted-foreground" />
                          {shipment.vesselName}
                        </div>
                        <div className="text-xs text-muted-foreground">{shipment.conveyanceType}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {formatDate(shipment.bookingDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(shipment.departureDate)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          {formatCurrency(shipment.insuredAmount, shipment.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(shipment.status)} data-testid={`badge-status-${shipment.id}`}>
                          {shipment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, data.pagination.total)} of {data.pagination.total} shipments
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
