import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Download, Share2, Play, Sparkles, Instagram, Type, Zap, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
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
  if (score >= 90) return { primary: "#14b8a6", secondary: "#06b6d4", emoji: "💎", tier: "Diamond" };
  if (score >= 75) return { primary: "#22c55e", secondary: "#10b981", emoji: "✅", tier: "Trusted" };
  if (score >= 50) return { primary: "#f59e0b", secondary: "#eab308", emoji: "⚡", tier: "Mixed" };
  return { primary: "#ef4444", secondary: "#f43f5e", emoji: "📊", tier: "Caution" };
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

  const colors = getScoreColor(score);

  // 10-Second Dynamic Script
  const frames = [
    { type: "hook", duration: 1500, label: "Hook" },           // 0-1.5s
    { type: "proof", duration: 2500, label: "Proof" },         // 1.5-4s  
    { type: "personality", duration: 2500, label: "Vibe" },    // 4-6.5s
    { type: "twist", duration: 2000, label: "Twist" },         // 6.5-8.5s
    { type: "close", duration: 1500, label: "Close" },         // 8.5-10s
  ];

  const totalDuration = frames.reduce((acc, f) => acc + f.duration, 0);

  // Simulated vote counts for animation
  const positiveVotes = Math.round(100 + score * 2.5 + Math.random() * 50);
  const negativeVotes = Math.round((100 - score) * 0.8 + Math.random() * 20);

  const drawFrame = (ctx: CanvasRenderingContext2D, frameIndex: number, progress: number, globalTime: number) => {
    const width = 540;
    const height = 960;

    // Base gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0a0a0f");
    gradient.addColorStop(0.5, "#0d1117");
    gradient.addColorStop(1, "#0a0a0f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Dynamic glow based on frame
    const glowIntensity = tone === "energetic" ? 0.15 : 0.08;
    const pulseGlow = 1 + Math.sin(globalTime * 0.003) * 0.2;
    const glowGradient = ctx.createRadialGradient(
      width / 2, height / 3, 0, 
      width / 2, height / 3, 400 * pulseGlow
    );
    glowGradient.addColorStop(0, `${colors.primary}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}`);
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);

    const frame = frames[frameIndex];
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const bounce = (t: number) => {
      if (t < 0.5) return 4 * t * t * t;
      return 1 - Math.pow(-2 * t + 2, 3) / 2 + Math.sin(t * Math.PI * 3) * 0.05 * (1 - t);
    };
    const easedProgress = easeOut(progress);

    switch (frame.type) {
      case "hook":
        // ⏱ 0–1.5s — Hook (Stop the Scroll)
        drawHookFrame(ctx, width, height, progress, globalTime, easedProgress);
        break;

      case "proof":
        // ⏱ 1.5–4s — Proof Appears
        drawProofFrame(ctx, width, height, progress, globalTime, easeInOut(progress));
        break;

      case "personality":
        // ⏱ 4–6.5s — Personality Moment
        drawPersonalityFrame(ctx, width, height, progress, globalTime, bounce(progress));
        break;

      case "twist":
        // ⏱ 6.5–8.5s — The Twist
        drawTwistFrame(ctx, width, height, progress, globalTime, easedProgress);
        break;

      case "close":
        // ⏱ 8.5–10s — Brand Close
        drawCloseFrame(ctx, width, height, progress, globalTime, easedProgress);
        break;
    }
  };

  // Hook Frame: "What does the crowd think… right now?"
  const drawHookFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, globalTime: number, easedProgress: number) => {
    const centerY = height / 2;
    
    // Pulse ring animation - snap in
    const ringScale = Math.min(1, progress * 3); // Quick snap in
    const ringPulse = 1 + Math.sin(globalTime * 0.01) * 0.05;
    
    ctx.save();
    ctx.translate(width / 2, centerY - 100);
    ctx.scale(ringScale * ringPulse, ringScale * ringPulse);
    
    // Outer pulse ring
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.strokeStyle = `${colors.primary}40`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Inner pulse ring
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Center dot pulse
    const dotPulse = 1 + Math.sin(globalTime * 0.02) * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, 15 * dotPulse, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary;
    ctx.fill();
    
    ctx.restore();

    // Hook text with typewriter effect
    if (showCaptions) {
      ctx.globalAlpha = Math.min(1, progress * 2);
      ctx.font = "700 32px Plus Jakarta Sans, system-ui";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      
      const text1 = "What does the crowd think…";
      const text2 = "right now?";
      const chars1 = Math.floor(progress * 2 * text1.length);
      const chars2 = Math.max(0, Math.floor((progress * 2 - 0.5) * text2.length * 2));
      
      ctx.fillText(text1.substring(0, Math.min(chars1, text1.length)), width / 2, centerY + 40);
      
      if (progress > 0.5) {
        ctx.fillStyle = colors.primary;
        ctx.fillText(text2.substring(0, Math.min(chars2, text2.length)), width / 2, centerY + 85);
      }
      ctx.globalAlpha = 1;
    }
  };

  // Proof Frame: Score animation with vote count
  const drawProofFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, globalTime: number, easedProgress: number) => {
    const centerY = height / 2 - 40;
    const currentScore = Math.round(easedProgress * score);
    
    // Entity name
    ctx.font = "600 26px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(entityName, width / 2, 160);
    
    ctx.font = "400 14px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(category, width / 2, 190);

    // Animated score circle
    const radius = 120;
    
    // Background circle
    ctx.beginPath();
    ctx.arc(width / 2, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 14;
    ctx.stroke();

    // Animated progress arc
    const arcProgress = easedProgress * (score / 100);
    ctx.beginPath();
    ctx.arc(width / 2, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * arcProgress));
    const arcGradient = ctx.createLinearGradient(width / 2 - radius, centerY, width / 2 + radius, centerY);
    arcGradient.addColorStop(0, colors.primary);
    arcGradient.addColorStop(1, colors.secondary);
    ctx.strokeStyle = arcGradient;
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();

    // Score number with spring effect
    const scoreScale = 1 + Math.sin(progress * Math.PI) * 0.08;
    ctx.save();
    ctx.translate(width / 2, centerY + 20);
    ctx.scale(scoreScale, scoreScale);
    ctx.font = "bold 72px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(currentScore.toString(), 0, 0);
    ctx.restore();

    // Vote icons flickering
    const thumbsY = centerY + 180;
    const flicker = Math.sin(globalTime * 0.015) > 0 ? 1 : 0.6;
    
    // Thumbs up
    ctx.globalAlpha = 0.5 + flicker * 0.5;
    ctx.font = "32px serif";
    ctx.fillText("👍", width / 2 - 80, thumbsY);
    
    // Thumbs down
    ctx.globalAlpha = 0.5 + (1 - flicker) * 0.5;
    ctx.fillText("👎", width / 2 + 80, thumbsY);
    ctx.globalAlpha = 1;

    // Live vote count ticking
    if (showCaptions) {
      const displayPositive = Math.round(easedProgress * positiveVotes);
      const displayNegative = Math.round(easedProgress * negativeVotes);
      
      ctx.font = "600 18px Plus Jakarta Sans, system-ui";
      ctx.fillStyle = "#22c55e";
      ctx.fillText(displayPositive.toString(), width / 2 - 80, thumbsY + 35);
      
      ctx.fillStyle = "#ef4444";
      ctx.fillText(displayNegative.toString(), width / 2 + 80, thumbsY + 35);
      
      // "Real people. Real signals." text
      ctx.font = "500 16px Plus Jakarta Sans, system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("Real people. Real signals.", width / 2, thumbsY + 90);
    }
  };

  // Personality Frame: Score settles with bounce and humor
  const drawPersonalityFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, globalTime: number, bouncedProgress: number) => {
    const centerY = height / 2 - 60;
    
    // Score with subtle bounce/glow
    const glowPulse = 1 + Math.sin(globalTime * 0.008) * 0.15;
    
    // Glow behind score
    ctx.globalAlpha = 0.3 * glowPulse;
    ctx.beginPath();
    ctx.arc(width / 2, centerY, 150 * glowPulse, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Score circle
    const radius = 100;
    ctx.beginPath();
    ctx.arc(width / 2, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = `${colors.primary}20`;
    ctx.fill();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Score number with bounce
    const bounceScale = 1 + Math.sin(progress * Math.PI * 2) * 0.05;
    ctx.save();
    ctx.translate(width / 2, centerY + 15);
    ctx.scale(bounceScale, bounceScale);
    ctx.font = "bold 64px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(score.toString(), 0, 0);
    ctx.restore();

    // Tier badge
    ctx.font = "600 16px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = colors.primary;
    ctx.fillText(colors.tier, width / 2, centerY + 55);

    // Personality text with emoji pop
    if (showCaptions) {
      ctx.globalAlpha = Math.min(1, progress * 1.5);
      ctx.font = "600 28px Plus Jakarta Sans, system-ui";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Scores served with a", width / 2, centerY + 160);
      ctx.fillText("sense of humor 😄", width / 2, centerY + 200);
      
      // Micro emoji pop
      if (progress > 0.6) {
        const emojiScale = 1 + Math.sin((progress - 0.6) * Math.PI * 4) * 0.2;
        ctx.save();
        ctx.translate(width / 2 + 120, centerY + 190);
        ctx.scale(emojiScale, emojiScale);
        ctx.font = "24px serif";
        ctx.fillText("✨", 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  };

  // Twist Frame: Score dip effect with intrigue
  const drawTwistFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, globalTime: number, easedProgress: number) => {
    const centerY = height / 2 - 40;
    
    // Show score with slight dip animation
    const dipProgress = progress < 0.4 ? progress / 0.4 : 1 - (progress - 0.4) * 0.5;
    const displayScore = Math.round(score - (dipProgress * 3)); // Slight dip
    
    // Warning flash effect
    const flashAlpha = Math.sin(progress * Math.PI * 4) * 0.15;
    ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0, flashAlpha)})`;
    ctx.fillRect(0, 0, width, height);

    // Score with arrow flash
    ctx.font = "bold 72px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(displayScore.toString(), width / 2, centerY);

    // Animated arrow pointing down (brief)
    if (progress < 0.5) {
      const arrowY = centerY + 50 + Math.sin(progress * Math.PI * 6) * 10;
      ctx.font = "36px serif";
      ctx.fillText("📉", width / 2, arrowY);
    }

    // Twist text
    if (showCaptions) {
      ctx.globalAlpha = Math.min(1, progress * 2);
      ctx.font = "600 26px Plus Jakarta Sans, system-ui";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Fun to check…", width / 2, centerY + 120);
      
      if (progress > 0.3) {
        ctx.font = "600 28px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = colors.primary;
        ctx.fillText("until the pulse drops 👀", width / 2, centerY + 165);
      }
      ctx.globalAlpha = 1;
    }
  };

  // Close Frame: Brand with breathing pulse
  const drawCloseFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number, globalTime: number, easedProgress: number) => {
    const centerY = height / 2 - 40;
    
    // Fade in logo area
    ctx.globalAlpha = easedProgress;
    
    // Breathing pulse ring
    const breathe = 1 + Math.sin(globalTime * 0.006) * 0.1;
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(width / 2, centerY - 60, 70 * breathe, 0, Math.PI * 2);
    ctx.strokeStyle = `${colors.primary}40`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Inner ring
    ctx.beginPath();
    ctx.arc(width / 2, centerY - 60, 50 * breathe, 0, Math.PI * 2);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // MAI text logo
    ctx.font = "bold 42px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = colors.primary;
    ctx.textAlign = "center";
    ctx.fillText("MAI", width / 2, centerY - 45);

    // "Pulse" with gradient effect
    ctx.font = "300 32px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Pulse", width / 2, centerY + 5);

    // Final score badge
    ctx.fillStyle = `${colors.primary}20`;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 70, centerY + 50, 140, 50, 25);
    ctx.fill();
    
    ctx.font = "bold 24px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = colors.primary;
    ctx.fillText(`${score} ${colors.emoji}`, width / 2, centerY + 83);

    // Footer text
    ctx.font = "400 14px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("Live audience sentiment", width / 2, centerY + 150);
    
    ctx.globalAlpha = 1;
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
      drawFrame(ctx, currentFrameIndex, Math.min(1, frameProgress), elapsed);

      if (elapsed < totalDuration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        setIsReady(true);
        drawFrame(ctx, frames.length - 1, 1, totalDuration);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const downloadReel = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) drawFrame(ctx, frames.length - 1, 1, totalDuration);
    
    const link = document.createElement("a");
    link.download = `${entityName.replace(/\s+/g, "-")}-pulse-reel.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();

    toast({ title: "Downloaded! 📥", description: "Ready to share as Reel" });
  };

  const shareToInstagram = async () => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) drawFrame(ctx, frames.length - 1, 1, totalDuration);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png");
      });

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `${entityName}-pulse.png`, { type: "image/png" });
        const shareData = {
          files: [file],
          title: `${entityName}'s Pulse`,
          text: `What does the crowd think? ${score}/100 ${colors.emoji}\n\n#MAIPulse #LiveSentiment`,
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
    if (ctx) drawFrame(ctx, frames.length - 1, 1, totalDuration);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png");
      });

      if (navigator.share) {
        const file = new File([blob], `${entityName}-pulse.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: `${entityName}'s Pulse`,
          text: `${score}/100 - Live audience sentiment`,
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
        drawFrame(ctx, 0, 1, 0);
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
        <h3 className="font-semibold">Create Viral Reel</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">10s • Dynamic</span>
      </div>

      {/* Canvas Preview */}
      <div className="relative aspect-[9/16] max-h-[420px] mx-auto rounded-xl overflow-hidden bg-black border border-border">
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
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            </div>
          </motion.button>
        )}
      </div>

      {/* Frame progress indicator */}
      <div className="flex justify-center gap-1.5">
        {frames.map((f, i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full transition-all flex items-center ${
              i === currentFrame ? "bg-primary" : "bg-white/20"
            }`}
            animate={{ width: i === currentFrame ? 32 : 8 }}
          >
            {i === currentFrame && isPlaying && (
              <motion.div 
                className="h-full bg-white/50 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: frames[i].duration / 1000, ease: "linear" }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Frame labels */}
      <div className="flex justify-center gap-3 text-xs text-muted-foreground">
        {frames.map((f, i) => (
          <span key={i} className={i === currentFrame ? "text-primary font-medium" : ""}>
            {f.label}
          </span>
        ))}
      </div>

      {/* Controls */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reel Settings</p>
        
        <div className="grid grid-cols-2 gap-4">
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

        <div className="pt-2 border-t border-white/5 text-xs text-muted-foreground grid grid-cols-2 gap-1">
          <p>✔ Hook-first format</p>
          <p>✔ Vote animations</p>
          <p>✔ Twist moment</p>
          <p>✔ Brand close</p>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          onClick={downloadReel}
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Save</span>
        </motion.button>

        <motion.button
          onClick={shareToInstagram}
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Instagram className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-pink-300">Share as Reel</span>
        </motion.button>

        <motion.button
          onClick={shareReel}
          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </motion.button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        <Sparkles className="w-3 h-3 inline mr-1" />
        No editing. No thinking. One tap.
      </p>
    </div>
  );
};
