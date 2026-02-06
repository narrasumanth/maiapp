import { useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const OnboardingModal = ({ isOpen, onClose, userId }: OnboardingModalProps) => {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your display name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
        })
        .eq("user_id", userId);

      if (error) {
        // Ignore abort errors (happens when modal closes during request)
        if (error.message?.includes('aborted') || error.code === 'PGRST301') {
          return;
        }
        throw error;
      }

      toast({
        title: "Welcome to MAI Pulse! 🎉",
        description: "Your profile has been set up successfully.",
      });
      onClose();
    } catch (error: any) {
      // Ignore abort/cancel errors
      if (error?.message?.includes('aborted') || error?.name === 'AbortError') {
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <User className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-sm">
            Just a few details to get you started
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 sm:mt-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Display Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                required
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                maxLength={20}
              />
            </div>
          </div>

          <div className="pt-3 sm:pt-4">
            <button
              type="submit"
              disabled={isLoading || !displayName.trim()}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex items-start gap-2 sm:gap-3">
            <Check className="w-4 sm:w-5 h-4 sm:h-5 text-score-green shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              You can claim up to <span className="text-foreground font-medium">4 profiles</span> with your account to manage their reputation.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
