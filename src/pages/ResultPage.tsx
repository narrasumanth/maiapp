import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, ExternalLink, Share2, Bookmark, AlertTriangle } from "lucide-react";
import { ScoreGauge } from "@/components/ScoreGauge";
import { EvidenceCard } from "@/components/EvidenceCard";
import { GlassCard } from "@/components/GlassCard";

// Mock result data - in real app this would come from AI
const mockResults: Record<string, {
  name: string;
  category: string;
  score: number;
  summary: string;
  vibeCheck: string;
  evidence: Array<{
    icon: "star" | "message" | "news" | "trending" | "shield" | "award";
    title: string;
    value: string;
    positive: boolean;
  }>;
}> = {
  default: {
    name: "Sushi Nakazawa",
    category: "Place",
    score: 94,
    summary: "Highly acclaimed sushi restaurant with exceptional omakase experience. One of NYC's finest Japanese dining establishments.",
    vibeCheck: "Incredible sushi, but you'll need a reservation weeks in advance. Worth the wait. 10/10 vibes.",
    evidence: [
      { icon: "star", title: "Google Rating", value: "4.8 ★ (2.4k reviews)", positive: true },
      { icon: "news", title: "Press Mention", value: "Featured in NYT Food", positive: true },
      { icon: "award", title: "Recognition", value: "Michelin Star ★", positive: true },
    ],
  },
  "Tesla Cybertruck": {
    name: "Tesla Cybertruck",
    category: "Product",
    score: 78,
    summary: "Innovative electric pickup with polarizing design. Strong performance but mixed reviews on build quality and delivery times.",
    vibeCheck: "Cool if you want attention, but panel gaps are real. Great tech, questionable QC. 7.5/10 vibes.",
    evidence: [
      { icon: "trending", title: "Social Sentiment", value: "72% Positive", positive: true },
      { icon: "message", title: "Reddit Consensus", value: "Mixed Reviews", positive: false },
      { icon: "shield", title: "Safety Rating", value: "5-Star NHTSA", positive: true },
    ],
  },
  "Temu": {
    name: "Temu",
    category: "Product",
    score: 45,
    summary: "Ultra-cheap e-commerce platform with significant quality and shipping concerns. Products often differ from listings.",
    vibeCheck: "You get what you pay for. Sometimes less. Shipping takes forever. 4/10 vibes.",
    evidence: [
      { icon: "star", title: "App Store Rating", value: "3.2 ★", positive: false },
      { icon: "message", title: "BBB Rating", value: "F Rating", positive: false },
      { icon: "trending", title: "Return Rate", value: "38% Returns", positive: false },
    ],
  },
};

const ResultPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "Sushi Nakazawa";
  const [result, setResult] = useState(mockResults.default);

  useEffect(() => {
    // Find matching mock result or use default
    const matchedResult = Object.entries(mockResults).find(([key]) => 
      query.toLowerCase().includes(key.toLowerCase())
    );
    setResult(matchedResult ? matchedResult[1] : { ...mockResults.default, name: query });
  }, [query]);

  const isRisky = result.score < 50;

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
                <MapPin className="w-3 h-3 text-muted-foreground" />
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

            {/* View Sources */}
            <button className="w-full btn-glass flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
              View All Sources
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
