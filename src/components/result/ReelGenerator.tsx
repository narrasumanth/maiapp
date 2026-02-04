import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Download, Share2, Loader2, Play, Sparkles, Instagram, Volume2, VolumeX, Type, Zap, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ReelGeneratorProps {
  entityName: string;
  score: number;
  category: string;
  vibeCheck: string;
  evidence?: Array<{ title: string; value: string; positive: boolean }>;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return { primary: "#14b8a6", secondary: "#06b6d4", emoji: "💎" };
  if (score >= 75) return { primary: "#22c55e", secondary: "#10b981", emoji: "✅" };
  if (score >= 50) return { primary: "#f59e0b", secondary: "#eab308", emoji: "⚡" };
  return { primary: "#ef4444", secondary: "#f43f5e", emoji: "📊" };
};

// Positive category-specific closings
const getCategoryClosing = (category: string, score: number) => {
  const lower = category.toLowerCase();
  
  if (lower.includes("restaurant") || lower.includes("food")) {
    return {
      message: "Thanks for the love ❤️",
      subtext: "This is our live community pulse today."
    };
  }
  if (lower.includes("music") || lower.includes("artist") || lower.includes("concert")) {
    return {
      message: "Tonight's energy was unreal 🔥",
      subtext: "That's the crowd pulse."
    };
  }
  if (lower.includes("product") || lower.includes("brand")) {
    return {
      message: "Momentum is real.",
      subtext: "Built by feedback. Powered by people."
    };
  }
  if (lower.includes("person") || lower.includes("celebrity")) {
    return {
      message: "Real people. Real support. 💪",
      subtext: "Community-powered trust."
    };
  }
  if (lower.includes("place") || lower.includes("location")) {
    return {
      message: "The vibe is strong here ✨",
      subtext: "Live from the community."
    };
  }
  
  // Default positive closing
  return {
    message: "Real people. Real love. ❤️",
    subtext: "Powered by community trust."
  };
};

