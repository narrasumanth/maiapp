import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  content: string | null;
  is_positive: boolean;
  created_at: string;
  user_id: string;
}

interface ReviewsSectionProps {
  entityId: string;
  onAuthRequired: () => void;
}

export const ReviewsSection = ({ entityId, onAuthRequired }: ReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState("");
  const [isPositive, setIsPositive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [entityId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("entity_reviews")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setReviews(data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!newReview.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("entity_reviews")
      .insert({
        entity_id: entityId,
        user_id: user.id,
        content: newReview.trim(),
        is_positive: isPositive,
      })
      .select()
      .single();

    if (!error && data) {
      setReviews(prev => [data, ...prev]);
      setNewReview("");
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Reviews ({reviews.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="w-4 h-4" />
          Add Review
        </button>
      </div>

      {/* Add Review Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GlassCard className="p-4 space-y-3">
            {/* Sentiment Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Sentiment:</span>
              <button
                onClick={() => setIsPositive(true)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isPositive ? "bg-score-green/20 text-score-green" : "bg-secondary/30 text-muted-foreground"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Positive
              </button>
              <button
                onClick={() => setIsPositive(false)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  !isPositive ? "bg-score-red/20 text-score-red" : "bg-secondary/30 text-muted-foreground"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Negative
              </button>
            </div>

            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Write your review..."
              className="w-full p-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 resize-none"
              rows={3}
            />

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!newReview.trim() || isSubmitting}
                className="btn-neon px-4 py-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Post Review"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="btn-glass px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-muted-foreground">No reviews yet. Be the first!</p>
        </GlassCard>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    review.is_positive ? "bg-score-green/20" : "bg-score-red/20"
                  }`}>
                    {review.is_positive ? (
                      <ThumbsUp className="w-4 h-4 text-score-green" />
                    ) : (
                      <ThumbsDown className="w-4 h-4 text-score-red" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{review.content}</p>
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
