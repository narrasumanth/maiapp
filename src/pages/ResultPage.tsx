import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, AlertTriangle, Bot, MapPin, Mail } from "lucide-react";
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
import { CommentsSection } from "@/components/result/CommentsSection";
import { ScoreMethodology } from "@/components/result/ScoreMethodology";
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
        {/* Header Row */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          {/* Share Icon - Top Right */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-3 rounded-xl glass-card hover:bg-primary/10 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
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

        {/* Main Result Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.bgGradient} p-6 md:p-8 mb-6`}>
            <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
              <CategoryIcon className="w-full h-full" />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="shrink-0">
                  <ScoreGauge score={result.score} size="md" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                    <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>{result.category}</span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold">{result.name}</h1>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mb-4 max-w-2xl">
                    {result.summary}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {entityId && (
                      <FollowButton 
                        entityId={entityId} 
                        onAuthRequired={() => setShowAuthModal(true)} 
                      />
                    )}
                    
                    {/* Location Button */}
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/30 border border-white/10 hover:bg-secondary/50 transition-colors text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Add Location</span>
                    </button>

                    {/* Contact Button */}
                    {entityDetails.contact_email && (
                      <a
                        href={`mailto:${entityDetails.contact_email}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-colors text-sm text-primary"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Contact</span>
                      </a>
                    )}
                  </div>
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

        {/* Ask MAI Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <button 
            onClick={() => setShowAskMAI(!showAskMAI)}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all ${showAskMAI ? 'btn-neon' : 'btn-glass'}`}
          >
            <Bot className="w-5 h-5" />
            Ask MAI anything about {result.name}
          </button>
        </motion.div>

        {/* Ask MAI Expanded */}
        {showAskMAI && entityId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <AskMAITab 
              entityId={entityId}
              entityName={result.name}
              entityCategory={result.category}
            />
          </motion.div>
        )}

        {/* Three Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Voting & Comments */}
          <div className="lg:col-span-2 space-y-6">
            {entityId && (
              <>
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

                {/* Comments Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <CommentsSection 
                    entityId={entityId}
                    onAuthRequired={() => setShowAuthModal(true)}
                  />
                </motion.div>
              </>
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

          {/* Right Column - About, Methodology & Links */}
          <div className="space-y-6">
            {/* Score Methodology */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <ScoreMethodology score={result.score} />
            </motion.div>

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
