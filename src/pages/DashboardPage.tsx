import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, Shield, Eye, CheckCircle, Link2, Copy, ExternalLink, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { PulseWaveBackground } from "@/components/home/PulseWaveBackground";

interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  trust_score: number;
  email_verified: boolean;
  phone_verified: boolean;
}

interface ClaimedEntity {
  id: string;
  name: string;
  category: string;
  is_verified: boolean;
  normalized_name: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [claimedEntities, setClaimedEntities] = useState<ClaimedEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUser(session.user);
      await Promise.all([
        fetchProfile(session.user.id),
        fetchClaimedEntities(session.user.id),
      ]);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, trust_score, email_verified, phone_verified")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const fetchClaimedEntities = async (userId: string) => {
    const { data: entities } = await supabase
      .from("entities")
      .select("id, name, category, is_verified, normalized_name")
      .eq("claimed_by", userId);

    if (entities) {
      setClaimedEntities(entities);
    }
  };

  const generatePermanentLink = (entity: ClaimedEntity) => {
    const nameSlug = entity.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const idPrefix = entity.id.replace(/-/g, '').substring(0, 8);
    return `${window.location.origin}/lookup/${nameSlug}_${idPrefix}`;
  };

  const copyLink = (entity: ClaimedEntity) => {
    const link = generatePermanentLink(entity);
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Your permanent profile link has been copied to clipboard.",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-score-green";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <PulseWaveBackground />

      <div className="container mx-auto px-4 relative z-10 pt-8 max-w-3xl">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border-2 border-primary/30">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">
                  {profile?.display_name || user?.email?.split("@")[0]}
                </h1>
                <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-sm">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span className={`font-bold ${getScoreColor(profile?.trust_score || 0)}`}>
                      {profile?.trust_score || 0}
                    </span>
                    <span className="text-muted-foreground">Pulse</span>
                  </div>
                  {profile?.email_verified && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-score-green/10 border border-score-green/20 text-score-green text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Email
                    </div>
                  )}
                  {profile?.phone_verified && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-score-green/10 border border-score-green/20 text-score-green text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Phone
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Claimed Profiles Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Your Profiles</h2>
              </div>
              <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
                {claimedEntities.length} / 4 slots
              </span>
            </div>

            {claimedEntities.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  You haven't claimed any profiles yet
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                >
                  Search & Claim
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {claimedEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="p-4 rounded-xl bg-secondary/20 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          {entity.name}
                          {entity.is_verified && (
                            <CheckCircle className="w-4 h-4 text-score-green" />
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{entity.category}</p>
                      </div>
                      <button
                        onClick={() => {
                          sessionStorage.setItem("mai-entity-id", entity.id);
                          navigate(`/result?q=${encodeURIComponent(entity.name)}`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </div>

                    {/* Permanent Link */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/50">
                      <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                        {generatePermanentLink(entity)}
                      </span>
                      <button
                        onClick={() => copyLink(entity)}
                        className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                        title="Copy link"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <a
                        href={generatePermanentLink(entity)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                        title="Open link"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Link
            to="/flex"
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Create Flex Card</p>
                <p className="text-sm text-muted-foreground">Share your digital identity</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
