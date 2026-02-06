import { useState } from "react";
import { 
  Copy, CheckCircle, Link2, QrCode, Share2, 
  Twitter, Facebook, Linkedin, MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: {
    id: string;
    name: string;
  } | null;
}

export const ProfileShareModal = ({ isOpen, onClose, entity }: ProfileShareModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!entity) return null;

  const generatePermanentLink = () => {
    const nameSlug = entity.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const idPrefix = entity.id.replace(/-/g, '').substring(0, 8);
    return `${window.location.origin}/lookup/${nameSlug}_${idPrefix}`;
  };

  const profileUrl = generatePermanentLink();
  const shareText = `Check out ${entity.name}'s reputation on MAI Pulse`;

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`,
      color: "hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/30",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      color: "hover:bg-[#4267B2]/10 hover:border-[#4267B2]/30",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
      color: "hover:bg-[#0077B5]/10 hover:border-[#0077B5]/30",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`,
      color: "hover:bg-[#25D366]/10 hover:border-[#25D366]/30",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Profile being shared */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
            <p className="font-medium">{entity.name}</p>
            <p className="text-sm text-muted-foreground">Your permanent profile link</p>
          </div>

          {/* Copy Link */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/20 border border-border">
            <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate flex-1 font-mono">
              {profileUrl}
            </span>
            <button
              onClick={copyLink}
              className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* QR Code Toggle */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border flex items-center justify-center gap-2 transition-colors"
          >
            <QrCode className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{showQR ? "Hide" : "Show"} QR Code</span>
          </button>

          {showQR && (
            <div className="flex justify-center p-4 rounded-xl bg-white">
              <QRCodeSVG 
                value={profileUrl} 
                size={180}
                level="H"
                includeMargin
              />
            </div>
          )}

          {/* Social Share */}
          <div>
            <p className="text-sm font-medium mb-3">Share on social media</p>
            <div className="grid grid-cols-4 gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/20 border border-border transition-all ${social.color}`}
                >
                  <social.icon className="w-5 h-5" />
                  <span className="text-xs">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
