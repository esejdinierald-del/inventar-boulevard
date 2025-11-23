import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Coffee, Home, FileText, BarChart3, Download, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check if on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Show install button only on mobile and if not already installed
    setShowInstallPrompt(isMobile && !isInstalled);
  }, []);

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/daily", icon: FileText, label: "Regjistrimi Ditor" },
    { to: "/reports", icon: BarChart3, label: "Raporte" },
    { to: "/manual", icon: BookOpen, label: "Manual" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Bulevard</h1>
          </div>
          <div className="flex items-center gap-4">
            {showInstallPrompt && (
              <Button
                onClick={() => navigate('/install')}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Instalo</span>
              </Button>
            )}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to || 
                  (item.to === '/daily' && location.pathname.startsWith('/daily'));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to === '/daily' && location.pathname.startsWith('/daily'));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg p-3 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
