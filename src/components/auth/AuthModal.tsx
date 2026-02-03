import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast({
        title: "Magic link sent! ✨",
        description: "Check your email to sign in.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmailSent(false);
    setEmail("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md mx-4 glass-card-glow p-8"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {!emailSent ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-neon-gradient flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Join MAI Protocol</h2>
                  <p className="text-sm text-muted-foreground">No password needed</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Enter your email and we'll send you a magic link to sign in instantly.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 glass-card border-white/10 focus:border-primary/50 transition-colors rounded-xl bg-secondary/30"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-neon py-3 disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Send Magic Link ✨"}
                </button>
              </form>

              <p className="text-center mt-6 text-xs text-muted-foreground">
                By signing in, you agree to our Terms and Privacy Policy
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-score-green/20 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-score-green" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Check your email!</h2>
              <p className="text-muted-foreground mb-6">
                We sent a magic link to <span className="text-foreground font-medium">{email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Click the link in the email to sign in. You can close this window.
              </p>
              <button
                onClick={() => setEmailSent(false)}
                className="mt-6 text-primary hover:underline text-sm"
              >
                Use a different email
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
