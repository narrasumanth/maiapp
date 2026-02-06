import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Twitter, Linkedin, Copy, Check, MessageCircle, Link2, Sparkles, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  score: number;
  category: string;
  vibeCheck: string;
  shareCode: string;
  funFact?: string;
  hardFact?: string;
  evidence?: Array<{ title: string; value: string; positive: boolean }>;
}

const getScoreEmoji = (score: number) => {
  if (score >= 90) return "💎";
  if (score >= 75) return "✅";
  if (score >= 50) return "⚠️";
  return "🚨";
};

const getPulseLabel = (score: number) => {
  if (score >= 90) return "Diamond Tier";
  if (score >= 75) return "Trustworthy";
  if (score >= 50) return "Mixed Signals";
  return "High Risk";
};

const getScoreGradient = (score: number) => {
  if (score >= 90) return "from-score-diamond to-primary";
  if (score >= 75) return "from-score-green to-primary";
  if (score >= 50) return "from-score-yellow to-primary";
  return "from-score-red to-primary";
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-score-diamond";
  if (score >= 75) return "text-score-green";
  if (score >= 50) return "text-score-yellow";
  return "text-score-red";
};

export const ProfileShareModal = ({
  isOpen,
  onClose,
  entityName,
  score,
  category,
  vibeCheck,
  shareCode,
  funFact,
  hardFact,
}: ProfileShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const emoji = getScoreEmoji(score);
  const label = getPulseLabel(score);
  const gradient = getScoreGradient(score);
  const scoreColor = getScoreColor(score);

  const shareUrl = `${window.location.origin}/lookup/${shareCode.toLowerCase()}`;
  
  // Share text with new branding
  const shareText = `${emoji} What the Internet Thinks of ${entityName}\n\n📊 Pulse Score: ${score}/100 (${label})\n💬 "${vibeCheck.slice(0, 80)}${vibeCheck.length > 80 ? '...' : ''}"\n${funFact ? `\n😂 Fun Fact: ${funFact.slice(0, 60)}...` : ''}\n\n🔍 Check anyone's reputation at`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const encoded = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">What the Internet Thinks</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
            {/* Profile Card with Score */}
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-0.5`}>
              <div className="bg-card rounded-[10px] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-primary font-bold tracking-wider mb-1">MAI PULSE</p>
                    <p className="text-xl font-bold">{entityName}</p>
                    <p className="text-sm text-muted-foreground">{category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-4xl font-black ${scoreColor}`}>{score}</p>
                    <p className="text-xs text-muted-foreground">/100</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <span className="text-xl">{emoji}</span>
                  <span className={`font-semibold ${scoreColor}`}>{label}</span>
                </div>
              </div>
            </div>

            {/* Vibe Check */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">AI Vibe Check</span>
              </div>
              <p className="text-sm italic text-foreground/90 leading-relaxed">
                "{vibeCheck}"
              </p>
            </div>

            {/* Fun Facts Section */}
            {(funFact || hardFact) && (
              <div className="grid gap-3">
                {funFact && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">😂</span>
                      <span className="text-xs font-medium text-primary">Fun Fact</span>
                    </div>
                    <p className="text-sm text-foreground/90">{funFact}</p>
                  </div>
                )}
                {hardFact && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Hard Fact</span>
                    </div>
                    <p className="text-sm text-foreground/90">{hardFact}</p>
                  </div>
                )}
              </div>
            )}

            {/* Share Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={shareToTwitter}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span className="text-xs">Twitter</span>
              </button>
              <button
                onClick={shareToLinkedIn}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-xs">LinkedIn</span>
              </button>
              <button
                onClick={shareToWhatsApp}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">WhatsApp</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-score-green" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Direct Link */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-border">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-muted-foreground truncate outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="text-xs text-primary hover:underline shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
