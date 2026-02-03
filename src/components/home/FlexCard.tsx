import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Share2, Instagram, Sparkles, Copy, Check, Crown, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FlexCardProps {
  name?: string;
  score?: number;
  avatarUrl?: string;
  onClose?: () => void;
}

const ARCHETYPES = [
  { min: 95, label: "The Unproblematic Queen", icon: Crown, color: "text-yellow-400" },
  { min: 85, label: "The Local Legend", icon: Star, color: "text-purple-400" },
  { min: 75, label: "The Trusted One", icon: Zap, color: "text-blue-400" },
  { min: 60, label: "The Rising Star", icon: Sparkles, color: "text-green-400" },
  { min: 0, label: "The Fresh Start", icon: Star, color: "text-muted-foreground" },
];

const HOOK_TEMPLATES = [
  {
    id: "ego",
    label: "The Ego Hook",
    template: "I created my digital profile on MAI. My reputation is {score}% clean. Have you checked yours?",
  },
  {
    id: "challenge",
    label: "The Challenge Hook",
    template: "I bet you can't beat my Trust Score of {score}. Verify yourself here.",
  },
  {
    id: "dating",
    label: "The Dating Hook",
    template: "Don't text him back until you check his MAI Score. Mine is {score}/100 💅",
  },
];

export const FlexCard = ({ name = "You", score = 85, avatarUrl, onClose }: FlexCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedHook, setSelectedHook] = useState(HOOK_TEMPLATES[0]);
  const [animatedScore, setAnimatedScore] = useState(0);

  const archetype = ARCHETYPES.find((a) => score >= a.min) || ARCHETYPES[ARCHETYPES.length - 1];
  const ArchetypeIcon = archetype.icon;

  // Animate score on mount
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [score]);

  const getCaption = () => selectedHook.template.replace("{score}", String(score));

  const handleCopyCaption = async () => {
    await navigator.clipboard.writeText(getCaption() + " mai.protocol");
    setCopied(true);
    toast({ title: "Caption copied!", description: "Ready to paste on your story" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToStory = () => {
    const text = encodeURIComponent(getCaption() + " mai.protocol");
    // Try native share first
    if (navigator.share) {
      navigator.share({
        title: "My MAI Score",
        text: getCaption(),
        url: window.location.origin,
      });
    } else {
      // Fallback to Twitter/X
      window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
    }
  };

  const scoreColor = score >= 75 ? "text-score-green" : score >= 50 ? "text-score-yellow" : "text-score-red";
  const glowColor = score >= 75 ? "shadow-score-green/50" : score >= 50 ? "shadow-score-yellow/50" : "shadow-score-red/50";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center gap-6"
    >
      {/* The Flex Card - Instagram Story Sized (9:16 aspect ratio scaled down) */}
      <div 
        className={cn(
          "relative w-[280px] h-[500px] rounded-3xl overflow-hidden",
          "bg-gradient-to-br from-background via-secondary to-background",
          "border border-white/10 shadow-2xl",
          glowColor
        )}
      >
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              initial={{ x: Math.random() * 280, y: 500 }}
              animate={{ y: -20, opacity: [0, 1, 0] }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Glow Effect */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-8">
          {/* Logo */}
          <motion.div
            className="absolute top-4 left-4 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary">MAI</span>
          </motion.div>

          {/* Profile Section */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Avatar with Glow Ring */}
            <div className={cn("relative p-1 rounded-full", "bg-gradient-to-br from-primary via-purple-500 to-primary")}>
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl bg-secondary">{name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>

            <h2 className="text-xl font-bold text-foreground">{name}</h2>
          </motion.div>

          {/* Score Circle */}
          <motion.div
            className="relative my-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <div className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-secondary/80 to-secondary/40",
              "border-4 border-primary/50",
              "shadow-lg", glowColor
            )}>
              <div className="text-center">
                <motion.span 
                  className={cn("text-4xl font-black", scoreColor)}
                  key={animatedScore}
                >
                  {animatedScore}
                </motion.span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            
            {/* Orbiting Sparkle */}
            <motion.div
              className="absolute -top-1 left-1/2 -translate-x-1/2"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "50% 80px" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
          </motion.div>

          {/* Archetype Badge */}
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-white/10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <ArchetypeIcon className={cn("w-4 h-4", archetype.color)} />
            <span className="text-sm font-medium text-foreground">{archetype.label}</span>
          </motion.div>

          {/* CTA */}
          <motion.p
            className="mt-4 text-xs text-muted-foreground text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Check your score at <span className="text-primary font-semibold">mai.protocol</span>
          </motion.p>
        </div>
      </div>

      {/* Hook Templates */}
      <div className="w-full max-w-sm space-y-3">
        <p className="text-sm font-medium text-muted-foreground text-center">Choose your caption</p>
        <div className="flex flex-wrap justify-center gap-2">
          {HOOK_TEMPLATES.map((hook) => (
            <button
              key={hook.id}
              onClick={() => setSelectedHook(hook)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                selectedHook.id === hook.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
              )}
            >
              {hook.label}
            </button>
          ))}
        </div>
        
        {/* Caption Preview */}
        <div className="p-3 rounded-xl bg-secondary/40 border border-white/10">
          <p className="text-sm text-foreground text-center">{getCaption()}</p>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={handleCopyCaption}
          className="gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy Caption
        </Button>
        <Button
          size="lg"
          onClick={handleShareToStory}
          className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
        >
          <Share2 className="w-4 h-4" />
          Share to Story
        </Button>
      </div>
    </motion.div>
  );
};
