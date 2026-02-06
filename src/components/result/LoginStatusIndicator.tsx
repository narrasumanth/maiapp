import { useState, useEffect } from "react";
import { User, LogIn, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LoginStatusIndicatorProps {
  onSignInClick: () => void;
}

export const LoginStatusIndicator = ({ onSignInClick }: LoginStatusIndicatorProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setIsLoggedIn(!!session?.user);
          setUserEmail(session?.user?.email || null);
          
          // Fetch profile if logged in
          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", session.user.id)
              .maybeSingle();
            
            if (profile && isMounted) {
              setDisplayName(profile.display_name);
              setAvatarUrl(profile.avatar_url);
            }
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (isMounted) setIsLoggedIn(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        setIsLoggedIn(!!session?.user);
        setUserEmail(session?.user?.email || null);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
          if (profile) {
            setDisplayName(profile.display_name);
            setAvatarUrl(profile.avatar_url);
          }
        } else {
          setDisplayName(null);
          setAvatarUrl(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  // Still loading
  if (isLoggedIn === null) {
    return (
      <div className="w-8 h-8 rounded-full bg-secondary/50 animate-pulse" />
    );
  }

  // Not logged in - show sign in button
  if (!isLoggedIn) {
    return (
      <button
        onClick={onSignInClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors text-xs sm:text-sm font-medium"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sign In</span>
      </button>
    );
  }

  // Logged in - show user dropdown
  const initials = displayName 
    ? displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : userEmail?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
          <Avatar className="w-8 h-8 border-2 border-primary/30">
            <AvatarImage src={avatarUrl || undefined} alt={displayName || userEmail || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">
            {displayName || "User"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {userEmail}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
