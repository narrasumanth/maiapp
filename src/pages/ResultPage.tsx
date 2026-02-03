import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Bookmark, AlertTriangle, Bot } from "lucide-react";
import { ScoreGauge } from "@/components/ScoreGauge";
import { GlassCard } from "@/components/GlassCard";
import { ReputationResult } from "@/lib/api/reputation";
import { YayNayVoting } from "@/components/result/YayNayVoting";
import { AskMAITab } from "@/components/result/AskMAITab";
import { ShareModal } from "@/components/result/ShareModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { VerificationBadge } from "@/components/result/VerificationBadge";
import { AboutSection } from "@/components/result/AboutSection";
import { EvidenceSection } from "@/components/result/EvidenceSection";
import { FollowButton } from "@/components/result/FollowButton";
import { ClaimProfileModal } from "@/components/result/ClaimProfileModal";
import { getCategoryConfig } from "@/components/result/CategoryLayout";
import { supabase } from "@/integrations/supabase/client";

const ResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [result, setResult] = useState<ReputationResult | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [entityDetails, setEntityDetails] = useState<{
    about?: string;
    contact_email?: string;
    website_url?: string;
  }>({});
  const [showAskMAI, setShowAskMAI] = useState(false);

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
        }
      } catch (e) {
        console.error("Failed to parse stored result");
        navigate("/");
      }
    } else if (!query) {
      navigate("/");
    } else {
      navigate("/");
    }
  }, [query, navigate]);

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

      // Check if current user is owner
      const { data: { user } } = await supabase.auth.getUser();
      if (user && entity.claimed_by === user.id) {
        setIsOwner(true);
      }
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  const isRisky = result.score < 50;
  const config = getCategoryConfig(result.category);
  const CategoryIcon = config.icon;

  const getScoreBadge = () => {
    if (result.score >= 90) return { label: "Exceptional", color: "bg-score-diamond/20 text-score-diamond border-score-diamond/30" };
    if (result.score >= 75) return { label: "Positive", color: "bg-score-green/20 text-score-green border-score-green/30" };
    if (result.score >= 50) return { label: "Mixed", color: "bg-score-yellow/20 text-score-yellow border-score-yellow/30" };
    return { label: "Risky", color: "bg-score-red/20 text-score-red border-score-red/30" };
  };

  const badge = getScoreBadge();

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="fixed inset-0 grid-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </Link>
        </motion.div>

        {/* Verification Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            <VerificationBadge isVerified={isVerified} isClaimed={isClaimed} />
            {!isClaimed && entityId && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="text-sm text-primary hover:underline"
              >
                Claim this profile
              </button>
            )}
          </div>
        </motion.div>

        {/* Main Result Card - Category Styled */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.bgGradient} p-6 md:p-8 mb-6`}>
            {/* Background Icon */}
            <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
              <CategoryIcon className="w-full h-full" />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Score Gauge */}
                <div className="shrink-0">
                  <ScoreGauge score={result.score} size="md" />
                </div>

                {/* Info Section */}
                <div className="flex-1 text-center md:text-left">
                  {/* Category Tag */}
                  <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                    <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>{result.category}</span>
                  </div>

                  {/* Name and Badge */}
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold">{result.name}</h1>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-muted-foreground leading-relaxed mb-4 max-w-2xl">
                    {result.summary}
                  </p>

                  {/* Follow Button */}
                  {entityId && (
                    <FollowButton 
                      entityId={entityId} 
                      onAuthRequired={() => setShowAuthModal(true)} 
                    />
                  )}
                </div>
              </div>

              {/* Vibe Check */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-lg text-foreground italic">
                  "{result.vibeCheck}"
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Risk Warning */}
        {isRisky && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-score-red/10 border border-score-red/20">
              <AlertTriangle className="w-5 h-5 text-score-red shrink-0" />
              <span className="text-sm text-score-red font-medium">
                Proceed with caution - This entity has significant reputation concerns
              </span>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 mb-8"
        >
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex-1 btn-neon flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Score
          </button>
          <button 
            onClick={() => setShowAskMAI(!showAskMAI)}
            className={`flex-1 flex items-center justify-center gap-2 ${showAskMAI ? 'btn-neon' : 'btn-glass'}`}
          >
            <Bot className="w-4 h-4" />
            Ask MAI
          </button>
        </motion.div>

        {/* Ask MAI Expanded */}
        {showAskMAI && entityId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <AskMAITab 
              entityId={entityId}
              entityName={result.name}
              entityCategory={result.category}
            />
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Yay/Nay Voting */}
            {entityId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <YayNayVoting 
                  entityId={entityId} 
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              </motion.div>
            )}

            {/* Evidence Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <EvidenceSection evidence={result.evidence} />
            </motion.div>
          </div>

          {/* Right Column - About & Links */}
          <div className="space-y-6">
            {entityId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
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
          </div>
        </div>

        {/* New Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Link to="/" className="block">
            <button className="w-full btn-glass flex items-center justify-center gap-2">
              Search Another Entity
            </button>
          </Link>
        </motion.div>
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {entityId && (
        <ClaimProfileModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          entityId={entityId}
          entityName={result.name}
          category={result.category}
        />
      )}
    </div>
  );
};

export default ResultPage;
