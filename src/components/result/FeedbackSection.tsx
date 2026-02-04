import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Plus, Clock, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  content: string;
  is_positive: boolean;
  created_at: string;
  user_id: string;
}

interface FeedbackSectionProps {
  entityId: string;
  onAuthRequired: () => void;
}

const FEEDBACK_COOLDOWN_HOURS = 24;
const POSITIVE_FEEDBACK_POINTS = 8;
const NEGATIVE_FEEDBACK_POINTS = 5;

export const FeedbackSection = ({ entityId, onAuthRequired }: FeedbackSectionProps) => {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [isPositive, setIsPositive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canFeedback, setCanFeedback] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
    checkFeedbackCooldown();
  }, [entityId]);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    // Only get reviews WITH content (feedback), not boosts
    const { data } = await supabase
      .from("entity_reviews")
      .select("*")
      .eq("entity_id", entityId)
      .not("content", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setFeedbacks(data as Feedback[]);
    }
    setIsLoading(false);
  };

  const checkFeedbackCooldown = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCanFeedback(true);
      return;
    }

    const { data: lastFeedback } = await supabase
      .from("entity_reviews")
      .select("created_at")
      .eq("entity_id", entityId)
      .eq("user_id", user.id)
      .not("content", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastFeedback) {
      const lastTime = new Date(lastFeedback.created_at);
      const cooldownEnd = new Date(lastTime.getTime() + FEEDBACK_COOLDOWN_HOURS * 60 * 60 * 1000);
      const now = new Date();

      if (now < cooldownEnd) {
        setCanFeedback(false);
        const remaining = formatDistanceToNow(cooldownEnd, { addSuffix: false });
        setCooldownRemaining(remaining);
      } else {
        setCanFeedback(true);
        setCooldownRemaining(null);
      }
    } else {
      setCanFeedback(true);
    }
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!newFeedback.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("entity_reviews")
      .insert({
        entity_id: entityId,
        user_id: user.id,
        content: newFeedback.trim(),
        is_positive: isPositive,
        points_staked: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setFeedbacks(prev => [data as Feedback, ...prev]);
      setNewFeedback("");
      setShowForm(false);
      setCanFeedback(false);
      setCooldownRemaining(FEEDBACK_COOLDOWN_HOURS + " hours");

      const pointsAwarded = isPositive ? POSITIVE_FEEDBACK_POINTS : NEGATIVE_FEEDBACK_POINTS;
      
      toast({
        title: isPositive ? "Positive Feedback Submitted! 🎉" : "Feedback Recorded",
        description: "Your feedback helps build trust in the community.",
      });

      // Award higher points for feedback (more impact than boost)
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: pointsAwarded,
        _action_type: "feedback",
        _reference_id: entityId,
      });

      // Update entity score's last_review_at
      await supabase
        .from("entity_scores")
        .update({ last_review_at: new Date().toISOString() })
        .eq("entity_id", entityId);
    }
    setIsSubmitting(false);
  };

  const positiveCount = feedbacks.filter(f => f.is_positive).length;
  const negativeCount = feedbacks.filter(f => !f.is_positive).length;
  const positivePercentage = feedbacks.length > 0 ? Math.round((positiveCount / feedbacks.length) * 100) : 50;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Feedback ({feedbacks.length})
        </h3>
        {canFeedback ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Plus className="w-4 h-4" />
            Leave Feedback
          </button>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Can review in {cooldownRemaining}</span>
          </div>
        )}
      </div>

      {/* Sentiment Bar */}
      {feedbacks.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-score-green flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> {positivePercentage}% Positive
            </span>
            <span className="text-score-red flex items-center gap-1">
              {100 - positivePercentage}% Negative <ThumbsDown className="w-3 h-3" />
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-score-green to-score-green/70 transition-all duration-500"
              style={{ width: `${positivePercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Feedback Form */}
      {showForm && canFeedback && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GlassCard className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Your feedback has a higher impact on the score than a simple boost.
            </p>

            {/* Sentiment Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Type:</span>
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
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              placeholder="Share your experience with this profile... (You can submit feedback again after 24 hours)"
              className="w-full p-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 resize-none min-h-[100px]"
              rows={4}
            />

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!newFeedback.trim() || isSubmitting}
                className="btn-neon px-4 py-2 text-sm disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
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

      {/* Feedback List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading feedback...</div>
      ) : feedbacks.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-muted-foreground">No feedback yet. Be the first to share your experience!</p>
        </GlassCard>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {feedbacks.map((feedback, index) => (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    feedback.is_positive ? "bg-score-green/20" : "bg-score-red/20"
                  }`}>
                    {feedback.is_positive ? (
                      <ThumbsUp className="w-4 h-4 text-score-green" />
                    ) : (
                      <ThumbsDown className="w-4 h-4 text-score-red" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{feedback.content}</p>
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
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
