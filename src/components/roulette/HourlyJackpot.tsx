import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Clock, Users, Zap, Check, PartyPopper, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  user_id: string;
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
}

interface HourlyJackpotProps {
  userId?: string;
}

export const HourlyJackpot = ({ userId }: HourlyJackpotProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const [isRegistered, setIsRegistered] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [prizeAmount] = useState(5000);
  const [isLoading, setIsLoading] = useState(false);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [lastWinner, setLastWinner] = useState<{ name: string; amount: number } | null>(null);
  const [recentJoins, setRecentJoins] = useState<{ name: string; id: string }[]>([]);

  const getCurrentHourSlot = useCallback(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString();
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const diff = nextHour.getTime() - now.getTime();
      
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!userId) return;
      
      const hourSlot = getCurrentHourSlot();
      const { data } = await supabase
        .from("hourly_pool")
        .select("id")
        .eq("user_id", userId)
        .eq("hour_slot", hourSlot)
        .maybeSingle();
      
      setIsRegistered(!!data);
    };

    checkRegistration();
  }, [userId, getCurrentHourSlot]);

  useEffect(() => {
    const hourSlot = getCurrentHourSlot();
    
    const fetchParticipants = async () => {
      const { data, count } = await supabase
        .from("hourly_pool")
        .select("*", { count: "exact" })
        .eq("hour_slot", hourSlot)
        .order("joined_at", { ascending: false })
        .limit(10);
      
      if (data) {
        setParticipants(data);
        setParticipantCount(count || 0);
      }
    };

    fetchParticipants();

    const channel = supabase
      .channel("hourly_pool_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hourly_pool",
          filter: `hour_slot=eq.${hourSlot}`,
        },
        (payload) => {
          setParticipantCount((prev) => prev + 1);
          setRecentJoins((prev) => [
            { name: `User_${(payload.new as Participant).user_id.slice(0, 4)}`, id: (payload.new as Participant).id },
            ...prev.slice(0, 4),
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getCurrentHourSlot]);

  useEffect(() => {
    const fetchLastWinner = async () => {
      const { data } = await supabase
        .from("hourly_draws")
        .select("*, profiles:winner_id(display_name)")
        .order("draw_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setLastWinner({
          name: (data.profiles as unknown as { display_name: string })?.display_name || "Anonymous",
          amount: data.prize_amount,
        });
      }
    };

    fetchLastWinner();

    // Subscribe to new draws for real-time winner announcements
    const drawChannel = supabase
      .channel("hourly_draws_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hourly_draws",
        },
        async (payload) => {
          const newDraw = payload.new as { winner_id: string; prize_amount: number };
          
          // Check if current user is the winner
          if (userId && newDraw.winner_id === userId) {
            setShowWinAnimation(true);
            setTimeout(() => setShowWinAnimation(false), 8000);
            toast({
              title: "🎉 JACKPOT WINNER!",
              description: `Congratulations! You won ${newDraw.prize_amount.toLocaleString()} MAI Points!`,
            });
          }
          
          // Fetch winner profile info
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", newDraw.winner_id)
            .maybeSingle();
          
          setLastWinner({
            name: profile?.display_name || "Anonymous",
            amount: newDraw.prize_amount,
          });

          // Reset registration for new round
          setIsRegistered(false);
          setParticipantCount(0);
          setRecentJoins([]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(drawChannel);
    };
  }, [userId, toast]);

  const handleEnterRound = async () => {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to enter MAI Madness",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const hourSlot = getCurrentHourSlot();

    try {
      const { error } = await supabase.from("hourly_pool").insert({
        user_id: userId,
        hour_slot: hourSlot,
        device_fingerprint: navigator.userAgent,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already registered",
            description: "You're already in this round!",
          });
          setIsRegistered(true);
        } else {
          throw error;
        }
      } else {
        setIsRegistered(true);
        toast({
          title: "You're in! 🎰",
          description: "Good luck in the next draw!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enter round. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Main Jackpot Card - Professional deep blue gradient */}
      <div className="relative rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/30 to-primary/10 border border-primary/20 p-8 overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl"
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/20 border border-primary/30">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">MAI Madness</h2>
                <p className="text-sm text-muted-foreground">Every hour, one winner takes all</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-score-green/10 border border-score-green/30">
              <div className="w-2 h-2 rounded-full bg-score-green animate-pulse" />
              <span className="text-sm font-medium text-score-green">LIVE</span>
            </div>
          </div>

          {/* Timer and Prize */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Countdown Timer */}
            <div className="text-center p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-white/5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Next Draw In</span>
              </div>
              <div className="flex justify-center items-center gap-2">
                {/* Minutes */}
                <div className="flex gap-1">
                  <motion.div
                    key={`m1-${formatTime(timeLeft.minutes)[0]}`}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    className="w-14 h-18 rounded-xl bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center"
                  >
                    <span className="text-3xl font-black text-primary">{formatTime(timeLeft.minutes)[0]}</span>
                  </motion.div>
                  <motion.div
                    key={`m2-${formatTime(timeLeft.minutes)[1]}`}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    className="w-14 h-18 rounded-xl bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center"
                  >
                    <span className="text-3xl font-black text-primary">{formatTime(timeLeft.minutes)[1]}</span>
                  </motion.div>
                </div>
                <span className="text-2xl font-bold text-muted-foreground">:</span>
                {/* Seconds */}
                <div className="flex gap-1">
                  <motion.div
                    key={`s1-${formatTime(timeLeft.seconds)[0]}`}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    className="w-14 h-18 rounded-xl bg-gradient-to-b from-muted/30 to-muted/10 border border-white/10 flex items-center justify-center"
                  >
                    <span className="text-3xl font-black text-muted-foreground">{formatTime(timeLeft.seconds)[0]}</span>
                  </motion.div>
                  <motion.div
                    key={`s2-${formatTime(timeLeft.seconds)[1]}`}
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    className="w-14 h-18 rounded-xl bg-gradient-to-b from-muted/30 to-muted/10 border border-white/10 flex items-center justify-center"
                  >
                    <span className="text-3xl font-black text-muted-foreground">{formatTime(timeLeft.seconds)[1]}</span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Prize Amount */}
            <div className="text-center p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-white/5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Current Jackpot</span>
              </div>
              <motion.div
                className="flex items-center justify-center"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-8 h-8 text-primary mr-2" />
                <span className="text-5xl font-black text-primary">{prizeAmount.toLocaleString()}</span>
                <span className="text-xl font-semibold text-muted-foreground ml-2">pts</span>
              </motion.div>
            </div>
          </div>

          {/* Enter Button */}
          <div className="flex flex-col items-center gap-4">
            <motion.button
              onClick={handleEnterRound}
              disabled={isRegistered || isLoading || !userId}
              className={cn(
                "w-full max-w-md py-5 px-8 rounded-2xl font-bold text-lg transition-all",
                isRegistered
                  ? "bg-score-green/10 border-2 border-score-green/30 text-score-green cursor-default"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              )}
              whileHover={!isRegistered ? { scale: 1.02 } : {}}
              whileTap={!isRegistered ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Entering...
                </span>
              ) : isRegistered ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-6 h-6" />
                  REGISTERED FOR THIS ROUND
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6" />
                  ENTER ROUND
                </span>
              )}
            </motion.button>

            {!userId && (
              <p className="text-sm text-muted-foreground">Sign in to participate</p>
            )}
          </div>

          {/* Live Participant Feed */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold">{participantCount} Participants</span>
              </div>
              {lastWinner && (
                <div className="text-sm text-muted-foreground">
                  Last winner: <span className="text-primary font-medium">{lastWinner.name}</span> won{" "}
                  <span className="text-primary font-medium">{lastWinner.amount.toLocaleString()} pts</span>
                </div>
              )}
            </div>

            {/* Recent Joins Ticker */}
            <div className="overflow-hidden h-10">
              <AnimatePresence mode="popLayout">
                {recentJoins.map((join) => (
                  <motion.div
                    key={join.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="w-2 h-2 rounded-full bg-score-green animate-pulse" />
                    <span className="text-foreground font-medium">{join.name}</span> just joined...
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Win Animation Overlay */}
      <AnimatePresence>
        {showWinAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 5 }}
              >
                <PartyPopper className="w-32 h-32 text-primary mx-auto mb-6" />
              </motion.div>
              <h1 className="text-6xl font-black text-primary mb-4">YOU WON!</h1>
              <p className="text-2xl text-foreground">
                <Zap className="w-8 h-8 inline text-primary" /> {prizeAmount.toLocaleString()} MAI Points
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
