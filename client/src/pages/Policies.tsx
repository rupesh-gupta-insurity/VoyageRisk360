import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import PolicyDetailModal from '@/components/PolicyDetailModal';
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
import type { Policy } from '@shared/schema';

export default function Policies() {
  const [filters, setFilters] = useState({
    year: 'all',
    status: 'all',
    type: 'all',
    insurer: 'all',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showPolicyDetail, setShowPolicyDetail] = useState(false);

  const { data, isLoading } = useQuery<{
    data: Policy[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['/api/policies', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '' && v !== 'all')
        ),
      });
      const response = await fetch(`/api/policies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch policies');
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Expired':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <PageHeader activePage="policies" />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header Section - Fixed */}
        <div className="px-4 py-6 border-b">
          <div className="container mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Marine Insurance Policies</h1>
              <p className="text-muted-foreground">
                View and manage {data?.pagination.total || 0} maritime insurance policies
              </p>
            </div>

            {/* Filters */}
            <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPage(1);
                }}
                className="pl-10"
                data-testid="input-search-policies"
              />
            </div>
            
            <Select
              value={filters.year}
              onValueChange={(value) => {
                setFilters({ ...filters, year: value });
                setPage(1);
              }}
            >
              <SelectTrigger data-testid="select-year">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.status}
              onValueChange={(value) => {
                setFilters({ ...filters, status: value });
                setPage(1);
              }}
            >
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.type}
              onValueChange={(value) => {
                setFilters({ ...filters, type: value });
                setPage(1);
              }}
            >
              <SelectTrigger data-testid="select-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Marine Cargo - ICC(A)">Cargo ICC(A)</SelectItem>
                <SelectItem value="Marine Cargo - ICC(B)">Cargo ICC(B)</SelectItem>
                <SelectItem value="Marine Cargo - ICC(C)">Cargo ICC(C)</SelectItem>
                <SelectItem value="Hull & Machinery">Hull & Machinery</SelectItem>
                <SelectItem value="Protection & Indemnity">P&I</SelectItem>
                <SelectItem value="War Risk">War Risk</SelectItem>
                <SelectItem value="Freight Insurance">Freight</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ year: 'all', status: 'all', type: 'all', insurer: 'all', search: '' });
                setPage(1);
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
            </Card>
          </div>
        </div>

        {/* Table Section - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="container mx-auto py-4">
            <Card>
              {isLoading ? (
                <div className="p-12 text-center text-muted-foreground">
                  Loading policies...
                </div>
              ) : !data || data.data.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No policies found
                </div>
              ) : (
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Insurer</TableHead>
                    <TableHead>Assured</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Sum Insured</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((policy) => (
                    <TableRow
                      key={policy.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => {
                        setSelectedPolicy(policy);
                        setShowPolicyDetail(true);
                      }}
                      data-testid={`row-policy-${policy.id}`}
                    >
                      <TableCell className="font-medium">{policy.policyNo}</TableCell>
                      <TableCell className="text-sm">{policy.policyType}</TableCell>
                      <TableCell className="text-sm">{policy.insurer}</TableCell>
                      <TableCell className="text-sm">{policy.assured}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(policy.effectiveDate.toString())} - {formatDate(policy.endDate.toString())}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(policy.sumInsured, policy.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(policy.status)} data-testid={`badge-status-${policy.id}`}>
                          {policy.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </Card>
          </div>
        </div>

        {/* Pagination Footer - Fixed */}
        {data && data.data.length > 0 && (
          <div className="border-t bg-card">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, data.pagination.total)} of {data.pagination.total} policies
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
            </div>
          </div>
        )}
      </div>

      <PolicyDetailModal
        policy={selectedPolicy}
        open={showPolicyDetail}
        onOpenChange={setShowPolicyDetail}
      />
    </div>
  );
}
