import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  trust_score: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useAuth = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, trust_score")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        // Don't fail auth - just means profile doesn't exist yet
        return true; // Needs onboarding
      }

      if (data) {
        setProfile(data);
        return !data.display_name; // Returns true if onboarding needed
      }
      
      // No profile exists yet - needs onboarding
      return true;
    } catch (err) {
      console.error("Exception fetching profile:", err);
      // Don't block auth on profile fetch failure
      return true; // Assume needs onboarding
    }
  }, []);

  // Check admin role
  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "moderator"]);

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error("Exception checking admin role:", err);
      return false;
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      // Clear all state immediately
      setUser(null);
      setProfile(null);
      setNotifications([]);
      setUnreadCount(0);
      setIsAdmin(false);
      setNeedsOnboarding(false);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) {
        console.error("Sign out error:", error);
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });

      // Force full page reload for clean state
      window.location.href = "/";
      return true;
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Check if we're returning from an OAuth redirect (has hash or code params)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthCallback = hashParams.has('access_token') || urlParams.has('code');
        
        if (hasAuthCallback) {
          console.log("OAuth callback detected, processing session...");
          // Give Supabase a moment to process the OAuth callback
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (session?.user && isMounted) {
          console.log("Session found for:", session.user.email);
          setUser(session.user);
          
          // Fetch user data
          const onboardingNeeded = await fetchProfile(session.user.id);
          setNeedsOnboarding(onboardingNeeded);
          
          const adminStatus = await checkAdminRole(session.user.id);
          setIsAdmin(adminStatus);
          
          await fetchNotifications(session.user.id);
          
          // Clean up URL after successful auth (remove hash/code params)
          if (hasAuthCallback) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } else if (hasAuthCallback && isMounted) {
          // Auth callback present but no session - try refreshing once
          console.log("Auth callback present but no session, retrying...");
          const { data: retryData } = await supabase.auth.refreshSession();
          if (retryData.session?.user) {
            setUser(retryData.session.user);
            const onboardingNeeded = await fetchProfile(retryData.session.user.id);
            setNeedsOnboarding(onboardingNeeded);
            const adminStatus = await checkAdminRole(retryData.session.user.id);
            setIsAdmin(adminStatus);
            await fetchNotifications(retryData.session.user.id);
            
            // Clean up URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }
        
        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log("Auth event:", event, session?.user?.email);

        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          
          // Fetch user data - use setTimeout to avoid race condition with profile creation trigger
          setTimeout(async () => {
            if (!isMounted) return;
            const onboardingNeeded = await fetchProfile(session.user.id);
            setNeedsOnboarding(onboardingNeeded);
            
            const adminStatus = await checkAdminRole(session.user.id);
            setIsAdmin(adminStatus);
            
            await fetchNotifications(session.user.id);
            setIsLoading(false);
          }, 100);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setNotifications([]);
          setUnreadCount(0);
          setNeedsOnboarding(false);
          setIsLoading(false);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
        } else if (event === "INITIAL_SESSION" && session?.user) {
          // Handle initial session on page load
          setUser(session.user);
          const onboardingNeeded = await fetchProfile(session.user.id);
          setNeedsOnboarding(onboardingNeeded);
          const adminStatus = await checkAdminRole(session.user.id);
          setIsAdmin(adminStatus);
          await fetchNotifications(session.user.id);
          setIsLoading(false);
        }
      }
    );

    // Then initialize
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, checkAdminRole, fetchNotifications]);

  return {
    user,
    profile,
    isAdmin,
    notifications,
    unreadCount,
    isLoading,
    needsOnboarding,
    setNeedsOnboarding,
    signOut,
    markAllAsRead,
    refreshProfile: () => user && fetchProfile(user.id),
  };
};
