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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        setUserId(session?.user?.id);
        setIsAuthLoading(false);
      }
    });

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

  return (
    <div className="min-h-screen pt-20 pb-12">
      <PulseWaveBackground />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8 pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wide">MAI IMPULSE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="neon-text">Earn. Engage. Rise.</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Your momentum in the digital trust economy. Every action strengthens your signal.
          </p>
        </motion.div>

        {/* Auth Prompt for non-signed in users */}
        {!isAuthLoading && !userId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-2xl bg-primary/5 border border-primary/20 text-center max-w-lg mx-auto"
          >
            <LogIn className="w-7 h-7 text-primary mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Join the Movement</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to earn Impulse, enter jackpots, and build your public pulse.
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

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn(
            "grid w-full max-w-sm mx-auto mb-8 bg-secondary/30 border border-white/5 p-1 rounded-xl",
            isMobile ? "grid-cols-3" : "grid-cols-2"
          )}>
            <TabsTrigger 
              value="madness" 
              className="flex items-center justify-center gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-2.5 text-sm"
            >
              <Crown className="w-4 h-4" />
              <span>Madness</span>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex items-center justify-center gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-2.5 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Events</span>
            </TabsTrigger>
            {isMobile && (
              <TabsTrigger 
                value="swipe" 
                className="flex items-center justify-center gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all py-2.5 text-sm"
              >
                <Hand className="w-4 h-4" />
                <span>Swipe</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* MAI Madness Tab */}
          <TabsContent value="madness" className="mt-0">
            {isAuthLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <HourlyJackpot userId={userId} />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                  {[
                    { label: "Won Today", value: "25K", suffix: "impulse", icon: Trophy },
                    { label: "Draws Today", value: "5", suffix: "", icon: Calendar },
                    { label: "Winners", value: "5", suffix: "", icon: Star },
                    { label: "Active", value: "127", suffix: "", icon: Users },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl bg-secondary/20 border border-white/5 text-center"
                    >
                      <stat.icon className="w-4 h-4 text-primary mx-auto mb-2" />
                      <p className="text-xl font-bold text-foreground">
                        {stat.value}
                        {stat.suffix && <span className="text-xs text-muted-foreground ml-1">{stat.suffix}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
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
          transition={{ delay: 0.3 }}
        >
          <PointsValueInfo />
        </motion.div>

        {/* Quick Info Cards */}
        <motion.div
          className="mt-8 grid md:grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-5 rounded-xl bg-secondary/20 border border-border/50">
            <Sparkles className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1.5">Live Events</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create fair picks for giveaways, raffles, or group decisions. Everyone gets an equal chance.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-secondary/20 border border-border/50">
            <Crown className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1.5">MAI Madness</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter for free every hour. One lucky winner takes home 5,000 MAI Impulse when the clock strikes.
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
