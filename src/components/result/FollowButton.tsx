import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FollowButtonProps {
  entityId: string;
  onAuthRequired: () => void;
}

export const FollowButton = ({ entityId, onAuthRequired }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFollowState();
    fetchFollowerCount();
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

  const fetchFollowerCount = async () => {
    const { count } = await supabase
      .from("entity_follows")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", entityId);
    
    setFollowerCount(count || 0);
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
        setFollowerCount(c => c - 1);
      } else {
        await supabase
          .from("entity_follows")
          .insert({
            entity_id: entityId,
            user_id: user.id,
          });
        
        setIsFollowing(true);
        setFollowerCount(c => c + 1);

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
    <div className="flex items-center gap-3">
      <motion.button
        onClick={handleFollow}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
          isFollowing
            ? "bg-primary/20 text-primary border border-primary/30"
            : "bg-primary text-white"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-4 h-4" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Follow
          </>
        )}
      </motion.button>
      
      <span className="text-sm text-muted-foreground">
        {followerCount.toLocaleString()} followers
      </span>
    </div>
  );
};
