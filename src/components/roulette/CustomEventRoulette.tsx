import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Users, QrCode, Settings, Play, Clock, Shield, MapPin, 
  Copy, ExternalLink, PartyPopper, X, Loader2, Check, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/GlassCard";
import { QRCodeSVG } from "qrcode.react";
import { RouletteTemplates, RouletteTemplate } from "./RouletteTemplates";
import { LiveEventPulse } from "./LiveEventPulse";

interface CustomRoulette {
  id: string;
  host_id: string;
  title: string;
  status: "OPEN" | "SPINNING" | "COMPLETED";
  winners_count: number;
  access_code: string;
  timer_seconds: number;
  min_score_requirement: number;
  geo_lock_enabled: boolean;
  created_at: string;
}

interface Participant {
  id: string;
  user_id: string;
  is_winner: boolean;
  joined_at: string;
}

interface CustomEventRouletteProps {
  userId?: string;
}

type ViewMode = "browse" | "templates" | "create" | "host" | "join";

export const CustomEventRoulette = ({ userId }: CustomEventRouletteProps) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("browse");
  const [activeRoulette, setActiveRoulette] = useState<CustomRoulette | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showResult, setShowResult] = useState<"win" | "lose" | null>(null);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [timerLeft, setTimerLeft] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<RouletteTemplate | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: "",
    winnersCount: 1,
    timerSeconds: 120,
    minScoreRequirement: 0,
    geoLockEnabled: false,
  });

  // Handle template selection
  const handleTemplateSelect = (template: RouletteTemplate) => {
    setSelectedTemplate(template);
    setCreateForm({
      title: template.name,
      winnersCount: template.defaults.winnersCount,
      timerSeconds: template.defaults.timerSeconds,
      minScoreRequirement: template.defaults.minScoreRequirement,
      geoLockEnabled: false,
    });
    setViewMode("create");
  };

  // Generate random access code
  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create new roulette
  const handleCreate = async () => {
    if (!userId || !createForm.title.trim()) return;

    setIsLoading(true);
    const accessCode = generateAccessCode();

    try {
      const { data, error } = await supabase
        .from("custom_roulettes")
        .insert({
          host_id: userId,
          title: createForm.title,
          winners_count: createForm.winnersCount,
          timer_seconds: createForm.timerSeconds,
          min_score_requirement: createForm.minScoreRequirement,
          geo_lock_enabled: createForm.geoLockEnabled,
          access_code: accessCode,
        })
        .select()
        .single();

      if (error) throw error;

      setActiveRoulette(data as CustomRoulette);
      setViewMode("host");
      toast({
        title: "Roulette Created!",
        description: "Share the QR code or link with participants.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create roulette",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Join roulette by code
  const handleJoin = async () => {
    if (!userId || !joinCode.trim()) return;

    setIsLoading(true);

    try {
      // Find the roulette
      const { data: roulette, error: findError } = await supabase
        .from("custom_roulettes")
        .select("*")
        .eq("access_code", joinCode.toUpperCase())
        .eq("status", "OPEN")
        .single();

      if (findError || !roulette) {
        toast({
          title: "Not Found",
          description: "Invalid or expired code",
          variant: "destructive",
        });
        return;
      }

      // Join as participant
      const { error: joinError } = await supabase
        .from("roulette_participants")
        .insert({
          roulette_id: roulette.id,
          user_id: userId,
          device_fingerprint: navigator.userAgent,
        });

      if (joinError) {
        if (joinError.code === "23505") {
          toast({
            title: "Already Joined",
            description: "You're already in this roulette",
          });
        } else {
          throw joinError;
        }
      }

      setActiveRoulette(roulette as CustomRoulette);
      setViewMode("join");
      toast({
        title: "Joined!",
        description: "Waiting for the host to start...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join roulette",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Spin the wheel (host only)
  const handleSpin = async () => {
    if (!activeRoulette || !userId) return;

    setIsLoading(true);

    try {
      // Update status to spinning
      await supabase
        .from("custom_roulettes")
        .update({ status: "SPINNING" })
        .eq("id", activeRoulette.id);

      // Get all participants
      const { data: allParticipants } = await supabase
        .from("roulette_participants")
        .select("*")
        .eq("roulette_id", activeRoulette.id);

      if (!allParticipants || allParticipants.length === 0) {
        toast({
          title: "No participants",
          description: "Wait for people to join",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Simulate spin animation (3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Randomly select winners
      const shuffled = [...allParticipants].sort(() => Math.random() - 0.5);
      const selectedWinners = shuffled.slice(0, activeRoulette.winners_count);

      // Mark winners in database
      for (const winner of selectedWinners) {
        await supabase
          .from("roulette_participants")
          .update({ is_winner: true })
          .eq("id", winner.id);
      }

      // Update roulette status
      await supabase
        .from("custom_roulettes")
        .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
        .eq("id", activeRoulette.id);

      setWinners(selectedWinners as Participant[]);
      setActiveRoulette((prev) => prev ? { ...prev, status: "COMPLETED" } : null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete spin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to roulette updates
  useEffect(() => {
    if (!activeRoulette) return;

    const channel = supabase
      .channel(`roulette_${activeRoulette.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "roulette_participants",
          filter: `roulette_id=eq.${activeRoulette.id}`,
        },
        async () => {
          // Refresh participants
          const { data } = await supabase
            .from("roulette_participants")
            .select("*")
            .eq("roulette_id", activeRoulette.id);
          
          if (data) {
            setParticipants(data as Participant[]);
            
            // Check if user won
            const userEntry = data.find((p) => p.user_id === userId);
            if (userEntry?.is_winner && viewMode === "join") {
              setShowResult("win");
            } else if (activeRoulette.status === "COMPLETED" && viewMode === "join" && !userEntry?.is_winner) {
              setShowResult("lose");
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
          filter: `id=eq.${activeRoulette.id}`,
        },
        (payload) => {
          const updated = payload.new as CustomRoulette;
          setActiveRoulette(updated);
          
          if (updated.status === "COMPLETED" && viewMode === "join") {
            // Check if current user won
            const userParticipant = participants.find((p) => p.user_id === userId);
            if (userParticipant?.is_winner) {
              setShowResult("win");
            } else {
              setShowResult("lose");
            }
          }
        }
      )
      .subscribe();

    // Fetch initial participants
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from("roulette_participants")
        .select("*")
        .eq("roulette_id", activeRoulette.id);
      
      if (data) {
        setParticipants(data as Participant[]);
      }
    };

    fetchParticipants();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoulette?.id, userId, viewMode, participants]);

  // Timer countdown for host view
  useEffect(() => {
    if (viewMode !== "host" || !activeRoulette || activeRoulette.status !== "OPEN") return;
    
    setTimerLeft(activeRoulette.timer_seconds);
    
    const interval = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev <= 1) {
          handleSpin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [viewMode, activeRoulette?.id, activeRoulette?.status]);

  const getJoinUrl = () => {
    if (!activeRoulette) return "";
    return `${window.location.origin}/roulette?code=${activeRoulette.access_code}`;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getJoinUrl());
    toast({ title: "Copied!", description: "Link copied to clipboard" });
  };

  // Browse View
  if (viewMode === "browse") {
    return (
      <GlassCard className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Fair Pick</h2>
          <p className="text-muted-foreground">
            Provably fair selections for giveaways, raffles, and group decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New */}
          <motion.button
            onClick={() => setViewMode("templates")}
            className="p-8 rounded-2xl bg-primary/10 border-2 border-primary/30 hover:border-primary/60 transition-all text-left group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-4 rounded-xl bg-primary/20 w-fit mb-4 group-hover:bg-primary/30 transition-colors">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Fair Pick</h3>
            <p className="text-sm text-muted-foreground">
              Choose a template or customize your own draw
            </p>
          </motion.button>

          {/* Join Existing */}
          <motion.div
            className="p-8 rounded-2xl bg-secondary/30 border-2 border-white/10"
            whileHover={{ scale: 1.01 }}
          >
            <div className="p-4 rounded-xl bg-secondary/50 w-fit mb-4">
              <QrCode className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Join a Pick</h3>
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                maxLength={6}
                className="uppercase font-mono text-lg tracking-widest"
              />
              <Button onClick={handleJoin} disabled={!joinCode.trim() || isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
              </Button>
            </div>
          </motion.div>
        </div>
      </GlassCard>
    );
  }

  // Templates View
  if (viewMode === "templates") {
    return (
      <GlassCard className="p-8 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Choose a Template</h2>
          <Button variant="ghost" size="icon" onClick={() => setViewMode("browse")}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <RouletteTemplates
          onSelectTemplate={handleTemplateSelect}
          onCustomCreate={() => {
            setSelectedTemplate(null);
            setCreateForm({
              title: "",
              winnersCount: 1,
              timerSeconds: 120,
              minScoreRequirement: 0,
              geoLockEnabled: false,
            });
            setViewMode("create");
          }}
        />
      </GlassCard>
    );
  }

  // Create View
  if (viewMode === "create") {
    return (
      <GlassCard className="p-8 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create Custom Roulette</h2>
          <Button variant="ghost" size="icon" onClick={() => setViewMode("browse")}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <Label>Event Title</Label>
            <Input
              value={createForm.title}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Tech Meetup T-Shirt Giveaway"
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Number of Winners</Label>
              <Input
                type="number"
                value={createForm.winnersCount}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, winnersCount: parseInt(e.target.value) || 1 }))}
                min={1}
                max={10}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Timer (seconds)</Label>
              <Input
                type="number"
                value={createForm.timerSeconds}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, timerSeconds: parseInt(e.target.value) || 120 }))}
                min={30}
                max={600}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Min MAI Score Requirement</Label>
            <Input
              type="number"
              value={createForm.minScoreRequirement}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, minScoreRequirement: parseInt(e.target.value) || 0 }))}
              min={0}
              max={100}
              className="mt-2"
              placeholder="0 = No requirement"
            />
            <p className="text-xs text-muted-foreground mt-1">Filter out bots by requiring a minimum score</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">GPS Lock</p>
                <p className="text-xs text-muted-foreground">Participants must be nearby</p>
              </div>
            </div>
            <button
              onClick={() => setCreateForm((prev) => ({ ...prev, geoLockEnabled: !prev.geoLockEnabled }))}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                createForm.geoLockEnabled ? "bg-primary" : "bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform",
                  createForm.geoLockEnabled ? "translate-x-6" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <Button onClick={handleCreate} disabled={!createForm.title.trim() || isLoading} className="w-full" size="lg">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
            Create Roulette
          </Button>
        </div>
      </GlassCard>
    );
  }

  // Host View
  if (viewMode === "host" && activeRoulette) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{activeRoulette.title}</h2>
              <p className="text-muted-foreground">Share the QR code with participants</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-score-green/20 border border-score-green/40">
              <div className="w-2 h-2 rounded-full bg-score-green animate-pulse" />
              <span className="text-sm font-medium text-score-green">
                {activeRoulette.status === "OPEN" ? "OPEN" : activeRoulette.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white">
              <QRCodeSVG value={getJoinUrl()} size={256} level="H" />
              <p className="mt-4 text-black font-mono text-2xl tracking-widest font-bold">
                {activeRoulette.access_code}
              </p>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Timer */}
              {activeRoulette.status === "OPEN" && (
                <div className="text-center p-6 rounded-2xl bg-primary/10 border border-primary/30">
                  <p className="text-sm text-muted-foreground mb-2">Auto-spin in</p>
                  <p className="text-5xl font-black text-primary">
                    {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, "0")}
                  </p>
                </div>
              )}

              {/* Participant Count */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Participants</span>
                </div>
                <span className="text-2xl font-bold">{participants.length}</span>
              </div>

              {/* Share Link */}
              <div className="flex gap-2">
                <Input value={getJoinUrl()} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {/* Spin Button */}
              {activeRoulette.status === "OPEN" && (
                <Button
                  onClick={handleSpin}
                  disabled={participants.length === 0 || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Spinning...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      SPIN NOW
                    </>
                  )}
                </Button>
              )}

              {/* Winners */}
              {activeRoulette.status === "COMPLETED" && winners.length > 0 && (
                <div className="p-6 rounded-2xl bg-score-green/10 border border-score-green/30">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <PartyPopper className="w-5 h-5 text-score-green" />
                    Winners!
                  </h3>
                  <div className="space-y-2">
                    {winners.map((winner, index) => (
                      <div key={winner.id} className="flex items-center gap-3 p-3 rounded-lg bg-score-green/10">
                        <span className="text-lg font-bold text-score-green">#{index + 1}</span>
                        <span className="font-medium">User_{winner.user_id.slice(0, 6)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Live Pulse Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveEventPulse rouletteId={activeRoulette.id} userId={userId} isHost={true} />
          
          <GlassCard className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              Audience Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              See live feedback from your audience. They can share their pulse anonymously with a MAI tag or use their real profile.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-secondary/20 border border-white/5">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Encourage participants to share suggestions for a more engaging experience!
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Join View (Participant)
  if (viewMode === "join" && activeRoulette) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <GlassCard className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">{activeRoulette.title}</h2>
          
          {activeRoulette.status === "OPEN" && (
            <>
              <div className="my-8">
                <motion.div
                  className="w-32 h-32 mx-auto rounded-full bg-primary/20 border-4 border-primary/40 flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="w-16 h-16 text-primary" />
                </motion.div>
              </div>
              <p className="text-xl text-muted-foreground">Waiting for host to start...</p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-score-green" />
                <span className="text-score-green font-medium">You're registered!</span>
              </div>
            </>
          )}

          {activeRoulette.status === "SPINNING" && (
            <motion.div
              className="my-12"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-32 h-32 mx-auto rounded-full border-4 border-primary border-t-transparent" />
            </motion.div>
          )}
        </GlassCard>

        {/* Live Pulse - Participants can share feedback */}
        {activeRoulette.status === "OPEN" && (
          <LiveEventPulse rouletteId={activeRoulette.id} userId={userId} isHost={false} />
        )}

        {/* Result Overlay */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg",
                showResult === "win" ? "bg-score-green/20" : "bg-secondary/80"
              )}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-12"
              >
                {showResult === "win" ? (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: 5 }}
                    >
                      <PartyPopper className="w-32 h-32 text-score-green mx-auto mb-6" />
                    </motion.div>
                    <h1 className="text-6xl font-black text-score-green mb-4">YOU WON!</h1>
                    <p className="text-xl text-foreground">Congratulations! 🎉</p>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                      <X className="w-16 h-16 text-muted-foreground" />
                    </div>
                    <h1 className="text-4xl font-bold text-muted-foreground mb-4">Not this time</h1>
                    <p className="text-lg text-muted-foreground">Better luck next round!</p>
                  </>
                )}
                <Button onClick={() => setShowResult(null)} className="mt-8" variant="outline">
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
};
