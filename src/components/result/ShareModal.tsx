import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Twitter, Linkedin, Link2, Check, MessageCircle, Copy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  score: number;
  category: string;
  vibeCheck: string;
  shareCode?: string;
}

const getScoreEmoji = (score: number) => {
  if (score >= 86) return "💎";
  if (score >= 61) return "✅";
  if (score >= 40) return "⚠️";
  return "🚨";
};

const getScoreLabel = (score: number) => {
  if (score >= 86) return "Strong Pulse Signal";
  if (score >= 61) return "Positive Pulse";
  if (score >= 40) return "Mixed Pulse";
  return "Low Pulse";
};

const getScoreGradient = (score: number) => {
  if (score >= 86) return "from-teal-400 via-cyan-500 to-blue-500";
  if (score >= 61) return "from-emerald-400 via-green-500 to-teal-500";
  if (score >= 40) return "from-amber-400 via-yellow-500 to-orange-500";
  return "from-rose-400 via-red-500 to-pink-600";
};

export const ShareModal = ({ 
  isOpen, 
  onClose, 
  entityName, 
  score, 
  category,
  vibeCheck,
  shareCode 
}: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const emoji = getScoreEmoji(score);
  const label = getScoreLabel(score);
  const gradient = getScoreGradient(score);
  
  const shareUrl = shareCode 
    ? `${window.location.origin}/lookup/${shareCode.toLowerCase()}`
    : `${window.location.origin}/lookup/${encodeURIComponent(entityName.toLowerCase().replace(/\s+/g, '-'))}`;
  
  const codeText = shareCode ? ` [Code: ${shareCode}]` : "";
  
  const viralTexts = [
    `${emoji} ${entityName}'s Pulse: ${score}/100 on MAI Pulse${codeText} — Our AI checked the receipts. What's YOUR pulse?`,
    `Just ran ${entityName} through MAI Pulse 🔍 Score: ${score}/100 ${emoji}${codeText} The internet never forgets (and neither does our AI)`,
    `${entityName} is ${label} according to MAI Pulse (${score}/100) ${emoji}${codeText} Trust, but verify—especially online`,
    `🎯 ${entityName}: ${score}/100 on MAI Pulse${codeText} — Because Googling someone is so 2010. Know before you go.`,
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
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

        <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            className="relative w-full max-w-md glass-card-glow p-4 sm:p-6 my-4"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Share This Score</h2>
            <p className="text-sm text-muted-foreground">Spread the word!</p>
          </div>

          {/* Shareable Score Card - Redesigned */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-1 mb-6`}>
            <div className="bg-background/95 backdrop-blur rounded-xl p-5">
              <div className="absolute top-2 right-2 opacity-20">
                <Sparkles className="w-16 h-16" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-primary tracking-wider mb-1">MAI PROTOCOL</p>
                    <p className="text-lg font-bold">{entityName}</p>
                    <p className="text-sm text-muted-foreground">{category}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                      {score}
                    </div>
                    <div className="text-xs text-muted-foreground">/ 100</div>
                  </div>
                </div>
                
                <div className={`flex items-center gap-2 pt-3 border-t border-white/10`}>
                  <span className="text-xl">{emoji}</span>
                  <span className={`font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Caption Options */}
          <div className="space-y-2 mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Choose caption:</p>
            <div className="max-h-32 overflow-y-auto space-y-2">
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
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/30 border border-transparent transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Twitter className="w-5 h-5" />
              <span className="text-xs">Twitter</span>
            </motion.button>

            <motion.button
              onClick={shareToLinkedIn}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/30 border border-transparent transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-xs">LinkedIn</span>
            </motion.button>

            <motion.button
              onClick={shareToWhatsApp}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-[#25D366]/20 hover:border-[#25D366]/30 border border-transparent transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">WhatsApp</span>
            </motion.button>

            <motion.button
              onClick={copyLink}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-primary/20 border border-transparent transition-all"
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
