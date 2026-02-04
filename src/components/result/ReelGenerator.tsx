import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Download, Share2, Loader2, Play, RotateCcw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReelGeneratorProps {
  entityName: string;
  score: number;
  category: string;
  vibeCheck: string;
  evidence?: Array<{ title: string; value: string; positive: boolean }>;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return { primary: "#14b8a6", secondary: "#06b6d4" };
  if (score >= 75) return { primary: "#22c55e", secondary: "#10b981" };
  if (score >= 50) return { primary: "#f59e0b", secondary: "#eab308" };
  return { primary: "#ef4444", secondary: "#f43f5e" };
};

const getScoreEmoji = (score: number) => {
  if (score >= 90) return "💎";
  if (score >= 75) return "✅";
  if (score >= 50) return "⚠️";
  return "🚨";
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return "Diamond Tier";
  if (score >= 75) return "Trusted";
  if (score >= 50) return "Mixed";
  return "Risky";
};

export const ReelGenerator = ({
  entityName,
  score,
  category,
  vibeCheck,
  evidence = [],
}: ReelGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const { toast } = useToast();

  const colors = getScoreColor(score);
  const emoji = getScoreEmoji(score);
  const label = getScoreLabel(score);

  const frames = [
    { type: "intro", duration: 1500 },
    { type: "score-reveal", duration: 2000 },
    { type: "vibe-check", duration: 2000 },
    { type: "evidence", duration: 2500 },
    { type: "outro", duration: 1500 },
  ];

  const totalDuration = frames.reduce((acc, f) => acc + f.duration, 0);

  const drawFrame = (ctx: CanvasRenderingContext2D, frameIndex: number, progress: number) => {
    const width = 540;
    const height = 960;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0a0a0f");
    gradient.addColorStop(0.5, "#111118");
    gradient.addColorStop(1, "#0a0a0f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Accent glow
    const glowGradient = ctx.createRadialGradient(width / 2, height / 3, 0, width / 2, height / 3, 300);
    glowGradient.addColorStop(0, `${colors.primary}15`);
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);

    // MAI Pulse branding
    ctx.font = "bold 14px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = colors.primary;
    ctx.textAlign = "center";
    ctx.fillText("MAI PULSE", width / 2, 60);

    const frame = frames[frameIndex];
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOut(progress);

    switch (frame.type) {
      case "intro":
        // Entity name reveal
        ctx.globalAlpha = easedProgress;
        ctx.font = "bold 42px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        
        // Wrap text if needed
        const words = entityName.split(" ");
        let line = "";
        let y = height / 2 - 20;
        for (const word of words) {
          const testLine = line + word + " ";
          if (ctx.measureText(testLine).width > width - 80) {
            ctx.fillText(line.trim(), width / 2, y);
            line = word + " ";
            y += 50;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), width / 2, y);

        ctx.font = "500 18px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(category, width / 2, y + 50);
        ctx.globalAlpha = 1;
        break;

      case "score-reveal":
        // Animated score counter
        const displayScore = Math.round(score * easedProgress);
        
        // Score circle
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 - 60, 120, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 12;
        ctx.stroke();

        // Progress arc
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 - 60, 120, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (displayScore / 100)));
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.stroke();

        // Score number
        ctx.font = "bold 72px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(displayScore.toString(), width / 2, height / 2 - 40);

        ctx.font = "500 20px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("/ 100", width / 2, height / 2 + 10);

        // Label
        ctx.font = "bold 24px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = colors.primary;
        ctx.fillText(`${emoji} ${label}`, width / 2, height / 2 + 120);
        break;

      case "vibe-check":
        // Quote marks
        ctx.font = "120px serif";
        ctx.fillStyle = `${colors.primary}30`;
        ctx.fillText("\u201C", 60, height / 2 - 80);

        // Vibe check text
        ctx.font = "italic 22px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.textAlign = "center";
        
        const maxWidth = width - 100;
        const vibeWords = vibeCheck.split(" ");
        let vibeLine = "";
        let vibeY = height / 2 - 40;
        const lineHeight = 34;
        let lineCount = 0;

        for (const word of vibeWords) {
          const testLine = vibeLine + word + " ";
          if (ctx.measureText(testLine).width > maxWidth) {
            if (lineCount < 4) {
              ctx.globalAlpha = Math.min(1, easedProgress * 2 - lineCount * 0.2);
              ctx.fillText(vibeLine.trim(), width / 2, vibeY);
              vibeY += lineHeight;
              lineCount++;
            }
            vibeLine = word + " ";
          } else {
            vibeLine = testLine;
          }
        }
        if (lineCount < 4) {
          ctx.globalAlpha = Math.min(1, easedProgress * 2 - lineCount * 0.2);
          ctx.fillText(vibeLine.trim() + "...", width / 2, vibeY);
        }
        ctx.globalAlpha = 1;
        break;

      case "evidence":
        ctx.font = "bold 16px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.textAlign = "center";
        ctx.fillText("KEY INSIGHTS", width / 2, height / 2 - 140);

        const displayEvidence = evidence.slice(0, 3);
        displayEvidence.forEach((item, i) => {
          const itemProgress = Math.max(0, Math.min(1, (easedProgress * 3) - i * 0.5));
          ctx.globalAlpha = itemProgress;
          
          const yPos = height / 2 - 60 + i * 80;
          
          // Badge background
          ctx.fillStyle = item.positive ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)";
          const badgeWidth = 400;
          const badgeHeight = 60;
          const badgeX = (width - badgeWidth) / 2;
          ctx.beginPath();
          ctx.roundRect(badgeX, yPos - 20, badgeWidth, badgeHeight, 12);
          ctx.fill();

          // Icon
          ctx.font = "24px serif";
          ctx.textAlign = "left";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(item.positive ? "✓" : "!", badgeX + 20, yPos + 18);

          // Title
          ctx.font = "600 14px Plus Jakarta Sans, system-ui";
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fillText(item.title, badgeX + 55, yPos + 5);

          // Value
          ctx.font = "500 16px Plus Jakarta Sans, system-ui";
          ctx.fillStyle = "#ffffff";
          const truncatedValue = item.value.length > 35 ? item.value.slice(0, 35) + "..." : item.value;
          ctx.fillText(truncatedValue, badgeX + 55, yPos + 28);
        });
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        break;

      case "outro":
        ctx.globalAlpha = easedProgress;
        
        // Entity name
        ctx.font = "bold 32px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(entityName, width / 2, height / 2 - 60);

        // Final score
        ctx.font = "bold 64px Plus Jakarta Sans, system-ui";
        const scoreGradient = ctx.createLinearGradient(width / 2 - 60, 0, width / 2 + 60, 0);
        scoreGradient.addColorStop(0, colors.primary);
        scoreGradient.addColorStop(1, colors.secondary);
        ctx.fillStyle = scoreGradient;
        ctx.fillText(score.toString(), width / 2, height / 2 + 30);

        // CTA
        ctx.font = "500 18px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("Check your pulse at maipulse.app", width / 2, height / 2 + 120);
        
        ctx.globalAlpha = 1;
        break;
    }

    // Footer branding
    ctx.font = "500 12px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "center";
    ctx.fillText("Powered by MAI Protocol", width / 2, height - 40);
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

      // Find current frame
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
          // Animation complete
          setIsPlaying(false);
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
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const generateVideo = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);

    try {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // For now, create a series of frames and compile
      // In production, you'd use MediaRecorder API
      const chunks: Blob[] = [];
      const fps = 30;
      const totalFrames = Math.ceil((totalDuration / 1000) * fps);

      for (let i = 0; i < totalFrames; i++) {
        const elapsed = (i / fps) * 1000;
        
        let accumulated = 0;
        let frameIndex = 0;
        let frameStart = 0;
        
        for (let j = 0; j < frames.length; j++) {
          if (elapsed < accumulated + frames[j].duration) {
            frameIndex = j;
            frameStart = accumulated;
            break;
          }
          accumulated += frames[j].duration;
        }

        const progress = (elapsed - frameStart) / frames[frameIndex].duration;
        drawFrame(ctx, frameIndex, Math.min(1, progress));
      }

      // Create a simple downloadable image sequence (first frame for now)
      drawFrame(ctx, frames.length - 1, 1);
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          setVideoBlob(blob);
          toast({ title: "Reel preview ready!", description: "Download or share your reel" });
        }
        setIsGenerating(false);
      }, "image/png");

    } catch (error) {
      console.error("Error generating video:", error);
      toast({ title: "Error", description: "Failed to generate reel", variant: "destructive" });
      setIsGenerating(false);
    }
  };

  const downloadReel = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `${entityName.replace(/\s+/g, "-")}-mai-pulse.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();

    toast({ title: "Downloaded!", description: "Share it on your favorite platform" });
  };

  const shareReel = async () => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], `${entityName}-mai-pulse.png`, { type: "image/png" });
          await navigator.share({
            files: [file],
            title: `${entityName}'s MAI Pulse Score`,
            text: `Check out ${entityName}'s trust score on MAI Pulse!`,
          });
        } else {
          downloadReel();
        }
      }, "image/png");
    } catch (error) {
      downloadReel();
    }
  };

  useEffect(() => {
    // Draw initial frame
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
  }, [entityName, score]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Video className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Create Shareable Reel</h3>
      </div>

      {/* Canvas Preview */}
      <div className="relative aspect-[9/16] max-h-[400px] mx-auto rounded-xl overflow-hidden bg-black border border-border">
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          className="w-full h-full object-contain"
        />
        
        {/* Play overlay */}
        {!isPlaying && !isGenerating && (
          <motion.button
            onClick={playPreview}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </motion.button>
        )}

        {/* Loading overlay */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-white/80">Generating reel...</p>
            </div>
          </div>
        )}
      </div>

      {/* Frame indicator */}
      <div className="flex justify-center gap-1.5">
        {frames.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === currentFrame ? "w-6 bg-primary" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          onClick={playPreview}
          disabled={isPlaying || isGenerating}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border hover:bg-secondary/80 disabled:opacity-50 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isPlaying ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="font-medium text-sm">Preview</span>
        </motion.button>

        <motion.button
          onClick={generateVideo}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span className="font-medium text-sm">Generate</span>
        </motion.button>
      </div>

      {/* Download/Share */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          onClick={downloadReel}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Download</span>
        </motion.button>

        <motion.button
          onClick={shareReel}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </motion.button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Perfect for Instagram Stories, TikTok & Reels
      </p>
    </div>
  );
};
