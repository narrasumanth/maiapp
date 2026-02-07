import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Link2, Copy, Check, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  shareCode: string;
  score: number;
}

export const QRShareModal = ({
  isOpen,
  onClose,
  entityName,
  shareCode,
  score,
}: QRShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/lookup/${shareCode.toLowerCase()}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.fillRect(0, 0, 512, 512);
      ctx?.drawImage(img, 0, 0, 512, 512);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `mai-${shareCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const getScoreColor = () => {
    if (score >= 86) return "#5eead4"; // cyan
    if (score >= 61) return "#22c55e"; // green
    if (score >= 40) return "#eab308"; // yellow
    return "#ef4444"; // red
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            className="relative w-full max-w-sm glass-card-glow p-4 sm:p-6 my-4"
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

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Share QR Code</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Scan to view {entityName}'s MAI Score
            </p>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl inline-block mb-6">
              <QRCodeSVG
                id="qr-code-svg"
                value={shareUrl}
                size={200}
                level="H"
                fgColor="#0f172a"
                bgColor="#ffffff"
                imageSettings={{
                  src: "",
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            {/* Score Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: `${getScoreColor()}20`, color: getScoreColor() }}
            >
              <span className="text-2xl font-bold">{score}</span>
              <span className="text-sm">MAI Score</span>
            </div>

            {/* Share Code */}
            <div className="p-3 rounded-xl bg-secondary/30 border border-white/10 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Share Code</p>
              <p className="font-mono text-lg font-bold text-primary">{shareCode}</p>
            </div>

            {/* URL */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-white/10 mb-6">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                {shareUrl}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-score-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadQR}
              className="w-full btn-glass flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </button>
          </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
