import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ClaimProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  category: string;
}

export const ClaimProfileModal = ({
  isOpen,
  onClose,
  entityId,
  entityName,
}: ClaimProfileModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleQuickClaim = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to claim a profile.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if user already has 4 claimed profiles
      const { count } = await supabase
        .from("entities")
        .select("id", { count: "exact", head: true })
        .eq("claimed_by", user.id);

      if (count && count >= 4) {
        toast({
          title: "Claim limit reached",
          description: "You can only claim up to 4 profiles.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if already claimed
      const { data: existingClaim } = await supabase
        .from("profile_claims")
        .select("id")
        .eq("entity_id", entityId)
        .eq("user_id", user.id)
        .single();

      if (existingClaim) {
        toast({
          title: "Already claimed",
          description: "You already have a pending claim for this profile.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Submit quick claim
      const { error } = await supabase
        .from("profile_claims")
        .insert({
          entity_id: entityId,
          user_id: user.id,
          verification_method: "quick_claim",
          verification_data: { type: "quick_claim", timestamp: new Date().toISOString() },
        });

      if (error) throw error;

      // Award points
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 10,
        _action_type: "claim_submitted",
        _reference_id: entityId,
      });

      setIsSuccess(true);
      toast({
        title: "Claim submitted! 🎉",
        description: "We'll review and approve your claim shortly.",
      });
    } catch (error) {
      console.error("Error submitting claim:", error);
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl text-center">Claim This Profile</DialogTitle>
              <DialogDescription className="text-center">
                {entityName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  What you get as an owner
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• Edit profile description & details</li>
                  <li>• Add social links & contact info</li>
                  <li>• View who's visiting your profile</li>
                  <li>• Receive direct messages</li>
                  <li>• Create private share links</li>
                </ul>
              </div>

              <button
                onClick={handleQuickClaim}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Claim Profile
                  </>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Claims are reviewed within 24-48 hours. You can claim up to 4 profiles.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-score-green/10 border border-score-green/20 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-score-green" />
            </motion.div>
            <DialogHeader>
              <DialogTitle className="text-2xl mb-2">Claim Submitted!</DialogTitle>
              <DialogDescription>
                We'll review your claim and get back to you shortly.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-4">
              You earned <span className="text-primary font-semibold">+10 points</span>!
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
