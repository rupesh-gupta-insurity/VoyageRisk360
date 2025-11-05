import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { FileText, Filter, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Claim } from "@shared/schema";

interface ClaimWithRelations extends Claim {
  policy: {
    id: string;
    policyNo: string;
    insurer: string;
  } | null;
  shipment: {
    id: string;
    certificateNumber: string;
  } | null;
}

interface ClaimsResponse {
  data: ClaimWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const CLAIM_STATUSES = [
  'Reported',
  'Under Review',
  'Investigation',
  'Approved',
  'Rejected',
  'Settled',
  'Withdrawn',
  'Closed'
];

const LOSS_TYPES = [
  'Cargo Damage',
  'Total Loss',
  'Theft',
  'Fire',
  'Weather Damage',
  'Collision',
  'Piracy',
  'Contamination',
  'Water Damage',
  'Delay',
  'General Average',
  'Other'
];

const INSURERS = [
  'Lloyd\'s of London',
  'Allianz Global',
  'AXA XL',
  'Zurich Insurance',
  'AIG Marine',
  'MS Amlin',
  'Liberty Mutual',
  'Tokio Marine',
  'Swiss Re Corporate',
  'QBE International'
];

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Settled': 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    'Approved': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    'Reported': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    'Under Review': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    'Investigation': 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    'Rejected': 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    'Withdrawn': 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    'Closed': 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
  };
  return colors[status] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
}

export default function Claims() {
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    lossType: '',
    insurer: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: '50',
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.lossType && { lossType: filters.lossType }),
    ...(filters.insurer && { insurer: filters.insurer }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo }),
    ...(filters.minAmount && { minAmount: filters.minAmount }),
    ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
  });

  const { data, isLoading } = useQuery<ClaimsResponse>({
    queryKey: ['/api/claims', queryParams.toString()],
  });

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      lossType: '',
      insurer: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
    });
    setPage(1);
  };

  const formatCurrency = (amount: string | null, currency: string | null = 'USD') => {
    if (!amount) return 'N/A';
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <a className="text-xl font-bold text-primary hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-home">
                VoyageRisk360
              </a>
            </Link>
            <nav className="flex gap-4">
              <Link href="/dashboard">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-dashboard">
                  Routes
                </a>
              </Link>
              <Link href="/policies">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-policies">
                  Policies
                </a>
              </Link>
              <Link href="/shipments">
                <a className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate active-elevate-2 px-3 py-2 rounded-md" data-testid="link-shipments">
                  Shipments
                </a>
              </Link>
              <Link href="/claims">
                <a className="text-sm font-medium text-foreground hover-elevate active-elevate-2 px-3 py-2 rounded-md border-b-2 border-primary" data-testid="link-claims">
                  Claims
                </a>
              </Link>
            </nav>
          </div>
          <Badge variant="outline" className="text-xs">
            Demo Mode
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Claims Management
                </CardTitle>
                <CardDescription>
                  View and manage all maritime insurance claims
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search claims..."
                    value={filters.search}
                    onChange={(e) => {
                      setFilters({ ...filters, search: e.target.value });
                      setPage(1);
                    }}
                    className="pl-9 w-64"
                    data-testid="input-search-claims"
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <Collapsible open={showFilters}>
            <CollapsibleContent>
              <div className="px-6 pb-4">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Advanced Filters</CardTitle>
                      {activeFilterCount > 0 && (
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
                  </CardHeader>
                  <CardContent>
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
                          <SelectTrigger data-testid="select-filter-status">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">All Statuses</SelectItem>
                            {CLAIM_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Loss Type</label>
                        <Select
                          value={filters.lossType}
                          onValueChange={(value) => {
                            setFilters({ ...filters, lossType: value });
                            setPage(1);
                          }}
                        >
                          <SelectTrigger data-testid="select-filter-loss-type">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">All Types</SelectItem>
                            {LOSS_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
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
                          <SelectTrigger data-testid="select-filter-insurer">
                            <SelectValue placeholder="All Insurers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">All Insurers</SelectItem>
                            {INSURERS.map((insurer) => (
                              <SelectItem key={insurer} value={insurer}>
                                {insurer}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date From</label>
                        <Input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => {
                            setFilters({ ...filters, dateFrom: e.target.value });
                            setPage(1);
                          }}
                          data-testid="input-filter-date-from"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date To</label>
                        <Input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => {
                            setFilters({ ...filters, dateTo: e.target.value });
                            setPage(1);
                          }}
                          data-testid="input-filter-date-to"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Min Amount (USD)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.minAmount}
                          onChange={(e) => {
                            setFilters({ ...filters, minAmount: e.target.value });
                            setPage(1);
                          }}
                          data-testid="input-filter-min-amount"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max Amount (USD)</label>
                        <Input
                          type="number"
                          placeholder="1000000"
                          value={filters.maxAmount}
                          onChange={(e) => {
                            setFilters({ ...filters, maxAmount: e.target.value });
                            setPage(1);
                          }}
                          data-testid="input-filter-max-amount"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading claims...</p>
              </div>
            ) : !data?.data || data.data.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No claims found</p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="mt-2"
                    data-testid="button-clear-filters-empty"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Claim #</TableHead>
                        <TableHead>Policy</TableHead>
                        <TableHead>Shipment</TableHead>
                        <TableHead>Loss Type</TableHead>
                        <TableHead>Incident Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Claimed</TableHead>
                        <TableHead>Settled</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((claim) => (
                        <TableRow key={claim.id} className="hover-elevate" data-testid={`row-claim-${claim.id}`}>
                          <TableCell className="font-mono text-sm" data-testid={`text-claim-number-${claim.id}`}>
                            {claim.claimNumber}
                          </TableCell>
                          <TableCell>
                            {claim.policy ? (
                              <Link href={`/policies`}>
                                <a className="text-primary hover:underline" data-testid={`link-policy-${claim.id}`}>
                                  {claim.policy.policyNo}
                                </a>
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {claim.shipment ? (
                              <span className="font-mono text-xs" data-testid={`text-shipment-${claim.id}`}>
                                {claim.shipment.certificateNumber}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell data-testid={`text-loss-type-${claim.id}`}>
                            {claim.lossType}
                          </TableCell>
                          <TableCell data-testid={`text-incident-date-${claim.id}`}>
                            {claim.incidentDate
                              ? format(new Date(claim.incidentDate), 'MMM dd, yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate" data-testid={`text-location-${claim.id}`}>
                            {claim.incidentLocation || 'N/A'}
                          </TableCell>
                          <TableCell data-testid={`text-claimed-amount-${claim.id}`}>
                            {formatCurrency(claim.claimedAmount, claim.currency)}
                          </TableCell>
                          <TableCell data-testid={`text-settled-amount-${claim.id}`}>
                            {claim.settledAmount
                              ? formatCurrency(claim.settledAmount, claim.currency)
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(claim.status)}
                              data-testid={`badge-status-${claim.id}`}
                            >
                              {claim.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {data.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                      Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                      {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                      {data.pagination.total} claims
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                        disabled={page >= data.pagination.totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
