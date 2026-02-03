import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  is_positive: boolean;
  content: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    verification_score: number;
  };
}

interface ReviewsTabProps {
  entityId: string;
  onAuthRequired: () => void;
  onReviewChange: () => void;
}

export const ReviewsTab = ({ entityId, onAuthRequired, onReviewChange }: ReviewsTabProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [entityId]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { data } = await supabase
      .from("entity_reviews")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, verification_score")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const reviewsWithProfiles = data.map(r => ({
        ...r,
        profiles: profileMap.get(r.user_id) || null,
      })) as Review[];
      
      setReviews(reviewsWithProfiles);
      if (user) {
        const myReview = reviewsWithProfiles.find(r => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    }
    
    setIsLoading(false);
  };

  const submitReview = async (isPositive: boolean) => {
    if (!userId) {
      onAuthRequired();
      return;
    }

    if (userReview) {
      // Update existing review
      const { error } = await supabase
        .from("entity_reviews")
        .update({ is_positive: isPositive })
        .eq("id", userReview.id);

      if (!error) {
        toast({ title: "Review updated!" });
        fetchData();
        onReviewChange();
      }
    } else {
      // Create new review
      const { error } = await supabase
        .from("entity_reviews")
        .insert({
          entity_id: entityId,
          user_id: userId,
          is_positive: isPositive,
        });

      if (!error) {
        toast({ title: "Review submitted!" });
        fetchData();
        onReviewChange();
      } else {
        toast({
          title: "Error",
          description: "Could not submit review",
          variant: "destructive",
        });
      }
    }
  };

  const positiveCount = reviews.filter(r => r.is_positive).length;
  const negativeCount = reviews.filter(r => !r.is_positive).length;

  return (
    <div className="space-y-6">
      {/* Vote Section */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cast Your Vote</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your vote directly impacts this entity's score. Only verified users can vote.
        </p>
        
        <div className="flex gap-4">
          <motion.button
            onClick={() => submitReview(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all ${
              userReview?.is_positive 
                ? "bg-score-green/20 border-score-green/50 text-score-green" 
                : "bg-secondary/50 border-white/10 hover:bg-score-green/10 hover:border-score-green/30"
            } border`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ThumbsUp className="w-5 h-5" />
            <span className="font-semibold">{positiveCount}</span>
          </motion.button>
          
          <motion.button
            onClick={() => submitReview(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl transition-all ${
              userReview && !userReview.is_positive
                ? "bg-score-red/20 border-score-red/50 text-score-red" 
                : "bg-secondary/50 border-white/10 hover:bg-score-red/10 hover:border-score-red/30"
            } border`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ThumbsDown className="w-5 h-5" />
            <span className="font-semibold">{negativeCount}</span>
          </motion.button>
        </div>
      </GlassCard>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to vote!
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                    {review.profiles?.avatar_url ? (
                      <img 
                        src={review.profiles.avatar_url} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {review.profiles?.display_name || review.profiles?.username || "Anonymous"}
                      </span>
                      {(review.profiles?.verification_score || 0) > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className={`p-2 rounded-lg ${
                    review.is_positive ? "bg-score-green/20" : "bg-score-red/20"
                  }`}>
                    {review.is_positive ? (
                      <ThumbsUp className="w-4 h-4 text-score-green" />
                    ) : (
                      <ThumbsDown className="w-4 h-4 text-score-red" />
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
