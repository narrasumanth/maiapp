import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, MessageCircle, QrCode, Mail, Shield, ExternalLink, Plus } from "lucide-react";
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
import { PrivateShareModal } from "@/components/result/PrivateShareModal";
import { AboutSection } from "@/components/result/AboutSection";
import { CommentsSection } from "@/components/result/CommentsSection";
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

      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        {/* Header */}
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

        {/* Profile Card - Clean & Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-glow p-8 mb-6 text-center"
        >
          {/* Category & Verification */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <CategoryIcon className={`w-4 h-4 ${config.color}`} />
            <span className="text-sm text-muted-foreground">{result.category}</span>
            <VerificationBadge isVerified={isVerified} isClaimed={isClaimed} />
          </div>

          {/* Name */}
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{result.name}</h1>
          
          {/* Score Label */}
          <p className={`text-lg font-semibold ${scoreInfo.color} mb-6`}>
            {scoreInfo.label}
          </p>

          {/* Score Gauge */}
          <div className="flex justify-center mb-6">
            <ScoreGauge score={result.score} size="lg" />
          </div>

          {/* Vibe Check */}
          <p className="text-lg italic text-muted-foreground mb-6 max-w-lg mx-auto">
            "{result.vibeCheck}"
          </p>

          {/* Quick Actions - Small & Subtle */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {entityId && (
              <FollowButton 
                entityId={entityId} 
                onAuthRequired={() => setShowAuthModal(true)} 
              />
            )}

            {isClaimed && entityId && (
              <button
                onClick={() => setShowMessageModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Message
              </button>
            )}

            {entityDetails.contact_email && (
              <a
                href={`mailto:${entityDetails.contact_email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Website
              </a>
            )}
          </div>
        </motion.div>

        {/* Boost Score Section - Prominent */}
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

        {/* About Section - For Owners to Add Content */}
        {entityId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <AboutSection
              entityId={entityId}
              entityName={result.name}
              category={result.category}
              about={entityDetails.about}
              contactEmail={entityDetails.contact_email}
              websiteUrl={entityDetails.website_url}
              isOwner={isOwner}
              onAuthRequired={() => setShowAuthModal(true)}
            />
          </motion.div>
        )}

        {/* Comments Section */}
        {entityId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6"
          >
            <CommentsSection
              entityId={entityId}
              onAuthRequired={() => setShowAuthModal(true)}
            />
          </motion.div>
        )}

        {/* Ask MAI */}
        {entityId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5 mb-6"
          >
            <AskMAITab 
              entityId={entityId}
              entityName={result.name}
              entityCategory={result.category}
            />
          </motion.div>
        )}

        {/* Footer Actions - Simplified */}
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
            <>
              <button
                onClick={() => setShowPrivateShareModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Private Links
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-score-green/20 text-score-green hover:bg-score-green/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Details to Boost Score
              </button>
            </>
          )}
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
        shareCode={entityId?.substring(0, 12).toUpperCase() || ""}
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
