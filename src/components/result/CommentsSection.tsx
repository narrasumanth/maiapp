import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, User, Trash2, Lock, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { HoneypotField, useHoneypotValidation } from "@/components/security/HoneypotField";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface CommentsSectionProps {
  entityId: string;
  onAuthRequired: () => void;
}

const MIN_SCORE_TO_COMMENT = 50;
const MIN_ACCOUNT_AGE_HOURS = 24;
const SPAM_THRESHOLD_COMMENTS = 5; // Max comments per hour
const SPAM_PENALTY_POINTS = -10;

export const CommentsSection = ({ entityId, onAuthRequired }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userScore, setUserScore] = useState<number>(0);
  const [canComment, setCanComment] = useState(false);
  const [accountAgeHours, setAccountAgeHours] = useState<number>(0);
  const [blockReason, setBlockReason] = useState<string>("");
  const { validateHoneypot } = useHoneypotValidation("comment-form");
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
    checkUserPermissions();
  }, [entityId]);

  const checkUserPermissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCurrentUserId(null);
      setCanComment(false);
      setBlockReason("sign_in");
      return;
    }
    
    setCurrentUserId(user.id);

    // Check account age
    const createdAt = new Date(user.created_at);
    const ageHours = differenceInHours(new Date(), createdAt);
    setAccountAgeHours(ageHours);

    // Check user's trust score from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("trust_score")
      .eq("user_id", user.id)
      .single();

    const score = profile?.trust_score || 0;
    setUserScore(score);

    // Determine if user can comment
    if (ageHours < MIN_ACCOUNT_AGE_HOURS) {
      setCanComment(false);
      setBlockReason("account_age");
    } else if (score < MIN_SCORE_TO_COMMENT) {
      setCanComment(false);
      setBlockReason("score");
    } else {
      setCanComment(true);
      setBlockReason("");
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("entity_comments")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setComments(data);
    }
  };

  const checkSpamAndPenalize = async (userId: string): Promise<boolean> => {
    // Count user's comments in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from("entity_comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo);

    if ((count || 0) >= SPAM_THRESHOLD_COMMENTS) {
      // Penalize the user
      await supabase.rpc("award_points", {
        _user_id: userId,
        _amount: SPAM_PENALTY_POINTS,
        _action_type: "spam_penalty",
        _reference_id: entityId,
      });

      // Reduce their trust score in profile
      await supabase
        .from("profiles")
        .update({ trust_score: Math.max(0, userScore + SPAM_PENALTY_POINTS) })
        .eq("user_id", userId);

      return true; // Is spam
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateHoneypot()) {
      toast({
        title: "Submission blocked",
        description: "Suspicious activity detected.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!canComment) {
      toast({
        title: "Cannot Comment",
        description: blockReason === "account_age" 
          ? "New accounts must wait 24 hours before commenting."
          : `You need a trust score of ${MIN_SCORE_TO_COMMENT}+ to comment.`,
        variant: "destructive",
      });
      return;
    }

    // Check for spam
    const isSpam = await checkSpamAndPenalize(user.id);
    if (isSpam) {
      toast({
        title: "Slow Down! 🛑",
        description: "Too many comments. Your score has been reduced. Try again later.",
        variant: "destructive",
      });
      setUserScore(prev => Math.max(0, prev + SPAM_PENALTY_POINTS));
      if (userScore + SPAM_PENALTY_POINTS < MIN_SCORE_TO_COMMENT) {
        setCanComment(false);
        setBlockReason("score");
      }
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("entity_comments")
        .insert({
          entity_id: entityId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setComments([data, ...comments]);
        setNewComment("");

        await supabase.rpc("award_points", {
          _user_id: user.id,
          _amount: 3,
          _action_type: "comment",
          _reference_id: entityId,
        });

        toast({
          title: "Comment Posted! +3 pts",
          description: "Thanks for contributing!",
        });
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await supabase
        .from("entity_comments")
        .delete()
        .eq("id", commentId);

      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const renderBlockedState = () => {
    if (blockReason === "sign_in") {
      return (
        <button
          onClick={onAuthRequired}
          className="w-full p-3 mb-4 text-sm text-center rounded-lg bg-secondary/20 border border-white/5 text-muted-foreground hover:bg-secondary/30 transition-colors"
        >
          Sign in to comment
        </button>
      );
    }

    if (blockReason === "account_age") {
      const hoursLeft = MIN_ACCOUNT_AGE_HOURS - accountAgeHours;
      return (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-secondary/20 border border-white/5">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              New accounts must wait <span className="text-primary font-medium">24 hours</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hoursLeft > 0 ? `${Math.ceil(hoursLeft)} hours remaining` : "Almost ready!"}
            </p>
          </div>
        </div>
      );
    }

    if (blockReason === "score") {
      return (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-secondary/20 border border-white/5">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Unlock at <span className="text-primary font-medium">{MIN_SCORE_TO_COMMENT}</span> trust score
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className="h-1.5 flex-1 bg-secondary/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((userScore / MIN_SCORE_TO_COMMENT) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{userScore}/{MIN_SCORE_TO_COMMENT}</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <GlassCard className="p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-primary" />
        Comments ({comments.length})
      </h3>

      {/* Comment Input */}
      {canComment ? (
        <form onSubmit={handleSubmit} className="mb-4">
          <HoneypotField formId="comment-form" />
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience..."
              maxLength={500}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-secondary/30 border border-white/10 focus:border-primary/50 focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isLoading}
              className="px-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        renderBlockedState()
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No comments yet
          </p>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex gap-2 group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  {comment.content}
                </p>
              </div>
              {currentUserId === comment.user_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-score-red transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </GlassCard>
  );
};