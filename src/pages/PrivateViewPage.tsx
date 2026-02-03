import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, AlertTriangle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreGauge } from "@/components/ScoreGauge";
import { GlassCard } from "@/components/GlassCard";
import { EvidenceSection } from "@/components/result/EvidenceSection";

interface PrivateViewData {
  access_level: string;
  entity: {
    id: string;
    name: string;
    category: string;
    score: number;
    summary?: string;
    vibe_check?: string;
    evidence?: any[];
    about?: string;
    is_verified?: boolean;
    website_url?: string;
    contact_email?: string;
  };
}

const PrivateViewPage = () => {
  const { token } = useParams();
  const [data, setData] = useState<PrivateViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      verifyLink();
    }
  }, [token]);

  const verifyLink = async () => {
    try {
      const { data: result, error: funcError } = await supabase.functions.invoke("public-api", {
        body: { token },
        method: "POST",
      });

      if (funcError) throw funcError;

      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      console.error("Error verifying link:", err);
      setError("Failed to verify link. It may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-score-red/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-score-red" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/" className="btn-neon px-6 py-2 inline-block">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { entity, access_level } = data;
  const isRisky = entity.score < 50;

  const getAccessBadge = () => {
    switch (access_level) {
      case "full": return { label: "Full Access", color: "bg-primary/20 text-primary" };
      case "detailed": return { label: "Detailed View", color: "bg-accent/20 text-accent" };
      default: return { label: "Basic View", color: "bg-secondary text-muted-foreground" };
    }
  };

  const badge = getAccessBadge();

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="fixed inset-0 grid-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </motion.div>

        {/* Private View Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <Shield className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm">
              You're viewing this profile via a private share link
            </span>
          </div>
        </motion.div>

        {/* Main Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-8 text-center mb-6">
            <div className="mb-6">
              <ScoreGauge score={entity.score} size="lg" />
            </div>

            <div className="mb-2">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                {entity.category}
              </span>
            </div>

            <h1 className="text-3xl font-bold mb-4">{entity.name}</h1>

            {entity.is_verified && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-score-green/20 text-score-green text-sm mb-4">
                <Shield className="w-4 h-4" />
                Verified Profile
              </div>
            )}

            {entity.summary && (
              <p className="text-muted-foreground max-w-lg mx-auto">
                {entity.summary}
              </p>
            )}
          </GlassCard>
        </motion.div>

        {/* Risk Warning */}
        {isRisky && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-score-red/10 border border-score-red/20">
              <AlertTriangle className="w-5 h-5 text-score-red shrink-0" />
              <span className="text-sm text-score-red font-medium">
                Proceed with caution - This entity has reputation concerns
              </span>
            </div>
          </motion.div>
        )}

        {/* Vibe Check - Detailed or Full access */}
        {entity.vibe_check && (access_level === "detailed" || access_level === "full") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <GlassCard className="p-6">
              <p className="text-lg italic text-center">
                "{entity.vibe_check}"
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Evidence - Detailed or Full access */}
        {entity.evidence && entity.evidence.length > 0 && (access_level === "detailed" || access_level === "full") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <EvidenceSection evidence={entity.evidence} />
          </motion.div>
        )}

        {/* Full Access Details */}
        {access_level === "full" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4">Additional Details</h3>
              <div className="space-y-3 text-sm">
                {entity.about && (
                  <div>
                    <span className="text-muted-foreground">About:</span>
                    <p className="mt-1">{entity.about}</p>
                  </div>
                )}
                {entity.website_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Website:</span>
                    <a href={entity.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {entity.website_url}
                    </a>
                  </div>
                )}
                {entity.contact_email && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Contact:</span>
                    <a href={`mailto:${entity.contact_email}`} className="text-primary hover:underline">
                      {entity.contact_email}
                    </a>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Limited Access Note */}
        {access_level === "basic" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6 text-center">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                This is a limited view. Contact the profile owner for full access.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PrivateViewPage;
