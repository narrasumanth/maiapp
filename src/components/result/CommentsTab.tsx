import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User as UserIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    verification_score: number;
  };
}

interface CommentsTabProps {
  entityId: string;
  onAuthRequired: () => void;
}

export const CommentsTab = ({ entityId, onAuthRequired }: CommentsTabProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`comments-${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entity_comments",
          filter: `entity_id=eq.${entityId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { data } = await supabase
      .from("entity_comments")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, verification_score")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const commentsWithProfiles = data.map(c => ({
        ...c,
        profiles: profileMap.get(c.user_id) || null,
      })) as Comment[];
      
      setComments(commentsWithProfiles);
    }
    
    setIsLoading(false);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      onAuthRequired();
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("entity_comments")
      .insert({
        entity_id: entityId,
        user_id: userId,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment("");
      toast({ title: "Comment posted!" });
    } else {
      toast({
        title: "Error",
        description: "Could not post comment",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("entity_comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      toast({ title: "Comment deleted" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <form onSubmit={submitComment}>
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={userId ? "Share your thoughts..." : "Sign in to comment"}
            className="w-full p-4 pr-12 glass-card border-white/10 focus:border-primary/50 transition-colors rounded-xl resize-none"
            rows={3}
            disabled={!userId}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Start the conversation!
          </div>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <img 
                        src={comment.profiles.avatar_url} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {comment.profiles?.display_name || comment.profiles?.username || "Anonymous"}
                      </span>
                      {(comment.profiles?.verification_score || 0) > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  
                  {comment.user_id === userId && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="p-1.5 rounded-lg hover:bg-score-red/20 text-muted-foreground hover:text-score-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
