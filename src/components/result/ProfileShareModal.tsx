import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, User, Award, Twitter, Linkedin, Copy, Check, MessageCircle, Link2, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReelGenerator } from "./ReelGenerator";

interface ProfileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  score: number;
  category: string;
  vibeCheck: string;
  shareCode: string;
  evidence?: Array<{ title: string; value: string; positive: boolean }>;
}

type ShareTab = "quick" | "reel";

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

const getScoreGradient = (score: number) => {
  if (score >= 90) return "from-teal-400 to-cyan-500";
  if (score >= 75) return "from-emerald-400 to-green-500";
  if (score >= 50) return "from-amber-400 to-yellow-500";
  return "from-rose-400 to-red-500";
};

export const ProfileShareModal = ({
  isOpen,
  onClose,
  entityName,
  score,
  category,
  vibeCheck,
  shareCode,
  evidence = [],
}: ProfileShareModalProps) => {
  const [activeTab, setActiveTab] = useState<ShareTab>("quick");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const emoji = getScoreEmoji(score);
  const label = getScoreLabel(score);
  const gradient = getScoreGradient(score);

  const shareUrl = `${window.location.origin}/lookup/${shareCode}`;
  const shareText = `${emoji} ${entityName}'s MAI Pulse: ${score}/100 - ${label}\n"${vibeCheck.slice(0, 60)}..."\nCheck yours at`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
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
              <Share2 className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Share</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("quick")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "quick"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Share2 className="w-4 h-4" />
              Quick Share
            </button>
            <button
              onClick={() => setActiveTab("reel")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "reel"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video className="w-4 h-4" />
              Create Reel
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {activeTab === "quick" ? (
              <div className="space-y-4">
                {/* Preview Card */}
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-0.5`}>
                  <div className="bg-card rounded-[10px] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary font-medium mb-1">MAI PULSE</p>
                        <p className="font-semibold">{entityName}</p>
                        <p className="text-xs text-muted-foreground">{category}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                          {score}
                        </p>
                        <p className="text-xs text-muted-foreground">/100</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground italic">
                        "{vibeCheck.slice(0, 60)}..."
                      </p>
                    </div>
                  </div>
                </div>

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
                    onClick={copyLink}
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
                    onClick={copyLink}
                    className="text-xs text-primary hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              <ReelGenerator
                entityName={entityName}
                score={score}
                category={category}
                vibeCheck={vibeCheck}
                evidence={evidence}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
