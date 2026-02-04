import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Users, Clock, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

// Simulated live events (would come from database in production)
const mockLiveEvents: LiveEvent[] = [
  { id: "1", title: "Tech Meetup NYC", pulse: 86, participants: 2431, timeLeft: 72, type: "event", category: "Technology" },
  { id: "2", title: "Restaurant Battle: Best Pizza", pulse: 91, participants: 1823, timeLeft: 180, type: "voting", category: "Food" },
  { id: "3", title: "Product Launch: EcoPhone", pulse: 78, participants: 4521, timeLeft: 45, type: "poll", category: "Product" },
  { id: "4", title: "Movie Premiere: Galaxy Quest 2", pulse: 94, participants: 8234, timeLeft: 120, type: "event", category: "Entertainment" },
];

export const LiveNowCarousel = () => {
  const navigate = useNavigate();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(mockLiveEvents);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});

  // Initialize timers
  useEffect(() => {
    const initialTimers: { [key: string]: number } = {};
    liveEvents.forEach((event) => {
      initialTimers[event.id] = event.timeLeft;
    });
    setTimers(initialTimers);
  }, [liveEvents]);

  // Countdown timer
  useEffect(() => {
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
  }, []);

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

  if (liveEvents.length === 0) return null;

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
