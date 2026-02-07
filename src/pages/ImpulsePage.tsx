import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Trophy, Sparkles, Crown, Star, Calendar, Users, Hand, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HourlyJackpot } from "@/components/roulette/HourlyJackpot";
import { CustomEventRoulette } from "@/components/roulette/CustomEventRoulette";
import { SwipeDiscovery } from "@/components/roulette/SwipeDiscovery";
import { DailyWinner } from "@/components/impulse/DailyWinner";
import PointsValueInfo from "@/components/impulse/PointsValueInfo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthModal } from "@/components/auth/AuthModal";

const ImpulsePage = () => {
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | undefined>();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("madness");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useIsMobile();

  const joinCode = searchParams.get("code");

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        setUserId(session?.user?.id);
        setIsAuthLoading(false);
      }
    });

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setUserId(session?.user?.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    initializeAuth();

    // Safety timeout
    const timeout = setTimeout(() => {
      if (isMounted && isAuthLoading) {
        setIsAuthLoading(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (joinCode) {
      setActiveTab("events");
    }
  }, [joinCode]);

  const handleParticipateClick = () => {
    if (!userId) {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <PulseWaveBackground />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-10 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">MAI Impulse</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="neon-text">Win Big, Rise Fast</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Daily winners get featured. Hourly draws reward the community. Fair picks for everyone.
          </p>
        </motion.div>

        {/* Auth Prompt for non-signed in users */}
        {!isAuthLoading && !userId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-primary/10 border border-primary/30 text-center max-w-xl mx-auto"
          >
            <LogIn className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">Sign in to participate</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create or join live events, enter hourly draws, and win rewards.
            </p>
            <Button onClick={() => setShowAuthModal(true)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Get Started
            </Button>
          </motion.div>
        )}

        {/* Daily Winner Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <DailyWinner />
        </motion.div>

        {/* Tab Navigation - MAI Madness First */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn(
            "grid w-full max-w-md mx-auto mb-8 bg-secondary/30 border border-white/5 p-1.5 rounded-2xl",
            isMobile ? "grid-cols-3" : "grid-cols-2"
          )}>
            <TabsTrigger 
              value="madness" 
              className="flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-3"
            >
              <Crown className="w-4 h-4" />
              <span>MAI Madness</span>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-3"
            >
              <Sparkles className="w-4 h-4" />
              <span>Live Events</span>
            </TabsTrigger>
            {isMobile && (
              <TabsTrigger 
                value="swipe" 
                className="flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-3"
              >
                <Hand className="w-4 h-4" />
                <span>Swipe</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* MAI Madness - Primary Tab */}
          <TabsContent value="madness" className="mt-0">
            {isAuthLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <HourlyJackpot userId={userId} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  {[
                    { label: "Total Won Today", value: "25,000", suffix: "pts", icon: Trophy },
                    { label: "Draws Today", value: "5", suffix: "", icon: Calendar },
                    { label: "Unique Winners", value: "5", suffix: "", icon: Star },
                    { label: "Active Players", value: "127", suffix: "", icon: Users },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-2xl bg-secondary/20 border border-white/5 text-center"
                    >
                      <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                        {stat.suffix && <span className="text-sm text-muted-foreground ml-1">{stat.suffix}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Live Events */}
          <TabsContent value="events" className="mt-0">
            {isAuthLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <CustomEventRoulette userId={userId} />
            )}
          </TabsContent>

          {/* Swipe Discovery - Mobile Only */}
          {isMobile && (
            <TabsContent value="swipe" className="mt-0">
              <SwipeDiscovery />
            </TabsContent>
          )}
        </Tabs>

        {/* Points Value Information */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <PointsValueInfo />
        </motion.div>

        {/* Info Section */}
        <motion.div
          className="mt-8 grid md:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-6 rounded-2xl bg-secondary/20 border border-border/50">
            <Sparkles className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Live Events</h3>
            <p className="text-sm text-muted-foreground">
              Create fair picks for giveaways, raffles, or group decisions. Everyone gets an equal chance.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/20 border border-border/50">
            <Crown className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">MAI Madness</h3>
            <p className="text-sm text-muted-foreground">
              Enter for free every hour. One lucky winner takes home 5,000 MAI points when the clock strikes.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default ImpulsePage;
