import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Sparkles, Meh, Moon, Lightbulb, Send, 
  User, EyeOff, RefreshCw, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Random name generator for anonymous users
const ADJECTIVES = [
  "Swift", "Cosmic", "Silent", "Neon", "Mystic", "Blazing", "Frozen", "Golden",
  "Shadow", "Thunder", "Crystal", "Phantom", "Electric", "Lunar", "Solar", "Quantum"
];

const NOUNS = [
  "Phoenix", "Wolf", "Hawk", "Tiger", "Dragon", "Panther", "Fox", "Eagle",
  "Lion", "Falcon", "Cobra", "Raven", "Bear", "Shark", "Viper", "Owl"
];

const generateRandomName = (): string => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
};

interface EventPulse {
  id: string;
  roulette_id: string;
  user_id: string;
  display_name: string;
  is_anonymous: boolean;
  pulse_type: "excited" | "neutral" | "bored" | "suggestion";
  message: string | null;
  created_at: string;
}

interface LiveEventPulseProps {
  rouletteId: string;
  userId?: string;
  isHost?: boolean;
}

const PULSE_TYPES = [
  { id: "excited", icon: Sparkles, label: "🔥 Excited", color: "text-score-green" },
  { id: "neutral", icon: Meh, label: "😐 Neutral", color: "text-muted-foreground" },
  { id: "bored", icon: Moon, label: "😴 Slow", color: "text-score-yellow" },
  { id: "suggestion", icon: Lightbulb, label: "💡 Idea", color: "text-primary" },
] as const;

