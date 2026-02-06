import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Twitter, Linkedin, Copy, Check, MessageCircle, Facebook, Sparkles, Link2, Loader2 } from "lucide-react";
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
  caricatureUrl?: string | null;
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
  caricatureUrl,
}: ProfileShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const emoji = getScoreEmoji(score);
  const label = getPulseLabel(score);
  const gradient = getScoreGradient(score);
  const scoreColor = getScoreColor(score);

  const baseUrl = `${window.location.origin}/lookup/${shareCode.toLowerCase()}`;
  const shareUrl = generatedUrl || baseUrl;
  
  // Compact share text
  const shareText = `${emoji} ${entityName}: ${score}/100 Pulse Score (${label})\n\n"${vibeCheck.slice(0, 100)}${vibeCheck.length > 100 ? '...' : ''}"\n\n🔍 Check anyone's reputation at`;

  const generateShareableUrl = async () => {
    setIsGeneratingUrl(true);
    // The shareCode already contains the entity ID prefix for exact matching
    // Just use the existing URL - no additional generation needed
    setTimeout(() => {
      setGeneratedUrl(baseUrl);
      setIsGeneratingUrl(false);
      toast({ title: "Shareable URL ready!", description: "You can now copy and share this link." });
    }, 500);
  };

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

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
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
            {/* Compact Share Card with Caricature */}
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-0.5`}>
              <div className="bg-card rounded-[10px] p-4">
                <div className="flex gap-4">
                  {/* Caricature thumbnail */}
                  {caricatureUrl && (
                    <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-secondary/50">
                      <img
                        src={caricatureUrl}
                        alt={`${entityName} caricature`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-primary font-bold tracking-wider">MAI PULSE</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{category}</span>
                    </div>
                    <p className="text-lg font-bold truncate">{entityName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">{emoji}</span>
                      <span className={`text-2xl font-black ${scoreColor}`}>{score}</span>
                      <span className="text-sm text-muted-foreground">/100</span>
                      <span className={`text-sm font-semibold ${scoreColor}`}>{label}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vibe Check - Compact */}
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">AI Vibe</span>
              </div>
              <p className="text-sm italic text-foreground/90 line-clamp-2">
                "{vibeCheck}"
              </p>
            </div>

            {/* Fun Fact if available */}
            {funFact && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">😂</span>
                  <span className="text-xs font-medium text-primary">Fun Fact</span>
                </div>
                <p className="text-sm text-foreground/90 line-clamp-2">{funFact}</p>
              </div>
            )}

            {/* Generate Shareable URL Button */}
            <button
              onClick={generateShareableUrl}
              disabled={isGeneratingUrl || !!generatedUrl}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                generatedUrl
                  ? "bg-score-green/20 text-score-green border border-score-green/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isGeneratingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : generatedUrl ? (
                <>
                  <Check className="w-4 h-4" />
                  URL Ready to Share!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Generate Shareable URL
                </>
              )}
            </button>

            {/* Share Buttons */}
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={shareToTwitter}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span className="text-[10px]">Twitter</span>
              </button>
              <button
                onClick={shareToFacebook}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span className="text-[10px]">Facebook</span>
              </button>
              <button
                onClick={shareToLinkedIn}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-[10px]">LinkedIn</span>
              </button>
              <button
                onClick={shareToWhatsApp}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[10px]">WhatsApp</span>
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
                <span className="text-[10px]">{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
