import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Twitter, Linkedin, Link2, Check, Share2, MessageCircle, Copy, Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  score: number;
  category: string;
  vibeCheck: string;
}

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

const getScoreColor = (score: number) => {
  if (score >= 90) return "from-cyan-400 to-blue-500";
  if (score >= 75) return "from-green-400 to-emerald-500";
  if (score >= 50) return "from-yellow-400 to-orange-500";
  return "from-red-400 to-rose-500";
};

export const ShareModal = ({ 
  isOpen, 
  onClose, 
  entityName, 
  score, 
  category,
  vibeCheck 
}: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const emoji = getScoreEmoji(score);
  const label = getScoreLabel(score);
  const gradientColor = getScoreColor(score);
  
  const shareUrl = `${window.location.origin}/result?q=${encodeURIComponent(entityName)}`;
  
  const viralTexts = [
    `${emoji} Just verified ${entityName} on MAI Protocol: ${score}/100 "${vibeCheck.slice(0, 60)}..." Check yours at`,
    `👀 Before trusting ${entityName}, I checked MAI Protocol. Score: ${score}/100 ${emoji} Don't get scammed!`,
    `🔍 MAI Protocol says ${entityName} is ${label} (${score}/100) ${emoji} What's YOUR score?`,
    `🚀 I'm a ${score}/100 on MAI Protocol ${emoji} "${vibeCheck.slice(0, 50)}..." Verify anyone at`,
  ];

  const [selectedText, setSelectedText] = useState(viralTexts[0]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${selectedText}\n${shareUrl}`);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${selectedText}\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${selectedText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-lg mx-4 glass-card-glow p-6 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-neon-gradient flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Share Your Score</h2>
              <p className="text-sm text-muted-foreground">Make it viral!</p>
            </div>
          </div>

          {/* Shareable Score Card */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientColor} p-6 mb-6`}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
              <Sparkles className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">MAI PROTOCOL</p>
                  <p className="text-white text-xl font-bold">{entityName}</p>
                  <p className="text-white/60 text-sm">{category}</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-black text-white">{score}</div>
                  <div className="text-white/80 text-sm">/ 100</div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                <span className="text-2xl">{emoji}</span>
                <span className="text-white font-semibold">{label}</span>
              </div>
            </div>
          </div>

          {/* Caption Options */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-medium text-muted-foreground">Choose caption:</p>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {viralTexts.map((text, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedText(text)}
                  className={`w-full p-3 text-left text-sm rounded-xl border transition-all ${
                    selectedText === text 
                      ? "bg-primary/20 border-primary/50" 
                      : "bg-secondary/30 border-white/10 hover:border-white/20"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <motion.button
              onClick={shareToTwitter}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Twitter className="w-5 h-5" />
              <span className="text-xs">Twitter</span>
            </motion.button>

            <motion.button
              onClick={shareToLinkedIn}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-xs">LinkedIn</span>
            </motion.button>

            <motion.button
              onClick={shareToWhatsApp}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">WhatsApp</span>
            </motion.button>

            <motion.button
              onClick={copyLink}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <Check className="w-5 h-5 text-score-green" /> : <Copy className="w-5 h-5" />}
              <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>
            </motion.button>
          </div>

          {/* Direct Link */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-white/10">
            <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-muted-foreground truncate outline-none"
            />
          </div>

          {/* CTA for claiming */}
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-sm text-muted-foreground">
              Is this you? <button className="text-primary hover:underline">Claim this profile</button> to manage your score!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
