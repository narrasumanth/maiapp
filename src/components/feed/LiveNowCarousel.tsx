import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Users, Clock, Zap, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface LiveEvent {
  id: string;
  title: string;
  pulse: number;
  participants: number;
  timeLeft: number;
  type: "event" | "poll" | "voting";
  category: string;
}

export const LiveNowCarousel = () => {
  const navigate = useNavigate();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});

  // Fetch real live events from database
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("custom_roulettes")
          .select("id, title, created_at, status, timer_seconds")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching live events:", error);
          setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Get participant counts for each event
          const eventsWithParticipants = await Promise.all(
            data.map(async (event) => {
              const { count } = await supabase
                .from("roulette_participants")
                .select("*", { count: "exact", head: true })
                .eq("roulette_id", event.id);

              return {
                id: event.id,
                title: event.title,
                pulse: Math.floor(Math.random() * 20) + 75, // Placeholder pulse
                participants: count || 0,
                timeLeft: event.timer_seconds || 180,
                type: "event" as const,
                category: "Live Event",
              };
            })
          );

          setLiveEvents(eventsWithParticipants);
          
          // Initialize timers
          const initialTimers: { [key: string]: number } = {};
          eventsWithParticipants.forEach((event) => {
            initialTimers[event.id] = event.timeLeft;
          });
          setTimers(initialTimers);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("live-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "custom_roulettes" },
        () => fetchLiveEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (liveEvents.length === 0) return;

    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key] > 0) updated[key] -= 1;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [liveEvents]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPulseColor = (pulse: number) => {
    if (pulse >= 85) return "text-score-green";
    if (pulse >= 70) return "text-primary";
    if (pulse >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? liveEvents.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === liveEvents.length - 1 ? 0 : prev + 1));
  };

  const handleJoin = (eventId: string) => {
    navigate(`/impulse?tab=events`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-24 h-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Empty state - no live events
  if (liveEvents.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <Radio className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-muted-foreground">Live Now</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-8 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-border/50 overflow-hidden"
        >
          {/* Subtle animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <div className="relative z-10 text-center max-w-md mx-auto">
            <motion.div
              className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>

            <h3 className="text-lg font-semibold mb-2">
              Waiting for the pulse to rise...
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              No live events right now. Be the first to create one or check back soon — 
              the next wave of real-time sentiment is just around the corner.
            </p>

            <Button
              onClick={() => navigate("/impulse?tab=events")}
              variant="outline"
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Create Live Event
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-5 h-5 text-score-red" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-score-red rounded-full animate-pulse" />
          </div>
          <h2 className="text-xl font-bold">Live Now</h2>
          <span className="text-xs bg-score-red/20 text-score-red px-2 py-0.5 rounded-full font-medium">
            {liveEvents.length} active
          </span>
        </div>
        
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {liveEvents.slice(currentIndex, currentIndex + 2).map((event) => (
              <motion.div
                key={event.id}
                className="relative p-6 rounded-2xl bg-gradient-to-br from-secondary/40 to-secondary/20 border border-white/10 overflow-hidden group"
                whileHover={{ scale: 1.02 }}
              >
                {/* Breathing pulse effect */}
                <motion.div
                  className="absolute inset-0 bg-primary/5"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        {event.category}
                      </span>
                      <h3 className="text-lg font-bold mt-1">{event.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-score-red/20 border border-score-red/30">
                      <span className="w-1.5 h-1.5 bg-score-red rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-score-red">LIVE</span>
                    </div>
                  </div>

                  {/* Pulse Score */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground">Pulse</span>
                      <motion.span
                        className={cn("text-4xl font-black", getPulseColor(event.pulse))}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {event.pulse}
                      </motion.span>
                    </div>
                    
                    <div className="h-8 w-px bg-border" />
                    
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">{event.participants.toLocaleString()}</span>
                      <span className="text-xs">voting</span>
                    </div>
                  </div>

                  {/* Timer & Join */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-lg">
                        {formatTime(timers[event.id] || 0)}
                      </span>
                      <span className="text-xs">left</span>
                    </div>
                    
                    <Button
                      onClick={() => handleJoin(event.id)}
                      className="gap-2 group-hover:bg-primary"
                    >
                      <Zap className="w-4 h-4" />
                      JOIN
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
        {liveEvents.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex ? "w-6 bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};