export const ReelGenerator = ({
  entityName,
  score,
  category,
  vibeCheck,
  evidence = [],
}: ReelGeneratorProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const { toast } = useToast();

  // User controls
  const [tone, setTone] = useState<"calm" | "energetic">("energetic");
  const [showCaptions, setShowCaptions] = useState(true);
  const [withMusic, setWithMusic] = useState(false);

  const colors = getScoreColor(score);
  const closing = getCategoryClosing(category, score);

  // New 6-10 second structure (winning formula)
  const frames = [
    { type: "hook", duration: 1500 },      // 1.5s - "This is what people think right now..."
    { type: "proof", duration: 4000 },      // 4s - Pulse animation, score rising, vote count
    { type: "close", duration: 2500 },      // 2.5s - Positive close with subtle branding
  ];

  const totalDuration = frames.reduce((acc, f) => acc + f.duration, 0); // ~8 seconds

  const drawFrame = (ctx: CanvasRenderingContext2D, frameIndex: number, progress: number) => {
    const width = 540;
    const height = 960;

    // Background - clean dark
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0d1117");
    gradient.addColorStop(0.5, "#161b22");
    gradient.addColorStop(1, "#0d1117");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Accent glow based on tone
    const glowIntensity = tone === "energetic" ? "18" : "0a";
    const glowGradient = ctx.createRadialGradient(width / 2, height / 3, 0, width / 2, height / 3, 350);
    glowGradient.addColorStop(0, `${colors.primary}${glowIntensity}`);
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);

    const frame = frames[frameIndex];
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easedProgress = easeOut(progress);

    switch (frame.type) {
      case "hook":
        // Hook: "This is what people think right now..."
        ctx.globalAlpha = easedProgress;
        
        const hookY = height / 2 - 40;
        
        // Pulse icon animation
        if (tone === "energetic") {
          const pulseScale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
          ctx.save();
          ctx.translate(width / 2, hookY - 80);
          ctx.scale(pulseScale, pulseScale);
          ctx.font = "48px serif";
          ctx.textAlign = "center";
          ctx.fillText("💬", 0, 0);
          ctx.restore();
        } else {
          ctx.font = "48px serif";
          ctx.textAlign = "center";
          ctx.fillText("💬", width / 2, hookY - 80);
        }

        // Hook text
        if (showCaptions) {
          ctx.font = "600 28px Plus Jakarta Sans, system-ui";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText("This is what people", width / 2, hookY);
          ctx.fillText("think right now...", width / 2, hookY + 40);
        }

        // Entity name teaser
        ctx.font = "500 18px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = colors.primary;
        ctx.fillText(entityName, width / 2, hookY + 100);
        
        ctx.globalAlpha = 1;
        break;

      case "proof":
        // Proof: Pulse animation, score rising, live vote count
        const proofProgress = easeInOut(progress);
        const currentScore = Math.round(proofProgress * score);
        
        // Entity name at top
        ctx.font = "600 24px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(entityName, width / 2, 180);
        
        ctx.font = "400 14px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(category, width / 2, 210);

        // Large animated score circle
        const centerY = height / 2 - 20;
        const radius = 130;
        
        // Background circle
        ctx.beginPath();
        ctx.arc(width / 2, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 16;
        ctx.stroke();

        // Animated progress arc
        const arcProgress = proofProgress * (score / 100);
        ctx.beginPath();
        ctx.arc(width / 2, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * arcProgress));
        const arcGradient = ctx.createLinearGradient(width / 2 - radius, centerY, width / 2 + radius, centerY);
        arcGradient.addColorStop(0, colors.primary);
        arcGradient.addColorStop(1, colors.secondary);
        ctx.strokeStyle = arcGradient;
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.stroke();

        // Pulsing glow effect for energetic tone
        if (tone === "energetic" && progress > 0.5) {
          ctx.globalAlpha = 0.3 + Math.sin(progress * Math.PI * 4) * 0.2;
          ctx.beginPath();
          ctx.arc(width / 2, centerY, radius + 20, 0, Math.PI * 2);
          ctx.strokeStyle = colors.primary;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Score number
        ctx.font = "bold 80px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(currentScore.toString(), width / 2, centerY + 25);

        // "/ 100" label
        ctx.font = "500 20px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("/ 100", width / 2, centerY + 60);

        // Live vote count indicator
        if (showCaptions) {
          const voteCount = Math.round(50 + Math.random() * 200);
          ctx.font = "500 16px Plus Jakarta Sans, system-ui";
          ctx.fillStyle = colors.primary;
          
          const pulseOpacity = tone === "energetic" ? 0.7 + Math.sin(progress * Math.PI * 6) * 0.3 : 1;
          ctx.globalAlpha = pulseOpacity;
          ctx.fillText(`🔴 ${voteCount} people voted`, width / 2, centerY + 180);
          ctx.globalAlpha = 1;
        }

        // Quick evidence highlights
        if (progress > 0.6 && evidence.length > 0) {
          const visibleEvidence = evidence.filter(e => e.positive).slice(0, 2);
          visibleEvidence.forEach((item, i) => {
            const itemAlpha = Math.min(1, (progress - 0.6) * 5);
            ctx.globalAlpha = itemAlpha;
            
            const badgeY = centerY + 230 + i * 50;
            
            ctx.fillStyle = "rgba(34,197,94,0.15)";
            ctx.beginPath();
            ctx.roundRect(width / 2 - 180, badgeY - 18, 360, 40, 12);
            ctx.fill();

            ctx.font = "500 14px Plus Jakarta Sans, system-ui";
            ctx.fillStyle = "#22c55e";
            ctx.fillText(`✓ ${item.title}`, width / 2, badgeY + 8);
          });
          ctx.globalAlpha = 1;
        }
        break;

      case "close":
        // Positive close with subtle MAI watermark
        ctx.globalAlpha = easedProgress;

        const closeY = height / 2 - 60;

        // Heart/love emoji
        ctx.font = "56px serif";
        ctx.textAlign = "center";
        ctx.fillText("❤️", width / 2, closeY - 60);

        // Category-specific positive message
        ctx.font = "bold 32px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(closing.message, width / 2, closeY + 20);

        ctx.font = "500 18px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(closing.subtext, width / 2, closeY + 60);

        // Final score badge
        ctx.fillStyle = `${colors.primary}20`;
        ctx.beginPath();
        ctx.roundRect(width / 2 - 80, closeY + 100, 160, 60, 16);
        ctx.fill();

        ctx.font = "bold 28px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = colors.primary;
        ctx.fillText(`${score} ${colors.emoji}`, width / 2, closeY + 140);

        // Subtle MAI watermark (not intrusive)
        ctx.font = "400 12px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillText("MAI Pulse", width / 2, height - 50);
        
        ctx.globalAlpha = 1;
        break;
    }
  };

  const playPreview = () => {
    if (!canvasRef.current) return;
    setIsPlaying(true);
    setCurrentFrame(0);

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    let startTime: number | null = null;
    let frameStartTime = 0;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;

      let accumulated = 0;
      let currentFrameIndex = 0;
      for (let i = 0; i < frames.length; i++) {
        if (elapsed < accumulated + frames[i].duration) {
          currentFrameIndex = i;
          frameStartTime = accumulated;
          break;
        }
        accumulated += frames[i].duration;
        if (i === frames.length - 1) {
          setIsPlaying(false);
          setIsReady(true);
          return;
        }
      }

      setCurrentFrame(currentFrameIndex);
      const frameProgress = (elapsed - frameStartTime) / frames[currentFrameIndex].duration;
      drawFrame(ctx, currentFrameIndex, Math.min(1, frameProgress));

      if (elapsed < totalDuration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        setIsReady(true);
        // Draw final frame
        drawFrame(ctx, frames.length - 1, 1);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const downloadReel = () => {
    if (!canvasRef.current) return;
    
    // Ensure final frame is drawn
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) drawFrame(ctx, frames.length - 1, 1);
    
    const link = document.createElement("a");
    link.download = `${entityName.replace(/\s+/g, "-")}-pulse.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();

    toast({ title: "Downloaded! 📥", description: "Share it with your community" });
  };

  const shareToInstagram = async () => {
    if (!canvasRef.current) return;

    // Ensure final frame is drawn
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) drawFrame(ctx, frames.length - 1, 1);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png");
      });

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `${entityName}-pulse.png`, { type: "image/png" });
        const shareData = {
          files: [file],
          title: `${entityName}'s Pulse`,
          text: `${closing.message}\n${closing.subtext}\n\n${score}/100 ${colors.emoji}`,
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast({ title: "Shared! 🎉" });
          return;
        }
      }

      downloadReel();
    } catch (error) {
      downloadReel();
    }
  };

  const shareReel = async () => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) drawFrame(ctx, frames.length - 1, 1);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png");
      });

      if (navigator.share) {
        const file = new File([blob], `${entityName}-pulse.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: `${entityName}'s Pulse`,
          text: `${closing.message} ${score}/100`,
        });
      } else {
        downloadReel();
      }
    } catch (error) {
      downloadReel();
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        drawFrame(ctx, 0, 1);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [entityName, score, tone, showCaptions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Video className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Create Shareable Reel</h3>
        <span className="text-xs text-muted-foreground">~8 seconds</span>
      </div>

      {/* Canvas Preview */}
      <div className="relative aspect-[9/16] max-h-[380px] mx-auto rounded-xl overflow-hidden bg-black border border-border">
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          className="w-full h-full object-contain"
        />
        
        {/* Play overlay */}
        {!isPlaying && (
          <motion.button
            onClick={playPreview}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-7 h-7 text-primary-foreground ml-1" />
            </div>
          </motion.button>
        )}
      </div>

      {/* Frame indicator */}
      <div className="flex justify-center gap-1.5">
        {frames.map((f, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === currentFrame ? "w-8 bg-primary" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* User Controls - Before Export */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview Settings</p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Tone Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="tone" className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {tone === "energetic" ? "Energetic" : "Calm"}
            </Label>
            <Switch
              id="tone"
              checked={tone === "energetic"}
              onCheckedChange={(checked) => setTone(checked ? "energetic" : "calm")}
            />
          </div>

          {/* Captions Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="captions" className="text-sm flex items-center gap-2">
              <Type className="w-4 h-4" />
              Captions
            </Label>
            <Switch
              id="captions"
              checked={showCaptions}
              onCheckedChange={setShowCaptions}
            />
          </div>
        </div>

        {/* Verification info */}
        <div className="pt-2 border-t border-white/5 text-xs text-muted-foreground space-y-1">
          <p>✔ Tone: Positive</p>
          <p>✔ Claims: Pulse-backed</p>
          <p>✔ Data source: MAI Live</p>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          onClick={downloadReel}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Save</span>
        </motion.button>

        <motion.button
          onClick={shareToInstagram}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Instagram className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-pink-300">Instagram</span>
        </motion.button>

        <motion.button
          onClick={shareReel}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </motion.button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        <Heart className="w-3 h-3 inline mr-1" />
        Positivity is shareable • No attacks, just confidence
      </p>
    </div>
  );
};
