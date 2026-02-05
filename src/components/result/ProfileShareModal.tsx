import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, User, Award, Twitter, Linkedin, Copy, Check, MessageCircle, Link2, Video, FileText } from "lucide-react";
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

type ShareTab = "quick" | "profile" | "reel";

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
  const label = getPulseLabel(score);
  const gradient = getScoreGradient(score);

  const shareUrl = `${window.location.origin}/lookup/${shareCode.toLowerCase()}`;
  
  // Quick share text (score only)
  const quickShareText = `${emoji} ${entityName}'s MAI Pulse: ${score}/100 - ${label}\n\n🔍 Check anyone's reputation at`;
  
  // Full profile share text
  const fullProfileText = `${emoji} ${entityName}'s Full MAI Profile\n\n📊 Pulse Rating: ${score}/100 (${label})\n📁 Category: ${category}\n\n💬 "${vibeCheck.slice(0, 100)}${vibeCheck.length > 100 ? '...' : ''}"\n\n🔑 Key Insights:\n${evidence.slice(0, 3).map(e => `${e.positive ? '✅' : '⚠️'} ${e.title}: ${e.value}`).join('\n')}\n\n🔍 Verify at`;

  const copyText = (text: string, label: string) => async () => {
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    setCopied(true);
    toast({ title: `${label} copied!` });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = (text: string) => () => {
    const encoded = encodeURIComponent(`${text}\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareToWhatsApp = (text: string) => () => {
    const encoded = encodeURIComponent(`${text}\n${shareUrl}`);
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
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === "quick"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award className="w-4 h-4" />
              Pulse Only
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              Full Profile
            </button>
            <button
              onClick={() => setActiveTab("reel")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
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
            {activeTab === "quick" && (
              <div className="space-y-4">
                {/* Quick Share Preview Card */}
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-0.5`}>
                  <div className="bg-card rounded-[10px] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary font-medium mb-1">MAI PULSE</p>
                        <p className="font-semibold">{entityName}</p>
                        <p className="text-xs text-muted-foreground">{category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{score}</p>
                        <p className="text-xs text-muted-foreground">/100</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm font-medium">{emoji} {label}</p>
                    </div>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={shareToTwitter(quickShareText)}
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
                    onClick={shareToWhatsApp(quickShareText)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs">WhatsApp</span>
                  </button>
                  <button
                    onClick={copyText(quickShareText, "Pulse")}
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
                    onClick={copyText("", "Link")}
                    className="text-xs text-primary hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-4">
                {/* Full Profile Preview */}
                <div className="rounded-xl bg-secondary/30 border border-border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}>
                      {emoji}
                    </div>
                    <div>
                      <p className="font-semibold">{entityName}</p>
                      <p className="text-sm text-muted-foreground">{category}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-bold text-primary">{score}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>

                  <p className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
                    "{vibeCheck.slice(0, 80)}..."
                  </p>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Key Insights:</p>
                    <div className="space-y-1.5">
                      {evidence.slice(0, 3).map((e, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span>{e.positive ? "✅" : "⚠️"}</span>
                          <span className="text-muted-foreground">{e.title}:</span>
                          <span className="truncate">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={shareToTwitter(fullProfileText)}
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
                    onClick={shareToWhatsApp(fullProfileText)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-xs">WhatsApp</span>
                  </button>
                  <button
                    onClick={copyText(fullProfileText, "Profile")}
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

                <p className="text-xs text-center text-muted-foreground">
                  📋 Includes pulse rating, vibe check, and key insights
                </p>
              </div>
            )}

            {activeTab === "reel" && (
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
