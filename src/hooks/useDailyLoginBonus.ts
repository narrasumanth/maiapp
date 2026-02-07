import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DAILY_BONUS_AMOUNT = 100;
const DAILY_BONUS_KEY = "mai_daily_bonus_claimed";

export const useDailyLoginBonus = () => {
  const { toast } = useToast();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAndAwardDailyBonus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already claimed today (using localStorage for quick check)
      const today = new Date().toISOString().split("T")[0];
      const lastClaimed = localStorage.getItem(DAILY_BONUS_KEY);
      
      if (lastClaimed === today) {
        return; // Already claimed today
      }

      // Check database for today's claim
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: existingClaim } = await supabase
        .from("points_transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("action_type", "daily_login")
        .gte("created_at", startOfDay.toISOString())
        .limit(1)
        .single();

      if (existingClaim) {
        // Already claimed in DB, update localStorage
        localStorage.setItem(DAILY_BONUS_KEY, today);
        return;
      }

      // Award daily bonus
      const { error } = await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: DAILY_BONUS_AMOUNT,
        _action_type: "daily_login",
        _reference_id: null,
      });

      if (!error) {
        localStorage.setItem(DAILY_BONUS_KEY, today);
        
        // Show toast notification
        setTimeout(() => {
          toast({
            title: "🎁 Daily Bonus Claimed!",
            description: `You earned ${DAILY_BONUS_AMOUNT} MAI points for signing in today!`,
          });
        }, 1500); // Delay to avoid cluttering initial load
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        checkAndAwardDailyBonus();
      }
    });

    // Also check on initial load if already signed in
    checkAndAwardDailyBonus();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);
};
