import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReactionBarProps {
  entityId: string;
  onAuthRequired: () => void;
}

const reactions = [
  { type: "thumbs_up", emoji: "👍", label: "Good" },
  { type: "fire", emoji: "🔥", label: "Hot" },
  { type: "warning", emoji: "⚠️", label: "Warning" },
];

export const ReactionBar = ({ entityId, onAuthRequired }: ReactionBarProps) => {
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchReactions();
  }, [entityId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    
    if (user) {
      const { data } = await supabase
        .from("entity_reactions")
        .select("reaction_type")
        .eq("entity_id", entityId)
        .eq("user_id", user.id);
      
      if (data) {
        setUserReactions(data.map(r => r.reaction_type));
      }
    }
  };

  const fetchReactions = async () => {
    const { data } = await supabase
      .from("entity_reactions")
      .select("reaction_type")
      .eq("entity_id", entityId);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(r => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
      });
      setReactionCounts(counts);
    }
  };

  const toggleReaction = async (type: string) => {
    if (!userId) {
      onAuthRequired();
      return;
    }

    const hasReaction = userReactions.includes(type);

    if (hasReaction) {
      const { error } = await supabase
        .from("entity_reactions")
        .delete()
        .eq("entity_id", entityId)
        .eq("user_id", userId)
        .eq("reaction_type", type);

      if (!error) {
        setUserReactions(prev => prev.filter(r => r !== type));
        setReactionCounts(prev => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) - 1),
        }));
      }
    } else {
      const { error } = await supabase
        .from("entity_reactions")
        .insert({
          entity_id: entityId,
          user_id: userId,
          reaction_type: type,
        });

      if (!error) {
        setUserReactions(prev => [...prev, type]);
        setReactionCounts(prev => ({
          ...prev,
          [type]: (prev[type] || 0) + 1,
        }));
      } else if (error.code === "23505") {
        // Already exists, ignore
      } else {
        toast({
          title: "Error",
          description: "Could not add reaction",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {reactions.map((reaction) => {
        const count = reactionCounts[reaction.type] || 0;
        const isActive = userReactions.includes(reaction.type);
        
        return (
          <motion.button
            key={reaction.type}
            onClick={() => toggleReaction(reaction.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              isActive 
                ? "bg-primary/20 border-primary/50" 
                : "bg-secondary/50 border-white/10 hover:bg-secondary/80"
            } border`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={reaction.label}
          >
            <span className="text-lg">{reaction.emoji}</span>
            {count > 0 && (
              <span className="text-sm text-muted-foreground">{count}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
