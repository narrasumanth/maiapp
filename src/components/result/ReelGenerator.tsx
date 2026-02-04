import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Download, Share2, Loader2, Play, RotateCcw, Sparkles, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  if (score >= 50) return { primary: "#f59e0b", secondary: "#eab308", emoji: "⚠️" };
  return { primary: "#ef4444", secondary: "#f43f5e", emoji: "🚨" };
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return "Diamond Tier 💎";
  if (score >= 75) return "Trustworthy ✅";
  if (score >= 50) return "Mixed Signals ⚠️";
  return "High Risk 🚨";
};

const getMotivationalText = (score: number) => {
  if (score >= 90) return "Top 1% reputation! 🏆";
  if (score >= 75) return "Verified & authentic 🌟";
  if (score >= 50) return "Room to grow 📈";
  return "Needs attention ⚡";
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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const { toast } = useToast();

  const colors = getScoreColor(score);
  const label = getScoreLabel(score);

  const frames = [
    { type: "intro", duration: 1500 },
    { type: "racing", duration: 2500 },
    { type: "score-reveal", duration: 2000 },
    { type: "highlights", duration: 2500 },
    { type: "outro", duration: 1500 },
  ];

  const totalDuration = frames.reduce((acc, f) => acc + f.duration, 0);

  const drawFrame = (ctx: CanvasRenderingContext2D, frameIndex: number, progress: number) => {
    const width = 540;
    const height = 960;

    // Background gradient - dark professional
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0d1117");
    gradient.addColorStop(0.5, "#161b22");
    gradient.addColorStop(1, "#0d1117");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
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
    glowGradient.addColorStop(0, `${colors.primary}12`);
    glowGradient.addColorStop(1, "transparent");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);

    // MAI Pulse branding
    ctx.font = "bold 14px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = colors.primary;
    ctx.textAlign = "center";
    ctx.fillText("MAI PULSE", width / 2, 55);
    ctx.font = "11px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("Know Your Real Online Pulse", width / 2, 75);

    const frame = frames[frameIndex];
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOut(progress);

    switch (frame.type) {
      case "intro":
        // Entity name with emojis
        ctx.globalAlpha = easedProgress;
        
        // Category emoji
        const categoryEmoji = getCategoryEmoji(category);
        ctx.font = "48px serif";
        ctx.fillText(categoryEmoji, width / 2, height / 2 - 80);

        ctx.font = "bold 38px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        
        // Wrap text if needed
        const words = entityName.split(" ");
        let line = "";
        let y = height / 2;
        for (const word of words) {
          const testLine = line + word + " ";
          if (ctx.measureText(testLine).width > width - 80) {
            ctx.fillText(line.trim(), width / 2, y);
            line = word + " ";
            y += 48;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), width / 2, y);

        ctx.font = "500 16px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(category, width / 2, y + 45);
        
        ctx.font = "20px serif";
        ctx.fillText("🔍 Checking pulse...", width / 2, y + 90);
        
        ctx.globalAlpha = 1;
        break;

      case "racing":
        // Racing towards 100 animation
        const racingScore = Math.round(easedProgress * score);
        const raceProgress = easedProgress * (score / 100);
        
        ctx.font = "bold 18px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText("🏁 Racing to 100...", width / 2, height / 2 - 120);

        // Progress track
        const trackWidth = 400;
        const trackHeight = 30;
        const trackX = (width - trackWidth) / 2;
        const trackY = height / 2 - 60;

        // Track background
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath();
        ctx.roundRect(trackX, trackY, trackWidth, trackHeight, 15);
        ctx.fill();

        // Progress fill
        const progressGradient = ctx.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
        progressGradient.addColorStop(0, colors.primary);
        progressGradient.addColorStop(1, colors.secondary);
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(trackX, trackY, trackWidth * raceProgress, trackHeight, 15);
        ctx.fill();

        // Racing emoji
        ctx.font = "28px serif";
        ctx.fillText("🚀", trackX + (trackWidth * raceProgress) - 14, trackY + trackHeight + 40);

        // Current score
        ctx.font = "bold 64px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = colors.primary;
        ctx.fillText(racingScore.toString(), width / 2, height / 2 + 80);

        ctx.font = "500 18px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("/ 100", width / 2, height / 2 + 110);
        break;

      case "score-reveal":
        // Final score reveal with celebration
        const displayScore = Math.round(score * Math.min(1, easedProgress * 1.2));
        
        // Celebration emojis based on score
        if (easedProgress > 0.5) {
          const celebEmojis = score >= 90 ? ["🎉", "💎", "👑", "⭐", "🏆"] :
                              score >= 75 ? ["✨", "🌟", "💪", "🎯", "✅"] :
                              score >= 50 ? ["📊", "📈", "🔄", "⚡", "💡"] :
                              ["⚠️", "🔍", "📉", "❗", "🚨"];
          
          celebEmojis.forEach((emoji, i) => {
            const angle = (i / celebEmojis.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 160 + Math.sin(easedProgress * Math.PI * 2 + i) * 10;
            const x = width / 2 + Math.cos(angle) * radius;
            const y = height / 2 - 40 + Math.sin(angle) * radius;
            ctx.font = "24px serif";
            ctx.globalAlpha = easedProgress * 0.8;
            ctx.fillText(emoji, x - 12, y + 8);
          });
          ctx.globalAlpha = 1;
        }

        // Score circle
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 - 40, 110, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 14;
        ctx.stroke();

        // Progress arc
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 - 40, 110, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (displayScore / 100)));
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.stroke();

        // Score number
        ctx.font = "bold 72px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(displayScore.toString(), width / 2, height / 2 - 20);

        ctx.font = "500 18px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("/ 100", width / 2, height / 2 + 20);

        // Label with emoji
        ctx.font = "bold 22px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = colors.primary;
        ctx.fillText(label, width / 2, height / 2 + 130);

        // Motivational text
        ctx.font = "500 16px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(getMotivationalText(score), width / 2, height / 2 + 165);
        break;

      case "highlights":
        // Key insights with emojis
        ctx.font = "bold 16px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.textAlign = "center";
        ctx.fillText("🔑 KEY INSIGHTS", width / 2, height / 2 - 160);

        const displayEvidence = evidence.slice(0, 3);
        displayEvidence.forEach((item, i) => {
          const itemProgress = Math.max(0, Math.min(1, (easedProgress * 3) - i * 0.5));
          ctx.globalAlpha = itemProgress;
          
          const yPos = height / 2 - 80 + i * 85;
          
          // Badge background
          ctx.fillStyle = item.positive ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)";
          const badgeWidth = 420;
          const badgeHeight = 70;
          const badgeX = (width - badgeWidth) / 2;
          ctx.beginPath();
          ctx.roundRect(badgeX, yPos - 20, badgeWidth, badgeHeight, 14);
          ctx.fill();

          // Border
          ctx.strokeStyle = item.positive ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Icon emoji
          ctx.font = "24px serif";
          ctx.textAlign = "left";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(item.positive ? "✅" : "⚠️", badgeX + 18, yPos + 20);

          // Title
          ctx.font = "600 13px Plus Jakarta Sans, system-ui";
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fillText(item.title.toUpperCase(), badgeX + 55, yPos + 5);

          // Value
          ctx.font = "500 15px Plus Jakarta Sans, system-ui";
          ctx.fillStyle = "#ffffff";
          const truncatedValue = item.value.length > 38 ? item.value.slice(0, 38) + "..." : item.value;
          ctx.fillText(truncatedValue, badgeX + 55, yPos + 30);
        });
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        break;

      case "outro":
        ctx.globalAlpha = easedProgress;
        
        // Entity name
        ctx.font = "bold 30px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(entityName, width / 2, height / 2 - 80);

        // Final score with glow
        ctx.font = "bold 80px Plus Jakarta Sans, system-ui";
        const scoreGradient = ctx.createLinearGradient(width / 2 - 60, 0, width / 2 + 60, 0);
        scoreGradient.addColorStop(0, colors.primary);
        scoreGradient.addColorStop(1, colors.secondary);
        ctx.fillStyle = scoreGradient;
        ctx.fillText(score.toString(), width / 2, height / 2 + 20);

        // Score emoji
        ctx.font = "40px serif";
        ctx.fillText(colors.emoji, width / 2, height / 2 + 80);

        // CTA with emojis
        ctx.font = "600 16px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = colors.primary;
        ctx.fillText("👆 Check YOUR pulse 👆", width / 2, height / 2 + 140);

        ctx.font = "500 14px Plus Jakarta Sans, system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText("maipulse.app", width / 2, height / 2 + 170);

        // Trending badge
        if (score >= 75) {
          ctx.font = "500 12px Plus Jakarta Sans, system-ui";
          ctx.fillStyle = colors.primary;
          ctx.fillText("🔥 Top Trending Near You", width / 2, height / 2 + 210);
        }
        
        ctx.globalAlpha = 1;
        break;
    }

    // Footer branding
    ctx.font = "500 11px Plus Jakarta Sans, system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.textAlign = "center";
    ctx.fillText("Powered by MAI Protocol", width / 2, height - 35);
  };

  const getCategoryEmoji = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes("person") || lower.includes("celebrity")) return "👤";
    if (lower.includes("company") || lower.includes("brand")) return "🏢";
    if (lower.includes("restaurant") || lower.includes("food")) return "🍽️";
    if (lower.includes("product")) return "📦";
    if (lower.includes("movie") || lower.includes("show")) return "🎬";
    if (lower.includes("music") || lower.includes("artist")) return "🎵";
    if (lower.includes("place") || lower.includes("location")) return "📍";
    if (lower.includes("service")) return "💼";
    return "🌐";
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

  const generateReel = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);

    try {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // Draw final frame
      drawFrame(ctx, frames.length - 1, 1);
      
      const imageData = canvasRef.current.toDataURL("image/png");
      setGeneratedImage(imageData);
      
      toast({ 
        title: "Reel ready! 🎉", 
        description: "Download or share directly to Instagram" 
      });
    } catch (error) {
      console.error("Error generating reel:", error);
      toast({ title: "Error", description: "Failed to generate reel", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReel = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `${entityName.replace(/\s+/g, "-")}-mai-pulse.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();

    toast({ title: "Downloaded! 📥", description: "Share it on your favorite platform" });
  };

  const shareToInstagram = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png");
      });

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `${entityName}-mai-pulse.png`, { type: "image/png" });
        const shareData = {
          files: [file],
          title: `${entityName}'s MAI Pulse`,
          text: `${colors.emoji} Check out ${entityName}'s trust pulse: ${score}/100!\n\n${getMotivationalText(score)}\n\n🔍 Get YOUR pulse at maipulse.app`,
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast({ title: "Shared! 🎉" });
          return;
        }
      }

      // Fallback: Download and show instructions
      downloadReel();
      toast({ 
        title: "Downloaded! 📥", 
        description: "Open Instagram and share from your gallery",
      });
    } catch (error) {
      downloadReel();
    }
  };

  const shareReel = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png");
      });

      if (navigator.share) {
        const file = new File([blob], `${entityName}-mai-pulse.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: `${entityName}'s MAI Pulse`,
          text: `${colors.emoji} ${entityName}'s trust pulse: ${score}/100! Check yours at maipulse.app`,
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
  }, [entityName, score]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Video className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Create Shareable Reel</h3>
        <span className="text-xs text-muted-foreground">📱 Instagram, TikTok, Stories</span>
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
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            </div>
          </motion.button>
        )}

        {/* Loading overlay */}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-white/80">Creating your reel... ✨</p>
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
          onClick={generateReel}
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
        🎬 Perfect for Instagram Stories, TikTok & Reels
      </p>
    </div>
  );
};
