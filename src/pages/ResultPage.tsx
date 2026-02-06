import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, MessageCircle, QrCode, Mail, ExternalLink, Award, User, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { PulseMeter } from "@/components/result/PulseMeter";
import { ReputationResult } from "@/lib/api/reputation";
import { SentimentVoting } from "@/components/result/SentimentVoting";
import { GoogleTrendsWidget } from "@/components/result/GoogleTrendsWidget";
import { ProfileTabs } from "@/components/result/ProfileTabs";
import { ProfileShareModal } from "@/components/result/ProfileShareModal";
import { QRShareModal } from "@/components/result/QRShareModal";
import { MessageModal } from "@/components/result/MessageModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { VerificationBadge } from "@/components/result/VerificationBadge";
import { EvidenceGrid } from "@/components/result/EvidenceGrid";
import { ClaimProfileModal } from "@/components/result/ClaimProfileModal";
import { PrivateShareModal } from "@/components/result/PrivateShareModal";
import { ProfileCustomizer } from "@/components/result/ProfileCustomizer";
import { SignupPrompt } from "@/components/result/SignupPrompt";
import { FunFactsSection } from "@/components/result/FunFactsSection";
import { ProfileCaricature } from "@/components/result/ProfileCaricature";
import { FooterDisclaimer } from "@/components/legal/LegalDisclaimer";
import { getCategoryConfig } from "@/components/result/CategoryLayout";
import { supabase } from "@/integrations/supabase/client";

const ResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [result, setResult] = useState<ReputationResult | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string>("");
  const [caricatureUrl, setCaricatureUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
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
        
        // Generate share code: use entityId if available for exact matching
        // Format: name-slug_entityIdPrefix (e.g., "donald-trump_abc123")
        const nameSlug = parsed.name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 40);
        
        if (storedEntityId) {
          setEntityId(storedEntityId);
          // Include entity ID prefix for exact matching
          const idPrefix = storedEntityId.replace(/-/g, '').substring(0, 8);
          setShareCode(`${nameSlug}_${idPrefix}`);
          fetchEntityDetails(storedEntityId);
          trackVisit(storedEntityId);
        } else {
          setShareCode(nameSlug);
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
      .maybeSingle();

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const config = getCategoryConfig(result.category);
  const CategoryIcon = config.icon;

  const getScoreTier = () => {
    if (result.score >= 90) return { label: "Diamond", sublabel: "Exceptional Trust", color: "text-score-diamond", bg: "bg-score-diamond/10", border: "border-score-diamond/30" };
    if (result.score >= 75) return { label: "Trusted", sublabel: "High Confidence", color: "text-score-green", bg: "bg-score-green/10", border: "border-score-green/30" };
    if (result.score >= 50) return { label: "Mixed", sublabel: "Proceed with Caution", color: "text-score-yellow", bg: "bg-score-yellow/10", border: "border-score-yellow/30" };
    return { label: "Risky", sublabel: "Exercise Caution", color: "text-score-red", bg: "bg-score-red/10", border: "border-score-red/30" };
  };

  const tier = getScoreTier();

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Search</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              title="QR Code"
            >
              <QrCode className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section - Clean 2-Column Layout */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-[1fr_320px] gap-8 mb-10"
        >
          {/* Left Column - Profile Info */}
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-6">
              {/* Score Display */}
              <div className="shrink-0">
                <PulseMeter score={result.score} size="lg" />
              </div>

              {/* Name & Category */}
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bgGradient}`}>
                    <CategoryIcon className={`w-3.5 h-3.5 ${config.color}`} />
                    <span className={`text-xs font-medium ${config.color}`}>{result.category}</span>
                  </div>
                  <VerificationBadge isVerified={isVerified} isClaimed={isClaimed} />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 truncate">
                  {result.name}
                </h1>

                {/* Trust Tier Badge */}
                <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl ${tier.bg} ${tier.border} border`}>
                  <span className={`text-xl font-bold ${tier.color}`}>{tier.label}</span>
                  <span className="text-sm text-muted-foreground">{tier.sublabel}</span>
                </div>

                {/* Claim Profile CTA - Inline for unclaimed profiles */}
                {!isClaimed && entityId && (
                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors text-sm font-medium text-primary"
                  >
                    <User className="w-4 h-4" />
                    Is this you? Claim your profile
                  </button>
                )}
              </div>
            </div>

            {/* Vibe Check Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-xl bg-secondary/30 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">AI Vibe Check</span>
              </div>
              <p className="text-lg text-foreground/90 italic leading-relaxed">
                "{result.vibeCheck}"
              </p>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {isClaimed && entityId && (
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Message
                </button>
              )}

              {entityDetails.contact_email && (
                <a
                  href={`mailto:${entityDetails.contact_email}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors text-sm font-medium"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              )}

              {entityDetails.website_url && (
                <a
                  href={entityDetails.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Website
                </a>
              )}
            </div>

            {/* Fun Insights - Inline */}
            {(result.funFact || result.hardFact) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <FunFactsSection funFact={result.funFact} hardFact={result.hardFact} />
              </motion.div>
            )}
          </div>

          {/* Right Column - Caricature & Quick Stats */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden bg-secondary/20 border border-border/50"
            >
              <ProfileCaricature
                entityName={result.name}
                category={result.category}
                score={result.score}
                vibeCheck={result.vibeCheck}
                funFact={result.funFact}
                onImageGenerated={setCaricatureUrl}
              />
            </motion.div>

            {/* Sentiment Voting */}
            {entityId && (
              <SentimentVoting 
                entityId={entityId} 
                onAuthRequired={() => setShowAuthModal(true)}
              />
            )}
          </div>
        </motion.section>

        {/* Evidence Grid - Full Width */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-5">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Key Evidence</h2>
          </div>
          <EvidenceGrid evidence={result.evidence} onAuthRequired={() => setShowAuthModal(true)} />
        </motion.section>

        {/* Google Trends Widget */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Search Interest</h2>
          </div>
          <GoogleTrendsWidget 
            entityName={result.name} 
            onAuthRequired={() => setShowAuthModal(true)}
          />
        </motion.section>

        {/* Owner Profile Customizer */}
        {isOwner && entityId && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <ProfileCustomizer 
              entityId={entityId}
              entityName={result.name}
              category={result.category}
            />
          </motion.section>
        )}

        {/* Owner Management Actions */}
        {isOwner && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-10 p-6 rounded-xl bg-primary/5 border border-primary/20"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Management
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Award className="w-4 h-4" />
                Share Pulse Score
              </button>
              <button
                onClick={() => setShowPrivateShareModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
              >
                Private Share Link
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.section>
        )}

        {/* Signup Prompt for non-authenticated users */}
        <SignupPrompt onAuthRequired={() => {
          setAuthMode("signup");
          setShowAuthModal(true);
        }} />

        {/* Tabbed Content Area */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ProfileTabs 
            entityId={entityId || ""}
            entityName={result.name}
            category={result.category}
            about={entityDetails.about}
            contactEmail={entityDetails.contact_email}
            websiteUrl={entityDetails.website_url}
            isOwner={isOwner}
            onAuthRequired={() => setShowAuthModal(true)}
          />
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <FooterDisclaimer />
        </div>
      </footer>

      {/* Modals */}
      <ProfileShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        entityName={result.name}
        score={result.score}
        category={result.category}
        vibeCheck={result.vibeCheck}
        shareCode={shareCode}
        funFact={result.funFact}
        caricatureUrl={caricatureUrl}
      />

      <QRShareModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        entityName={result.name}
        shareCode={shareCode}
        score={result.score}
      />

      {entityId && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          entityId={entityId}
          entityName={result.name}
          onAuthRequired={() => setShowAuthModal(true)}
        />
      )}

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

      {entityId && (
        <PrivateShareModal
          isOpen={showPrivateShareModal}
          onClose={() => setShowPrivateShareModal(false)}
          entityId={entityId}
          entityName={result.name}
        />
      )}
    </div>
  );
};

export default ResultPage;
