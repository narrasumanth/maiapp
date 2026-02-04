import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, User, Award, Twitter, Linkedin, Copy, Check, MessageCircle, QrCode, Link2, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

type ShareMode = "score" | "profile";

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
  if (score >= 90) return "from-teal-400 via-cyan-500 to-blue-500";
  if (score >= 75) return "from-emerald-400 via-green-500 to-teal-500";
  if (score >= 50) return "from-amber-400 via-yellow-500 to-orange-500";
  return "from-rose-400 via-red-500 to-pink-600";
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
  const [shareMode, setShareMode] = useState<ShareMode>("score");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const emoji = getScoreEmoji(score);
  const label = getScoreLabel(score);
  const gradient = getScoreGradient(score);

  const shareUrl = `${window.location.origin}/lookup/${shareCode}`;

  const scoreOnlyText = `${emoji} My MAI Pulse Score: ${score}/100 - ${label}\n"${vibeCheck.slice(0, 60)}..."\nCheck your pulse at`;
  const fullProfileText = `${emoji} ${entityName}'s Full MAI Pulse Profile\n\n📊 Score: ${score}/100 (${label})\n📝 "${vibeCheck.slice(0, 80)}..."\n\n🔍 Key Insights:\n${evidence.slice(0, 3).map(e => `${e.positive ? "✅" : "⚠️"} ${e.title}: ${e.value}`).join("\n")}\n\nVerify at`;

  const currentText = shareMode === "score" ? scoreOnlyText : fullProfileText;

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${currentText}\n${shareUrl}`);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${currentText}\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${currentText}\n${shareUrl}`);
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
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-lg mx-4 glass-card-glow p-6 max-h-[90vh] overflow-y-auto"
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
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share Your Pulse
            </h2>
            <p className="text-sm text-muted-foreground">Choose what to share</p>
          </div>

          {/* Share Mode Toggle */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setShareMode("score")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                shareMode === "score"
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-secondary/30 border-white/10 text-muted-foreground hover:border-white/20"
              }`}
            >
              <Award className="w-6 h-6" />
              <span className="font-medium">Score Only</span>
              <span className="text-xs opacity-70">Quick share</span>
            </button>
            <button
              onClick={() => setShareMode("profile")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                shareMode === "profile"
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-secondary/30 border-white/10 text-muted-foreground hover:border-white/20"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="font-medium">Full Profile</span>
              <span className="text-xs opacity-70">Detailed view</span>
            </button>
          </div>

          {/* Preview Card */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-1 mb-6`}>
            <div className="bg-background/95 backdrop-blur rounded-xl p-5">
              <div className="absolute top-2 right-2 opacity-20">
                {shareMode === "score" ? (
                  <Award className="w-12 h-12" />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-primary tracking-wider mb-1">MAI PULSE</p>
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

                {/* Score Badge */}
                <div className={`flex items-center gap-2 pb-3 mb-3 border-b border-white/10`}>
                  <span className="text-xl">{emoji}</span>
                  <span className={`font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {label}
                  </span>
                </div>

                {/* Vibe Check */}
                <p className="text-sm italic text-muted-foreground mb-3">"{vibeCheck.slice(0, 80)}..."</p>

                {/* Evidence (Profile mode only) */}
                {shareMode === "profile" && evidence.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Insights</p>
                    {evidence.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={item.positive ? "text-score-green" : "text-score-yellow"}>
                          {item.positive ? "✅" : "⚠️"}
                        </span>
                        <span className="text-muted-foreground">{item.title}:</span>
                        <span className="font-medium truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
      </motion.div>
    </AnimatePresence>
  );
};
