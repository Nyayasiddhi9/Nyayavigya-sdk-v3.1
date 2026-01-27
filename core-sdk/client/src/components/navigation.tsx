import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Code2, 
  Users, 
  TrendingUp, 
  Rocket, 
  Activity,
  Menu,
  X,
  Brain,
  Zap,
  PlayCircle
} from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/demos", label: "Demos", icon: PlayCircle },
    { href: "/upload", label: "New Project", icon: Code2 },
    { href: "/analytics", label: "Analytics", icon: TrendingUp },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src="/wai-logo.svg" 
                  alt="WAI DevSphere" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">WAI Platform</h1>
                <p className="text-xs text-muted-foreground">AI Development</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <button
                    className={cn(
                      "nav-item flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive(item.href)
                        ? "text-primary bg-primary/10 active"
                        : "text-muted-foreground hover:text-white hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>

          {/* System Status */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-3 py-2 bg-muted/50 rounded-lg">
              <div className="realtime-indicator">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm">
                <div className="text-white font-medium">System Active</div>
                <div className="text-xs text-muted-foreground">28 agents ready</div>
              </div>
            </div>

            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
              Live
            </Badge>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} to={item.href}>
                    <button
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all",
                        isActive(item.href)
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-white hover:bg-muted/50"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </Link>
                );
              })}

              <div className="pt-3 mt-3 border-t border-border">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-emerald-400">System Online</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}