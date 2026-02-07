import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Link2, Sparkles, Search, Plus, MessageSquare, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ClaimedProfileCard } from "@/components/dashboard/ClaimedProfileCard";
import { ProfileEditModal } from "@/components/dashboard/ProfileEditModal";
import { ProfileShareModal } from "@/components/dashboard/ProfileShareModal";
import { ProfileVisitors } from "@/components/dashboard/ProfileVisitors";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { ClaimDisputesSection } from "@/components/dashboard/ClaimDisputesSection";
import { PointsActivityCard } from "@/components/dashboard/PointsActivityCard";
import { MessagesInbox } from "@/components/dashboard/MessagesInbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  trust_score: number;
  email_verified: boolean;
  phone_verified: boolean;
}

interface ClaimedEntity {
  id: string;
  name: string;
  category: string;
  is_verified: boolean;
  normalized_name: string;
  about?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  location?: string | null;
  social_links?: Array<{ platform: string; url: string }> | null;
  image_url?: string | null;
  visitor_count?: number;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [claimedEntities, setClaimedEntities] = useState<ClaimedEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [editEntity, setEditEntity] = useState<ClaimedEntity | null>(null);
  const [shareEntity, setShareEntity] = useState<ClaimedEntity | null>(null);
  
  // View state - check URL for settings tab
  const [showSettings, setShowSettings] = useState(searchParams.get('tab') === 'settings');
  const [activeSection, setActiveSection] = useState<string>("overview");

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (does NOT control isLoading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log("Dashboard auth event:", event);
        
        if (event === "SIGNED_OUT") {
          navigate("/");
        } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
          setUser(session.user);
          // Fire and forget - don't await, don't control loading
          Promise.all([
            fetchProfile(session.user.id),
            fetchClaimedEntities(session.user.id),
          ]).catch(err => console.error("Error fetching data:", err));
        }
      }
    );

    // INITIAL load (controls isLoading)
    const initializeAuth = async () => {
      try {
        // Check if we're returning from an OAuth redirect
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthCallback = hashParams.has('access_token') || 
                                hashParams.has('refresh_token') ||
                                urlParams.has('code') ||
                                urlParams.has('access_token');
        
        if (hasAuthCallback) {
          console.log("Dashboard: Auth callback detected, waiting for session processing...");
          // Give more time for OAuth callback processing
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        let session = null;
        let attempts = 0;
        const maxAttempts = hasAuthCallback ? 3 : 1;
        
        // Try to get session with retries for OAuth callbacks
        while (attempts < maxAttempts) {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Session error:", error);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500));
              continue;
            }
            if (isMounted) navigate("/");
            return;
          }
          
          if (data.session?.user) {
            session = data.session;
            break;
          }
          
          // No session yet, try refreshing if auth callback present
          if (hasAuthCallback && attempts < maxAttempts - 1) {
            console.log("Dashboard: Trying session refresh, attempt:", attempts + 1);
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData.session?.user) {
              session = refreshData.session;
              break;
            }
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!session?.user) {
          console.log("Dashboard: No session found after attempts");
          if (isMounted) navigate("/");
          return;
        }
        
        if (!isMounted) return;
        
        setUser(session.user);
        
        // Clean up URL if there were auth params
        if (hasAuthCallback) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        
        // Fetch data BEFORE setting loading false
        await Promise.all([
          fetchProfile(session.user.id),
          fetchClaimedEntities(session.user.id),
        ]).catch(err => console.error("Error fetching data:", err));
        
      } catch (err) {
        console.error("Auth check error:", err);
        if (isMounted) navigate("/");
      } finally {
        // CRITICAL: Only set loading false AFTER all async operations complete
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Update URL when settings view changes
  useEffect(() => {
    if (showSettings) {
      setSearchParams({ tab: 'settings' });
    } else {
      setSearchParams({});
    }
  }, [showSettings, setSearchParams]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, trust_score, email_verified, phone_verified")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Exception fetching profile:", err);
    }
  };

  const fetchClaimedEntities = async (userId: string) => {
    // Fetch entities with all editable fields
    const { data: entities } = await supabase
      .from("entities")
      .select("id, name, category, is_verified, normalized_name, about, contact_email, contact_phone, website_url, location, social_links, image_url")
      .eq("claimed_by", userId);

    if (entities && entities.length > 0) {
      // Fetch visitor counts for each entity
      const entityIds = entities.map(e => e.id);
      const { data: visitCounts } = await supabase
        .from("entity_visits")
        .select("entity_id")
        .in("entity_id", entityIds);

      // Count visits per entity
      const countMap: Record<string, number> = {};
      visitCounts?.forEach(v => {
        countMap[v.entity_id] = (countMap[v.entity_id] || 0) + 1;
      });

      // Merge counts and cast social_links
      const entitiesWithCounts: ClaimedEntity[] = entities.map(e => ({
        ...e,
        visitor_count: countMap[e.id] || 0,
        social_links: Array.isArray(e.social_links) 
          ? e.social_links as Array<{ platform: string; url: string }>
          : null,
      }));

      setClaimedEntities(entitiesWithCounts);
    } else {
      setClaimedEntities([]);
    }
  };

  const handleEditSave = () => {
    if (user) {
      fetchClaimedEntities(user.id);
    }
  };

  // Show loading spinner while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Safety check: If loading is done but no user, show error state
  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Session expired or not found</p>
          <Link 
            to="/" 
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const MAX_PROFILES = 4;
  const canClaimMore = claimedEntities.length < MAX_PROFILES;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <PulseWaveBackground />

      <div className="container mx-auto px-4 relative z-10 pt-8 max-w-3xl">
        {showSettings ? (
          <SettingsPanel 
            userId={user.id} 
            onBack={() => setShowSettings(false)} 
          />
        ) : (
          <>
            {/* Header Card */}
            <div className="mb-6 fade-in-up">
              <DashboardHeader 
                profile={profile}
                email={user.email || ""}
                onSettingsClick={() => setShowSettings(true)}
              />
            </div>

            {/* Dashboard Tabs */}
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary/30 border border-white/5 p-1 rounded-xl">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Profiles
                </TabsTrigger>
                <TabsTrigger 
                  value="points" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Points
                </TabsTrigger>
                <TabsTrigger 
                  value="messages" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </TabsTrigger>
              </TabsList>

              {/* Profiles Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Profile Visitors Stats */}
                {claimedEntities.length > 0 && (
                  <div className="fade-in-up">
                    <ProfileVisitors entityIds={claimedEntities.map(e => e.id)} />
                  </div>
                )}

                {/* Claim Disputes Section */}
                <div className="fade-in-up">
                  <ClaimDisputesSection userId={user.id} />
                </div>

                {/* Claimed Profiles Section */}
                <div className="fade-in-up">
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">Your Profiles</h2>
                      </div>
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
                        {claimedEntities.length} / {MAX_PROFILES} slots
                      </span>
                    </div>

                    {claimedEntities.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">
                          You haven't claimed any profiles yet
                        </p>
                        <Link
                          to="/"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                        >
                          <Search className="w-4 h-4" />
                          Search & Claim
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {claimedEntities.map((entity) => (
                          <ClaimedProfileCard
                            key={entity.id}
                            entity={entity}
                            onEdit={setEditEntity}
                            onShare={setShareEntity}
                          />
                        ))}

                        {/* Claim More Button */}
                        {canClaimMore && (
                          <Link
                            to="/"
                            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all"
                          >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">Claim Another Profile</span>
                            <span className="text-xs">({MAX_PROFILES - claimedEntities.length} remaining)</span>
                          </Link>
                        )}
                      </div>
                    )}
                  </GlassCard>
                </div>

                {/* Quick Actions */}
                <div className="fade-in-up">
                  <Link
                    to="/flex"
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Create Flex Card</p>
                        <p className="text-sm text-muted-foreground">Share your digital identity</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </TabsContent>

              {/* Points Tab */}
              <TabsContent value="points" className="mt-0">
                <PointsActivityCard userId={user.id} />
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="mt-0">
                <MessagesInbox 
                  userId={user.id} 
                  claimedEntityIds={claimedEntities.map(e => e.id)} 
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={!!editEntity}
        onClose={() => setEditEntity(null)}
        entity={editEntity}
        onSave={handleEditSave}
      />

      <ProfileShareModal
        isOpen={!!shareEntity}
        onClose={() => setShareEntity(null)}
        entity={shareEntity}
      />
    </div>
  );
};

export default DashboardPage;
