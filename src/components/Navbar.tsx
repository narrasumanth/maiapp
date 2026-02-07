import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Zap, Activity, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";
import { HeartbeatLogo } from "@/components/home/HeartbeatLogo";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuthAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!roleData);
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAuthAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle()
          .then(({ data }) => setIsAdmin(!!data));
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Nav items - Impulse visible for authenticated users
  const navItems = [
    { path: "/", icon: Search, label: "Search", requiresAuth: false },
    { path: "/impulse", icon: Zap, label: "Impulse", requiresAuth: false },
    { path: "/feed", icon: Activity, label: "Pulse Feed", requiresAuth: false },
  ];

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

            {/* Nav Links - CSS transitions instead of framer-motion */}
            <div className="flex items-center gap-1">
              {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path || 
                  (path === "/impulse" && location.pathname === "/roulette");
                return (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "text-foreground bg-secondary/60" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
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
