import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dice5, Trophy, Sparkles, Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HourlyJackpot } from "@/components/roulette/HourlyJackpot";
import { CustomEventRoulette } from "@/components/roulette/CustomEventRoulette";
import { OriginalRoulette } from "@/components/roulette/OriginalRoulette";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RoulettePage = () => {
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("jackpot");

  // Check for join code in URL
  const joinCode = searchParams.get("code");

  // Get current user
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

  // If there's a join code, show the custom roulette in join mode
  useEffect(() => {
    if (joinCode) {
      setActiveTab("events");
    }
  }, [joinCode]);

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-amber-500/5" />
        <div className="absolute inset-0 grid-background opacity-30" />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/30"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-10 pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 mb-4">
            <Dice5 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">MAI Roulette</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-purple-400 to-amber-400 bg-clip-text text-transparent">
              Spin to Win
            </span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Enter the hourly jackpot for free points, host your own giveaway, or let the AI decide your next choice.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 bg-secondary/50 p-1">
            <TabsTrigger 
              value="jackpot" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Hourly</span> Jackpot
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-purple-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Custom</span> Events
            </TabsTrigger>
            <TabsTrigger 
              value="decision" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20"
            >
              <Zap className="w-4 h-4" />
              Decision Wheel
            </TabsTrigger>
          </TabsList>

          {/* Hourly Jackpot Tab */}
          <TabsContent value="jackpot" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <HourlyJackpot userId={userId} />

              {/* Stats Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { label: "Total Won Today", value: "25,000", suffix: "pts" },
                  { label: "Draws Today", value: "5", suffix: "" },
                  { label: "Unique Winners", value: "5", suffix: "" },
                  { label: "Your Wins", value: "0", suffix: "" },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="p-4 rounded-xl bg-secondary/30 border border-white/5 text-center"
                  >
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

          {/* Custom Events Tab */}
          <TabsContent value="events" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CustomEventRoulette userId={userId} />
            </motion.div>
          </TabsContent>

          {/* Decision Wheel Tab */}
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
            <Trophy className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="font-semibold mb-2">Hourly Jackpot</h3>
            <p className="text-sm text-muted-foreground">
              Enter for free every hour. One lucky winner takes home 5,000 MAI points when the clock strikes.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5">
            <Sparkles className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Host Your Own</h3>
            <p className="text-sm text-muted-foreground">
              Create verifiable draws for giveaways, raffles, and events. Share a QR code and pick winners fairly.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/20 border border-white/5">
            <Zap className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="font-semibold mb-2">AI-Weighted Decisions</h3>
            <p className="text-sm text-muted-foreground">
              Can't decide? Add your options and let the algorithm choose. Higher reputation scores get better odds.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RoulettePage;
