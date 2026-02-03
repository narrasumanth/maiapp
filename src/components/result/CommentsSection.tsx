import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, User, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { formatDistanceToNow } from "date-fns";

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

export const CommentsSection = ({ entityId, onAuthRequired }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
    checkUser();
  }, [entityId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
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

        // Award points
        await supabase.rpc("award_points", {
          _user_id: user.id,
          _amount: 3,
          _action_type: "comment",
          _reference_id: entityId,
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

  return (
    <GlassCard className="p-6">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-primary" />
        Comments ({comments.length})
      </h3>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors pr-12"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to share!
          </p>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Anonymous</span>
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
                  className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-score-red transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </GlassCard>
  );
};
