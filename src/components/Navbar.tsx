import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Zap, Activity, Scale, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";
import { HeartbeatLogo } from "@/components/home/HeartbeatLogo";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Nav items - Disputes temporarily hidden
  const navItems = [
    { path: "/", icon: Search, label: "Search", requiresAuth: false },
    { path: "/impulse", icon: Zap, label: "Impulse", requiresAuth: false },
    { path: "/feed", icon: Activity, label: "Pulse Feed", requiresAuth: false },
    // { path: "/disputes", icon: Scale, label: "Disputes", requiresAuth: true }, // Temporarily disabled
  ].filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Beta Badge */}
            <Link to="/" className="flex items-center gap-2">
              <HeartbeatLogo size="sm" />
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary">
                <Sparkles className="w-2.5 h-2.5" />
                Beta
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path || 
                  (path === "/impulse" && location.pathname === "/roulette");
                return (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "text-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 bg-secondary/60 rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};
