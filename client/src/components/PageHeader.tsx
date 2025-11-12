import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { Ship, FileText } from 'lucide-react';

type Page = 'dashboard' | 'policies' | 'shipments' | 'claims';

interface PageHeaderProps {
  activePage: Page;
  sticky?: boolean;
}

export default function PageHeader({ activePage, sticky = false }: PageHeaderProps) {
  const headerClass = sticky
    ? "sticky top-0 z-50 flex h-16 items-center justify-between border-b px-6 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60"
    : "flex h-16 items-center justify-between border-b px-6";

  return (
    <header className={headerClass}>
      <div className="flex items-center gap-6">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer hover-elevate active-elevate-2 px-3 py-2 rounded-md">
            <Ship className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">VoyageRisk360</h1>
          </div>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button 
              variant={activePage === 'dashboard' ? 'default' : 'ghost'} 
              size="sm" 
              data-testid="link-dashboard"
            >
              Routes
            </Button>
          </Link>
          <Link href="/policies">
            <Button 
              variant={activePage === 'policies' ? 'default' : 'ghost'} 
              size="sm" 
              data-testid="link-policies"
            >
              <FileText className="w-4 h-4 mr-2" />
              Policies
            </Button>
          </Link>
          <Link href="/shipments">
            <Button 
              variant={activePage === 'shipments' ? 'default' : 'ghost'} 
              size="sm" 
              data-testid="link-shipments"
            >
              <Ship className="w-4 h-4 mr-2" />
              Shipments
            </Button>
          </Link>
          <Link href="/claims">
            <Button 
              variant={activePage === 'claims' ? 'default' : 'ghost'} 
              size="sm" 
              data-testid="link-claims"
            >
              <FileText className="w-4 h-4 mr-2" />
              Claims
            </Button>
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm bg-primary/10 border border-primary px-3 py-1 rounded-md text-primary font-medium">
          Demo Mode
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