export const LiveEventPulse = ({ rouletteId, userId, isHost = false }: LiveEventPulseProps) => {
  const { toast } = useToast();
  const [pulses, setPulses] = useState<EventPulse[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [randomName, setRandomName] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPulse, setSelectedPulse] = useState<string | null>(null);
  const [realDisplayName, setRealDisplayName] = useState<string>("");

  // Generate random name on mount
  useEffect(() => {
    setRandomName(generateRandomName());
  }, []);

  // Fetch user's real display name
  useEffect(() => {
    if (!userId) return;
    
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("user_id", userId)
        .single();
      
      if (data) {
        setRealDisplayName(data.display_name || data.username || "MAI User");
      }
    };
    
    fetchProfile();
  }, [userId]);

  // Fetch pulses and subscribe to realtime updates
  useEffect(() => {
    const fetchPulses = async () => {
      const { data } = await supabase
        .from("event_pulses")
        .select("*")
        .eq("roulette_id", rouletteId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (data) {
        setPulses(data as EventPulse[]);
        
        // Check if current user has a pulse
        const userPulse = data.find((p) => p.user_id === userId);
        if (userPulse) {
          setSelectedPulse(userPulse.pulse_type);
        }
      }
    };

    fetchPulses();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`pulses_${rouletteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "event_pulses",
          filter: `roulette_id=eq.${rouletteId}`,
        },
        () => {
          fetchPulses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rouletteId, userId]);

  const handlePulseSubmit = async (pulseType: string) => {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to share your pulse",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const displayName = isAnonymous ? randomName : realDisplayName;
      
      // Check if user already has a pulse for this event
      const { data: existing } = await supabase
        .from("event_pulses")
        .select("id")
        .eq("roulette_id", rouletteId)
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Update existing pulse
        await supabase
          .from("event_pulses")
          .update({
            pulse_type: pulseType,
            display_name: displayName,
            is_anonymous: isAnonymous,
            message: pulseType === "suggestion" ? suggestion : null,
          })
          .eq("id", existing.id);
      } else {
        // Create new pulse
        await supabase
          .from("event_pulses")
          .insert({
            roulette_id: rouletteId,
            user_id: userId,
            display_name: displayName,
            is_anonymous: isAnonymous,
            pulse_type: pulseType,
            message: pulseType === "suggestion" ? suggestion : null,
          });
      }

      setSelectedPulse(pulseType);
      setSuggestion("");
      
      toast({
        title: "Pulse shared!",
        description: isAnonymous ? `Shared as ${randomName}` : "Your feedback is live",
      });
    } catch (error) {
      console.error("Error submitting pulse:", error);
      toast({
        title: "Error",
        description: "Failed to share pulse",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateRandomName = () => {
    setRandomName(generateRandomName());
  };

  // Calculate pulse stats
  const pulseStats = PULSE_TYPES.map((type) => ({
    ...type,
    count: pulses.filter((p) => p.pulse_type === type.id).length,
  }));

  const totalPulses = pulses.length;
  const suggestions = pulses.filter((p) => p.pulse_type === "suggestion" && p.message);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Live Pulse
          {totalPulses > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {totalPulses} active
            </span>
          )}
        </h3>
      </div>

      {/* Pulse Stats Bar */}
      {totalPulses > 0 && (
        <div className="mb-4">
          <div className="flex h-3 rounded-full overflow-hidden bg-secondary/30">
            {pulseStats.map((stat) => (
              stat.count > 0 && (
                <motion.div
                  key={stat.id}
                  initial={{ width: 0 }}
                  animate={{ width: `${(stat.count / totalPulses) * 100}%` }}
                  className={cn(
                    "h-full",
                    stat.id === "excited" && "bg-score-green",
                    stat.id === "neutral" && "bg-muted-foreground",
                    stat.id === "bored" && "bg-score-yellow",
                    stat.id === "suggestion" && "bg-primary"
                  )}
                />
              )
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {pulseStats.map((stat) => (
              <div key={stat.id} className="flex items-center gap-1 text-xs">
                <stat.icon className={cn("w-3 h-3", stat.color)} />
                <span className="text-muted-foreground">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anonymous Name Toggle */}
      {userId && (
        <div className="p-3 rounded-xl bg-secondary/20 border border-white/5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isAnonymous ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
              <Label className="text-sm">Hide my identity</Label>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
          
          {isAnonymous && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 border border-white/5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium">{randomName}</span>
                <span className="text-xs text-muted-foreground">MAI Tag</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={regenerateRandomName}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          
          {!isAnonymous && (
            <p className="text-xs text-muted-foreground mt-1">
              Visible as: <span className="text-foreground">{realDisplayName}</span>
            </p>
          )}
        </div>
      )}

      {/* Pulse Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PULSE_TYPES.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => type.id !== "suggestion" && handlePulseSubmit(type.id)}
            disabled={isSubmitting}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
              selectedPulse === type.id
                ? "bg-primary/20 border-2 border-primary"
                : "bg-secondary/20 border border-white/5 hover:bg-secondary/40"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <type.icon className={cn("w-5 h-5", type.color)} />
            <span className="text-xs">{type.label.split(" ")[0]}</span>
          </motion.button>
        ))}
      </div>

      {/* Suggestion Input */}
      <div className="flex gap-2 mb-4">
        <Input
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Share a suggestion..."
          maxLength={200}
          className="text-sm"
        />
        <Button
          size="icon"
          onClick={() => handlePulseSubmit("suggestion")}
          disabled={!suggestion.trim() || isSubmitting}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggestions Feed */}
      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <p className="text-xs text-muted-foreground font-medium">💡 Suggestions</p>
          {suggestions.map((pulse) => (
            <motion.div
              key={pulse.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 p-2 rounded-lg bg-secondary/20"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                {pulse.is_anonymous ? (
                  <Shield className="w-3 h-3 text-primary" />
                ) : (
                  <User className="w-3 h-3 text-foreground/70" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{pulse.display_name}</span>
                  {pulse.is_anonymous && (
                    <span className="text-[10px] text-primary bg-primary/10 px-1 rounded">MAI</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(pulse.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground break-words">{pulse.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {pulses.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Be the first to share your pulse!
        </p>
      )}
    </GlassCard>
  );
};
