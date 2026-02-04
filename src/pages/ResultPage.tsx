import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, MessageCircle, QrCode, Mail, Shield, ExternalLink, Award, User } from "lucide-react";
import { PulseMeter } from "@/components/result/PulseMeter";
import { ReputationResult } from "@/lib/api/reputation";
import { BoostProfile } from "@/components/result/BoostProfile";
import { ProfileTabs } from "@/components/result/ProfileTabs";
import { ProfileShareModal } from "@/components/result/ProfileShareModal";
import { QRShareModal } from "@/components/result/QRShareModal";
import { MessageModal } from "@/components/result/MessageModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { VerificationBadge } from "@/components/result/VerificationBadge";
import { EvidenceGrid } from "@/components/result/EvidenceGrid";
import { FollowButton } from "@/components/result/FollowButton";
import { ClaimProfileModal } from "@/components/result/ClaimProfileModal";
import { PrivateShareModal } from "@/components/result/PrivateShareModal";
import { ProfileCustomizer } from "@/components/result/ProfileCustomizer";
import { FooterDisclaimer } from "@/components/legal/LegalDisclaimer";
import { getCategoryConfig } from "@/components/result/CategoryLayout";
import { ScoreBackground } from "@/components/home/ScoreBackground";
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

  const getPulseLabel = () => {
    if (result.score >= 90) return { label: "Diamond - Exceptional", color: "text-score-diamond", bg: "bg-score-diamond/10", emoji: "💎" };
    if (result.score >= 75) return { label: "Trustworthy", color: "text-score-green", bg: "bg-score-green/10", emoji: "✅" };
    if (result.score >= 50) return { label: "Mixed Signals", color: "text-score-yellow", bg: "bg-score-yellow/10", emoji: "⚠️" };
    return { label: "High Risk", color: "text-score-red", bg: "bg-score-red/10", emoji: "🚨" };
  };

  const pulseInfo = getPulseLabel();

  return (
    <div className="min-h-screen">
      <ScoreBackground score={result.score} />

      <div className="relative z-10 pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
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
                className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Hero Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-glow p-8 md:p-10 mb-8"
          >
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Pulse Meter - Left Side */}
              <div className="shrink-0">
                <PulseMeter score={result.score} size="lg" />
              </div>

              {/* Profile Info - Right Side */}
              <div className="flex-1 text-center lg:text-left">
                {/* Category & Verification */}
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${config.bgGradient}`}>
                    <CategoryIcon className={`w-3.5 h-3.5 ${config.color}`} />
                    <span className={`text-xs font-medium ${config.color}`}>{result.category}</span>
                  </div>
                  <VerificationBadge isVerified={isVerified} isClaimed={isClaimed} />
                </div>

                {/* Name */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">{result.name}</h1>
                
                {/* Pulse Rating Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${pulseInfo.bg} border border-white/10 mb-5`}>
                  <span className="text-lg">{pulseInfo.emoji}</span>
                  <span className={`font-semibold ${pulseInfo.color}`}>{pulseInfo.label}</span>
                </div>

                {/* Vibe Check */}
                <p className="text-lg italic text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  "{result.vibeCheck}"
                </p>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-6">
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
              </div>
            </div>

            {/* Owner Share Actions */}
            {isOwner && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 pt-6 border-t border-white/10"
              >
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    Share Pulse
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary/70 border border-white/10 transition-all"
                  >
                    <User className="w-4 h-4" />
                    Share Full Profile
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Evidence Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <EvidenceGrid evidence={result.evidence} />
          </motion.div>

          {/* Profile Customizer for Owners */}
          {isOwner && entityId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <ProfileCustomizer
                entityId={entityId}
                entityName={result.name}
                category={result.category}
              />
            </motion.div>
          )}

          {/* Boost Profile Section */}
          {entityId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <BoostProfile 
                entityId={entityId} 
                onAuthRequired={() => setShowAuthModal(true)}
              />
            </motion.div>
          )}

          {/* Tabbed Content: About, Comments, Feedback, Ask MAI */}
          {entityId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <ProfileTabs
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
                  <Shield className="w-4 h-4" />
                  Manage in Dashboard
                </button>
              </>
            )}
          </motion.div>

          {/* Legal Footer */}
          <FooterDisclaimer />
        </div>
      </div>

      {/* Modals */}
      <ProfileShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        entityName={result.name}
        score={result.score}
        category={result.category}
        vibeCheck={result.vibeCheck}
        shareCode={entityId?.substring(0, 12).toUpperCase() || ""}
        evidence={result.evidence}
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
