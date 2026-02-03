import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, AlertTriangle, MessageCircle, QrCode, Mail, Flag, Shield, ExternalLink } from "lucide-react";
import { ScoreGauge } from "@/components/ScoreGauge";
import { ReputationResult } from "@/lib/api/reputation";
import { YayNayVoting } from "@/components/result/YayNayVoting";
import { AskMAITab } from "@/components/result/AskMAITab";
import { ShareModal } from "@/components/result/ShareModal";
import { QRShareModal } from "@/components/result/QRShareModal";
import { MessageModal } from "@/components/result/MessageModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { VerificationBadge } from "@/components/result/VerificationBadge";
import { EvidenceSection } from "@/components/result/EvidenceSection";
import { FollowButton } from "@/components/result/FollowButton";
import { ClaimProfileModal } from "@/components/result/ClaimProfileModal";
import { ReviewsSection } from "@/components/result/ReviewsSection";
import { DisputeModal } from "@/components/result/DisputeModal";
import { PrivateShareModal } from "@/components/result/PrivateShareModal";
import { FooterDisclaimer } from "@/components/legal/LegalDisclaimer";
import { getCategoryConfig } from "@/components/result/CategoryLayout";
import { supabase } from "@/integrations/supabase/client";

const ResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [result, setResult] = useState<ReputationResult | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPrivateShareModal, setShowPrivateShareModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [entityDetails, setEntityDetails] = useState<{
    about?: string;
    contact_email?: string;
    website_url?: string;
  }>({});

  useEffect(() => {
    const storedResult = sessionStorage.getItem("mai-result");
    const storedEntityId = sessionStorage.getItem("mai-entity-id");
    
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setResult(parsed);
        if (storedEntityId) {
          setEntityId(storedEntityId);
          fetchEntityDetails(storedEntityId);
          trackVisit(storedEntityId);
        }
      } catch (e) {
        navigate("/");
      }
    } else if (!query) {
      navigate("/");
    } else {
      navigate("/");
    }
  }, [query, navigate]);

  const trackVisit = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("entity_visits").insert({
        entity_id: id,
        visitor_id: user?.id || null,
      });
    } catch (error) {
      console.log("Visit tracking failed:", error);
    }
  };

  const fetchEntityDetails = async (id: string) => {
    const { data: entity } = await supabase
      .from("entities")
      .select("is_verified, claimed_by, about, contact_email, website_url")
      .eq("id", id)
      .single();

    if (entity) {
      setIsVerified(entity.is_verified || false);
      setIsClaimed(!!entity.claimed_by);
      setEntityDetails({
        about: entity.about || undefined,
        contact_email: entity.contact_email || undefined,
        website_url: entity.website_url || undefined,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user && entity.claimed_by === user.id) {
        setIsOwner(true);
      }
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  const isRisky = result.score < 50;
  const config = getCategoryConfig(result.category);
  const CategoryIcon = config.icon;

  const getScoreLabel = () => {
    if (result.score >= 90) return { label: "Exceptional", color: "text-score-diamond" };
    if (result.score >= 75) return { label: "Trustworthy", color: "text-score-green" };
    if (result.score >= 50) return { label: "Mixed", color: "text-score-yellow" };
    return { label: "Risky", color: "text-score-red" };
  };

  const scoreInfo = getScoreLabel();

  return (
    <div className="min-h-screen pt-16 pb-8">
      <div className="fixed inset-0 grid-background opacity-20 pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* Simple Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Link 
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Main Score Card - Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-glow p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Score */}
            <div className="shrink-0">
              <ScoreGauge score={result.score} size="md" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                <span className="text-sm text-muted-foreground">{result.category}</span>
                <VerificationBadge isVerified={isVerified} isClaimed={isClaimed} />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-2">{result.name}</h1>
              
              <p className={`text-lg font-semibold ${scoreInfo.color} mb-3`}>
                {scoreInfo.label}
              </p>

              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {result.summary}
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                {entityId && (
                  <FollowButton 
                    entityId={entityId} 
                    onAuthRequired={() => setShowAuthModal(true)} 
                  />
                )}

                {isClaimed && entityId && (
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </button>
                )}

                {entityDetails.contact_email && (
                  <a
                    href={`mailto:${entityDetails.contact_email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </a>
                )}

                {entityDetails.website_url && (
                  <a
                    href={entityDetails.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Vibe Check */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-lg italic text-center md:text-left">
              "{result.vibeCheck}"
            </p>
          </div>
        </motion.div>

        {/* Risk Warning */}
        {isRisky && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-score-red/10 border border-score-red/20 mb-6"
          >
            <AlertTriangle className="w-5 h-5 text-score-red shrink-0" />
            <span className="text-sm text-score-red font-medium">
              Proceed with caution - This entity has significant reputation concerns
            </span>
          </motion.div>
        )}

        {/* Voting */}
        {entityId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <YayNayVoting 
              entityId={entityId} 
              onAuthRequired={() => setShowAuthModal(true)}
            />
          </motion.div>
        )}

        {/* Evidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <EvidenceSection evidence={result.evidence} />
        </motion.div>

        {/* Two Column: Ask MAI & Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6 mb-6"
        >
          {entityId && (
            <div className="glass-card p-5">
              <AskMAITab 
                entityId={entityId}
                entityName={result.name}
                entityCategory={result.category}
              />
            </div>
          )}

          {entityId && (
            <div className="glass-card p-5">
              <ReviewsSection 
                entityId={entityId}
                onAuthRequired={() => setShowAuthModal(true)}
              />
            </div>
          )}
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-3 py-6 border-t border-white/10"
        >
          {!isClaimed && entityId && (
            <button
              onClick={() => setShowClaimModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Claim this profile
            </button>
          )}

          {isOwner && entityId && (
            <button
              onClick={() => setShowPrivateShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Private Links
            </button>
          )}

          <button
            onClick={() => setShowDisputeModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-score-yellow/10 text-score-yellow hover:bg-score-yellow/20 transition-colors"
          >
            <Flag className="w-4 h-4" />
            Dispute
          </button>
        </motion.div>

        {/* Legal Footer */}
        <FooterDisclaimer />
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        entityName={result.name}
        score={result.score}
        category={result.category}
        vibeCheck={result.vibeCheck}
      />

      <QRShareModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        entityName={result.name}
        score={result.score}
        shareCode={entityId?.substring(0, 8).toUpperCase() || ""}
      />

      {entityId && (
        <>
          <MessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            entityId={entityId}
            entityName={result.name}
            onAuthRequired={() => setShowAuthModal(true)}
          />

          <ClaimProfileModal
            isOpen={showClaimModal}
            onClose={() => setShowClaimModal(false)}
            entityId={entityId}
            entityName={result.name}
            category={result.category}
          />

          <DisputeModal
            isOpen={showDisputeModal}
            onClose={() => setShowDisputeModal(false)}
            entityId={entityId}
            entityName={result.name}
            onAuthRequired={() => setShowAuthModal(true)}
          />

          <PrivateShareModal
            isOpen={showPrivateShareModal}
            onClose={() => setShowPrivateShareModal(false)}
            entityId={entityId}
            entityName={result.name}
          />
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default ResultPage;
