import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, ExternalLink, Share2, Bookmark, AlertTriangle, User, Package } from "lucide-react";
import { ScoreGauge } from "@/components/ScoreGauge";
import { EvidenceCard } from "@/components/EvidenceCard";
import { GlassCard } from "@/components/GlassCard";
import { ReputationResult } from "@/lib/api/reputation";

const categoryIcons = {
  Person: User,
  Place: MapPin,
  Product: Package,
};

const ResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [result, setResult] = useState<ReputationResult | null>(null);

  useEffect(() => {
    // Try to get result from session storage
    const storedResult = sessionStorage.getItem("mai-result");
    
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setResult(parsed);
      } catch (e) {
        console.error("Failed to parse stored result");
        navigate("/");
      }
    } else if (!query) {
      navigate("/");
    } else {
      // If no stored result but we have a query, go back to search
      navigate("/");
    }
  }, [query, navigate]);

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

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Grid Background */}
      <div className="fixed inset-0 grid-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </Link>
        </motion.div>

        {/* Main Result Card */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Score Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <GlassCard variant="glow" className="p-8 text-center">
              {/* Category Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-white/10 mb-6">
                <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {result.category}
                </span>
              </div>

              {/* Entity Name */}
              <h1 className="text-2xl font-bold mb-8">{result.name}</h1>

              {/* Score Gauge */}
              <div className="flex justify-center mb-8">
                <ScoreGauge score={result.score} size="lg" />
              </div>

              {/* Risk Warning if applicable */}
              {isRisky && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-score-red/10 border border-score-red/20"
                >
                  <AlertTriangle className="w-5 h-5 text-score-red" />
                  <span className="text-sm text-score-red font-medium">
                    Proceed with caution
                  </span>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button className="flex-1 btn-glass flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="flex-1 btn-glass flex items-center justify-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Save
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Vibe Check Card */}
            <GlassCard variant="glow" className="p-6">
              <h2 className="text-lg font-semibold mb-3 neon-text-cyan">Vibe Check ™</h2>
              <p className="text-xl text-foreground leading-relaxed">
                "{result.vibeCheck}"
              </p>
            </GlassCard>

            {/* Summary */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold mb-3">Summary</h2>
              <p className="text-muted-foreground leading-relaxed">
                {result.summary}
              </p>
            </GlassCard>

            {/* Evidence Cards */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Key Evidence</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {result.evidence.map((evidence, index) => (
                  <EvidenceCard key={index} evidence={evidence} index={index} />
                ))}
              </div>
            </div>

            {/* New Search Button */}
            <Link to="/" className="block">
              <button className="w-full btn-neon flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Search Another Entity
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
