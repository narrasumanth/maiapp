import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, User, Mail, Ticket, PartyPopper, X, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";
import { GlassCard } from "@/components/GlassCard";

interface RouletteEvent {
  id: string;
  title: string;
  status: string;
  winners_count: number;
  timer_seconds: number;
  access_code: string;
}

interface Participant {
  id: string;
  display_name: string | null;
  is_winner: boolean;
}

const JoinEventPage = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get code from either URL param or query string
  const accessCode = code || searchParams.get("code") || "";

  const [event, setEvent] = useState<RouletteEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<"win" | "lose" | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Check if user is signed in
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Load event by code
  useEffect(() => {
    const loadEvent = async () => {
      if (!accessCode) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("custom_roulettes")
          .select("*")
          .eq("access_code", accessCode.toUpperCase())
          .single();

        if (error || !data) {
          toast({
            title: "Event not found",
            description: "This code is invalid or the event has ended",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        setEvent(data as RouletteEvent);

        // Load participants
        const { data: parts } = await supabase
          .from("roulette_participants")
          .select("id, display_name, is_winner")
          .eq("roulette_id", data.id);

        if (parts) {
          setParticipants(parts as Participant[]);
        }
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [accessCode, toast]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!event) return;

    const channel = supabase
      .channel(`join_event_${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "roulette_participants",
          filter: `roulette_id=eq.${event.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("roulette_participants")
            .select("id, display_name, is_winner")
            .eq("roulette_id", event.id);

          if (data) {
            setParticipants(data as Participant[]);

            // Check if current participant won
            if (participantId) {
              const myEntry = data.find((p) => p.id === participantId);
              if (myEntry?.is_winner) {
                setShowResult("win");
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "custom_roulettes",
          filter: `id=eq.${event.id}`,
        },
        async (payload) => {
          const updated = payload.new as RouletteEvent;
          setEvent(updated);

          if (updated.status === "COMPLETED" && participantId) {
            const { data } = await supabase
              .from("roulette_participants")
              .select("id, is_winner")
              .eq("roulette_id", event.id);

            if (data) {
              const myEntry = data.find((p) => p.id === participantId);
              if (myEntry?.is_winner) {
                setShowResult("win");
              } else if (myEntry) {
                setShowResult("lose");
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event?.id, participantId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (displayName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email");
      return;
    }

    if (!event) return;

    setIsJoining(true);

    try {
      const { data: participant, error: joinError } = await supabase
        .from("roulette_participants")
        .insert({
          roulette_id: event.id,
          user_id: userId || null,
          display_name: displayName.trim(),
          email: email.trim() || null,
          device_fingerprint: navigator.userAgent,
          is_guest: !userId,
        })
        .select()
        .single();

      if (joinError) {
        if (joinError.code === "23505") {
          setError("You've already joined this event");
        } else {
          throw joinError;
        }
        return;
      }

      setParticipantId(participant.id);
      setHasJoined(true);
      toast({
        title: "You're in! 🎉",
        description: "Waiting for the host to start the draw...",
      });
    } catch (err) {
      setError("Failed to join. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <PulseWaveBackground />
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  // No event found
  if (!event) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <PulseWaveBackground />
        <GlassCard className="p-8 text-center max-w-md mx-4">
          <X className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This link may be invalid or the event has already ended.
          </p>
          <Button onClick={() => navigate("/impulse")}>
            Browse Events
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Event completed
  if (event.status === "COMPLETED" || event.status === "CANCELLED") {
    const eventWinners = participants.filter((p) => p.is_winner);

    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <PulseWaveBackground />
        <GlassCard className="p-8 text-center max-w-md mx-4">
          {showResult === "win" ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
              >
                <PartyPopper className="w-10 h-10 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 neon-text">You Won! 🎉</h2>
              <p className="text-muted-foreground">
                Congratulations! The host will contact you soon.
              </p>
            </>
          ) : event.status === "CANCELLED" ? (
            <>
              <X className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Event Cancelled</h2>
              <p className="text-muted-foreground">This event was cancelled by the host.</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4">Event Ended</h2>
              {eventWinners.length > 0 && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Winner{eventWinners.length > 1 ? "s" : ""}:</p>
                  {eventWinners.map((w) => (
                    <p key={w.id} className="font-semibold text-primary">
                      {w.display_name || "Anonymous"}
                    </p>
                  ))}
                </div>
              )}
              {showResult === "lose" && (
                <p className="text-muted-foreground">Better luck next time!</p>
              )}
            </>
          )}
          <Button onClick={() => navigate("/impulse")} className="mt-6">
            Browse More Events
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Already joined - waiting view
  if (hasJoined) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <PulseWaveBackground />
        <GlassCard className="p-8 text-center max-w-md mx-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">You're In!</h2>
          <p className="text-muted-foreground mb-6">
            Waiting for the host to start the draw...
          </p>

          <div className="p-4 rounded-xl bg-secondary/30 border border-white/10">
            <p className="font-semibold mb-2">{event.title}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {participants.length} joined
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {event.winners_count} winner{event.winners_count > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Join form (default view)
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4">
      <PulseWaveBackground />

      <GlassCard className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Ticket className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Quick Join</h2>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <p className="font-semibold text-primary">{event.title}</p>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {participants.length} in
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Your Name *
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., John D."
              className="mt-2"
              autoFocus
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground mt-1">This will be shown if you win</p>
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="To receive winner notification"
              className="mt-2"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">Only used to notify you if you win</p>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" disabled={isJoining} className="w-full" size="lg">
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Joining...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Join Now
              </>
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          No account needed. Fair chance for everyone!
        </p>
      </GlassCard>
    </div>
  );
};

export default JoinEventPage;
