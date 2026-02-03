import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, ExternalLink, Share2, Bookmark, AlertTriangle, User, Package, Building, MessageSquare, Bot, ThumbsUp } from "lucide-react";
import { ScoreGauge } from "@/components/ScoreGauge";
import { EvidenceCard } from "@/components/EvidenceCard";
import { GlassCard } from "@/components/GlassCard";
import { ReputationResult } from "@/lib/api/reputation";
import { ReactionBar } from "@/components/result/ReactionBar";
import { ReviewsTab } from "@/components/result/ReviewsTab";
import { CommentsTab } from "@/components/result/CommentsTab";
import { AskMAITab } from "@/components/result/AskMAITab";
import { ShareModal } from "@/components/result/ShareModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { supabase } from "@/integrations/supabase/client";

const categoryIcons = {
  Person: User,
  Place: MapPin,
  Product: Package,
  Business: Building,
};

type TabType = "reviews" | "askmai" | "comments";

const ResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [result, setResult] = useState<ReputationResult | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("reviews");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [maiCount, setMaiCount] = useState(0);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("mai-result");
    const storedEntityId = sessionStorage.getItem("mai-entity-id");
    
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setResult(parsed);
        if (storedEntityId) {
          setEntityId(storedEntityId);
          fetchCounts(storedEntityId);
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

  const fetchCounts = async (id: string) => {
    const [reviews, comments, mai] = await Promise.all([
      supabase.from("entity_reviews").select("id", { count: "exact" }).eq("entity_id", id),
      supabase.from("entity_comments").select("id", { count: "exact" }).eq("entity_id", id),
      supabase.from("mai_conversations").select("id", { count: "exact" }).eq("entity_id", id),
    ]);
    setReviewCount(reviews.count || 0);
    setCommentCount(comments.count || 0);
    setMaiCount(mai.count || 0);
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
  const CategoryIcon = categoryIcons[result.category as keyof typeof categoryIcons] || MapPin;

  const tabs = [
    { id: "reviews" as TabType, label: "Reviews", count: reviewCount, icon: ThumbsUp },
    { id: "askmai" as TabType, label: "Ask MAI", count: maiCount, icon: Bot },
    { id: "comments" as TabType, label: "Comments", count: commentCount, icon: MessageSquare },
  ];

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

        {/* Main Result Card - Horizontal Layout like reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard variant="glow" className="p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Score Gauge */}
              <div className="shrink-0">
                <ScoreGauge score={result.score} size="md" />
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left">
                {/* Name and Badge */}
                <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                    <h1 className="text-2xl md:text-3xl font-bold">{result.name}</h1>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-muted-foreground leading-relaxed mb-4 max-w-2xl">
                  {result.summary}
                </p>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span>{result.evidence.length} data points analyzed</span>
                  <span>•</span>
                  <span>{reviewCount} reviews</span>
                  <span>•</span>
                  <span>{result.category}</span>
                </div>

                {/* Reactions */}
                {entityId && (
                  <ReactionBar 
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
          </GlassCard>
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
            Share Result
          </button>
          <button className="flex-1 btn-glass flex items-center justify-center gap-2">
            <Bookmark className="w-4 h-4" />
            Save
          </button>
        </motion.div>

        {/* Evidence Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Key Evidence</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {result.evidence.map((evidence, index) => (
              <EvidenceCard key={index} evidence={evidence} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Tabs Section */}
        {entityId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Tab Headers */}
            <div className="flex gap-1 p-1 glass-card rounded-xl mb-6 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? "bg-primary/20 text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary/50">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === "reviews" && (
                <ReviewsTab 
                  entityId={entityId} 
                  onAuthRequired={() => setShowAuthModal(true)}
                  onReviewChange={() => fetchCounts(entityId)}
                />
              )}
              {activeTab === "comments" && (
                <CommentsTab 
                  entityId={entityId} 
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              )}
              {activeTab === "askmai" && (
                <AskMAITab 
                  entityId={entityId}
                  entityName={result.name}
                  entityCategory={result.category}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* New Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Link to="/" className="block">
            <button className="w-full btn-glass flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
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
    </div>
  );
};

export default ResultPage;
