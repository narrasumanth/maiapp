import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Twitter, Linkedin, Link2, Check, Share2, MessageCircle, Copy } from "lucide-react";
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
  
  const shareUrl = `${window.location.origin}/result?q=${encodeURIComponent(entityName)}`;
  
  const viralTexts = [
    `${emoji} I just ran ${entityName} through MAI Protocol and got a ${score}/100 (${label})! "${vibeCheck}" 🔍 Check any reputation at:`,
    `👀 Before you trust ${entityName}, you NEED to see this... They scored ${score}/100 on MAI Protocol ${emoji} Don't get scammed - verify first:`,
    `🚀 MAI Protocol just analyzed ${entityName}: ${score}/100 ${emoji} "${vibeCheck}" The internet's credit score for EVERYTHING:`,
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
          className="relative w-full max-w-lg mx-4 glass-card-glow p-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-neon-gradient flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Share Your Results</h2>
              <p className="text-sm text-muted-foreground">Spread the word about {entityName}</p>
            </div>
          </div>

          {/* Preview Card */}
          <div className="glass-card p-4 mb-6 border border-primary/30">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{emoji}</div>
              <div>
                <div className="font-bold text-lg">{entityName}</div>
                <div className="text-primary font-semibold">{score}/100 • {label}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground italic">"{vibeCheck}"</p>
          </div>

          {/* Caption Options */}
          <div className="space-y-2 mb-6">
            <p className="text-sm font-medium text-muted-foreground">Choose your caption:</p>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
