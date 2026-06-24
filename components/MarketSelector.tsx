import { useAccount } from 'wagmi';
import { useMarkets } from '@/hooks/useMarkets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketSelectorProps {
  value: string | null;
  onValueChange: (value: string) => void;
  showBadge?: boolean;
  className?: string;
  filterByBorrower?: boolean; // Only show markets where user is borrower
  filterByLender?: boolean; // Only show markets where user is NOT borrower (can lend)
}

export function MarketSelector({
  value,
  onValueChange,
  showBadge = true,
  className,
  filterByBorrower = false,
  filterByLender = false
}: MarketSelectorProps) {
  const { address } = useAccount();
  const { data: marketsData, isLoading } = useMarkets();

  // Filter markets based on user role
  let markets = marketsData?.markets || [];

  if (filterByBorrower && address) {
    // Only show markets where user is the borrower
    markets = markets.filter(m => m.borrower.toLowerCase() === address.toLowerCase());
  } else if (filterByLender && address) {
    // Only show markets where user is NOT the borrower (can lend)
    markets = markets.filter(m => m.borrower.toLowerCase() !== address.toLowerCase());
  }

  const selectedMarket = markets.find(m => m.address === value);

  // Determine user's role in the selected market
  const getUserRole = (market: any) => {
    if (!address) return 'observer';
    if (market.borrower.toLowerCase() === address.toLowerCase()) return 'borrower';
    // Check if user has offers or positions in this market (simplified)
    return 'lender';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'borrower':
        return <Badge variant="default" className="bg-blue-500">You are the Borrower</Badge>;
      case 'lender':
        return <Badge variant="info">You can lend here</Badge>;
      case 'observer':
        return <Badge variant="default" className="bg-gray-400">View only</Badge>;
      default:
        return null;
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!markets.length) {
    const emptyMessage = filterByBorrower
      ? "You don't have any markets. Contact admin to create a market for you."
      : filterByLender
      ? "No markets available for lending."
      : "No lending markets have been deployed yet.";

    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm">No Markets Available</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">{emptyMessage}</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Select value={value || undefined} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a market" />
        </SelectTrigger>
        <SelectContent>
          {markets.map((market) => {
            return (
              <SelectItem key={market.address} value={market.address}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {market.borrow_asset?.symbol || 'Unknown'}/{market.collateral_asset?.symbol || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatAddress(market.address)}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {selectedMarket && showBadge && (
        <div className="mt-3 space-y-2">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Market Details</div>
                  <div className="text-xs text-muted-foreground">
                    Address: {formatAddress(selectedMarket.address)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Borrower: {formatAddress(selectedMarket.borrower)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Status: <span className={selectedMarket.is_active ? "text-green-600" : "text-red-600"}>
                      {selectedMarket.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  {getRoleBadge(getUserRole(selectedMarket))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Export a simplified version for inline use
export function MarketBadge({ marketAddress }: { marketAddress: string }) {
  const { address } = useAccount();
  const { data: marketsData } = useMarkets();

  const market = marketsData?.markets.find(m => m.address === marketAddress);

  if (!market || !address) return null;

  const isBorrower = market.borrower.toLowerCase() === address.toLowerCase();

  if (isBorrower) {
    return <Badge variant="default" className="bg-blue-500">You are the Borrower</Badge>;
  }

  return <Badge variant="info">You can lend here</Badge>;
}
