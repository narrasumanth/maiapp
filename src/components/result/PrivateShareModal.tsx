import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Copy, Check, Shield, Clock, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PrivateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
}

interface ShareLink {
  id: string;
  access_token: string;
  access_level: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  created_at: string;
}

const ACCESS_LEVELS = [
  { value: "basic", label: "Basic", description: "Score and category only" },
  { value: "detailed", label: "Detailed", description: "Score, evidence, and summary" },
  { value: "full", label: "Full Access", description: "All information including reviews" },
];

export const PrivateShareModal = ({ 
  isOpen, 
  onClose, 
  entityId, 
  entityName 
}: PrivateShareModalProps) => {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [accessLevel, setAccessLevel] = useState("detailed");
  const [expiresIn, setExpiresIn] = useState("7d");
  const [maxUses, setMaxUses] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchLinks();
    }
  }, [isOpen, entityId]);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from("private_share_links")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (data) {
      setLinks(data as ShareLink[]);
    }
  };

  const generateToken = () => {
    // Generate cryptographically secure 12-character alphanumeric code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: I, O, 0, 1
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  };

  const calculateExpiry = () => {
    if (!expiresIn) return null;
    const now = new Date();
    switch (expiresIn) {
      case "1h": return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case "24h": return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case "7d": return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d": return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      case "never": return null;
      default: return null;
    }
  };

  const handleCreateLink = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoading(true);

    try {
      const token = generateToken();
      const { data, error } = await supabase
        .from("private_share_links")
        .insert({
          entity_id: entityId,
          created_by: user.id,
          access_token: token,
          access_level: accessLevel,
          expires_at: calculateExpiry(),
          max_uses: maxUses ? parseInt(maxUses) : null,
        })
        .select()
        .single();

      if (error) throw error;

      setLinks([data as ShareLink, ...links]);
      toast({
        title: "Private link created",
        description: "Share this link with trusted contacts.",
      });
    } catch (error) {
      console.error("Error creating link:", error);
      toast({
        title: "Error",
        description: "Failed to create private link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (link: ShareLink) => {
    const url = `${window.location.origin}/view/${link.access_token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Link copied!",
      description: "Private share link copied to clipboard.",
    });
  };

  const handleDeactivate = async (linkId: string) => {
    try {
      await supabase
        .from("private_share_links")
        .update({ is_active: false })
        .eq("id", linkId);

      setLinks(links.map(l => l.id === linkId ? { ...l, is_active: false } : l));
      toast({
        title: "Link deactivated",
        description: "This link will no longer work.",
      });
    } catch (error) {
      console.error("Error deactivating link:", error);
    }
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
            className="relative w-full max-w-lg glass-card-glow p-4 sm:p-6 my-4"
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
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Private Share Links</h2>
              <p className="text-sm text-muted-foreground">Control who sees detailed info</p>
            </div>
          </div>

          {/* Create New Link */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-white/10 mb-6">
            <h3 className="font-medium mb-3">Create New Link</h3>
            
            {/* Access Level */}
            <div className="mb-3">
              <label className="text-sm text-muted-foreground mb-2 block">Access Level</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCESS_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setAccessLevel(level.value)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      accessLevel === level.value
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-xs font-medium">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry */}
            <div className="mb-3">
              <label className="text-sm text-muted-foreground mb-2 block">
                <Clock className="w-3 h-3 inline mr-1" />
                Expires In
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-white/10 text-sm"
              >
                <option value="1h">1 hour</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="never">Never</option>
              </select>
            </div>

            {/* Max Uses */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                <Users className="w-3 h-3 inline mr-1" />
                Max Uses (optional)
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                min="1"
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-white/10 text-sm"
              />
            </div>

            <button
              onClick={handleCreateLink}
              disabled={isLoading}
              className="w-full btn-neon py-2 flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              {isLoading ? "Creating..." : "Create Private Link"}
            </button>
          </div>

          {/* Existing Links */}
          <div>
            <h3 className="font-medium mb-3">Your Links ({links.length})</h3>
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No private links created yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={`p-3 rounded-lg border ${
                      link.is_active ? "border-white/10 bg-secondary/20" : "border-score-red/20 bg-score-red/5 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        ...{link.access_token.slice(-8)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          link.access_level === 'full' ? 'bg-primary/20 text-primary' :
                          link.access_level === 'detailed' ? 'bg-accent/20 text-accent' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {link.access_level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {link.use_count} uses{link.max_uses ? ` / ${link.max_uses}` : ""}
                      </span>
                      <span>
                        {link.expires_at 
                          ? `Expires ${formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}`
                          : "Never expires"
                        }
                      </span>
                    </div>
                    {link.is_active && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleCopy(link)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-xs transition-colors"
                        >
                          {copiedId === link.id ? (
                            <><Check className="w-3 h-3" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy</>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeactivate(link.id)}
                          className="px-3 py-1.5 rounded-lg bg-score-red/10 hover:bg-score-red/20 text-score-red text-xs transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
