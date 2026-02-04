import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Check, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BetaBannerProps {
  variant?: "inline" | "floating" | "footer";
  showClose?: boolean;
}

export const BetaBanner = ({ variant = "inline", showClose = true }: BetaBannerProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem("beta-banner-dismissed") === "true";
  });
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", email)
        .single();

      // For anonymous subscriptions, store in a simple way
      // We'll create a contact message as a subscription request
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          sender_name: "Beta Subscriber",
          sender_email: email.trim(),
          subject: "Beta Updates Subscription",
          message: "User subscribed to beta updates from the website.",
          status: "subscription",
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "You're on the list! 🎉",
        description: "We'll keep you updated on new features.",
      });
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Couldn't subscribe",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("beta-banner-dismissed", "true");
    setIsDismissed(true);
  };

  if (isDismissed && showClose) return null;

  if (variant === "floating") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-40 max-w-sm"
        >
          <div className="p-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-lg">
            {showClose && (
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">We're in Beta!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  More features coming soon. Get notified!
                </p>
                
                {!isSubscribed ? (
                  <form onSubmit={handleSubscribe} className="flex gap-2 mt-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 mt-3 text-sm text-score-green">
                    <Check className="w-4 h-4" />
                    <span>You're subscribed!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === "footer") {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-3 px-4 bg-primary/5 border-t border-border/30">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Live Beta</span> — Full app coming soon
          </span>
        </div>
        
        {!isSubscribed ? (
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Get updates"
              className="w-36 px-3 py-1 text-xs rounded-lg bg-secondary/50 border border-border/50 focus:border-primary/50 transition-all"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "..." : "Notify me"}
            </button>
          </form>
        ) : (
          <span className="flex items-center gap-1 text-xs text-score-green">
            <Check className="w-3 h-3" /> Subscribed
          </span>
        )}
      </div>
    );
  }

  // Default inline variant
  return (
    <div className="flex items-center justify-center gap-3 py-2 px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span>Live Beta</span>
      </div>
      <span className="opacity-30">•</span>
      <span>More features coming soon</span>
    </div>
  );
};
