import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Trophy, Sparkles, Crown, Star, Calendar, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HourlyJackpot } from "@/components/roulette/HourlyJackpot";
import { CustomEventRoulette } from "@/components/roulette/CustomEventRoulette";
import { OriginalRoulette } from "@/components/roulette/OriginalRoulette";
import { DailyWinner } from "@/components/impulse/DailyWinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";

const ImpulsePage = () => {
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("madness");

  const joinCode = searchParams.get("code");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
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
            Daily winners get featured. Hourly draws reward the community. Let fate decide with AI-powered decisions.
          </p>
        </motion.div>

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
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 bg-secondary/30 border border-white/5 p-1.5 rounded-2xl">
            <TabsTrigger 
              value="madness" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">MAI</span> Madness
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Live</span> Events
            </TabsTrigger>
            <TabsTrigger 
              value="decision" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Zap className="w-4 h-4" />
              AI Decide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="madness" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <HourlyJackpot userId={userId} />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { label: "Total Won Today", value: "25,000", suffix: "pts", icon: Trophy },
                  { label: "Draws Today", value: "5", suffix: "", icon: Calendar },
                  { label: "Unique Winners", value: "5", suffix: "", icon: Star },
                  { label: "Active Players", value: "127", suffix: "", icon: Users },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="p-4 rounded-2xl bg-secondary/20 border border-white/5 text-center"
                  >
                    <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                      {stat.suffix && <span className="text-sm text-muted-foreground ml-1">{stat.suffix}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CustomEventRoulette userId={userId} />
            </motion.div>
          </TabsContent>

          <TabsContent value="decision" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <OriginalRoulette />
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <motion.div
          className="mt-12 grid md:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5">
            <Crown className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">MAI Madness</h3>
            <p className="text-sm text-muted-foreground">
              Enter for free every hour. One lucky winner takes home 5,000 MAI points when the clock strikes.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5">
            <Star className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Daily Spotlight</h3>
            <p className="text-sm text-muted-foreground">
              Win the daily draw and get featured on the platform. Your profile becomes visible to everyone for 24 hours.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5">
            <Zap className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">AI-Weighted Decisions</h3>
            <p className="text-sm text-muted-foreground">
              Can't decide? Add your options and let the algorithm choose. Higher reputation gets better odds.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ImpulsePage;
