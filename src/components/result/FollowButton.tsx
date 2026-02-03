import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FollowButtonProps {
  entityId: string;
  onAuthRequired: () => void;
}

export const FollowButton = ({ entityId, onAuthRequired }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFollowState();
  }, [entityId]);

  const fetchFollowState = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("entity_follows")
      .select("id")
      .eq("entity_id", entityId)
      .eq("user_id", user.id)
      .single();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onAuthRequired();
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from("entity_follows")
          .delete()
          .eq("entity_id", entityId)
          .eq("user_id", user.id);
        
        setIsFollowing(false);
      } else {
        await supabase
          .from("entity_follows")
          .insert({
            entity_id: entityId,
            user_id: user.id,
          });
        
        setIsFollowing(true);

        // Award points for following
        await supabase.rpc("award_points", {
          _user_id: user.id,
          _amount: 2,
          _action_type: "follow",
          _reference_id: entityId,
        });
      }
    } catch (error) {
      console.error("Error following:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
        isFollowing
          ? "bg-primary/20 text-primary"
          : "bg-secondary/50 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={isFollowing ? "Unfollow" : "Follow for updates"}
    >
      {isFollowing ? (
        <>
          <Bell className="w-3.5 h-3.5" />
          <span>Following</span>
        </>
      ) : (
        <>
          <BellOff className="w-3.5 h-3.5" />
          <span>Follow</span>
        </>
      )}
    </motion.button>
  );
};
