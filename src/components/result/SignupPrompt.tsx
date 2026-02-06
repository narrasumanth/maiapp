import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, UserPlus, User, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface SignupPromptProps {
  onAuthRequired: () => void;
}

export const SignupPrompt = ({ onAuthRequired }: SignupPromptProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setIsLoggedIn(!!session?.user);
          setUserEmail(session?.user?.email || null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (isMounted) setIsLoggedIn(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        console.log("SignupPrompt: Auth state changed:", event);
        setIsLoggedIn(!!session?.user);
        setUserEmail(session?.user?.email || null);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Show prompt after 3 seconds if not dismissed and auth state is known
    if (isLoggedIn !== null && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isDismissed, isLoggedIn]);

  // Don't show anything until we know auth state
  if (isLoggedIn === null || isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, x: 10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 right-4 z-40 max-w-xs"
        >
          <div className="relative bg-card backdrop-blur-sm border border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5">
            <button
              onClick={() => setIsDismissed(true)}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {isLoggedIn ? (
              // Logged in user message
              <div className="flex items-start gap-3 pr-4">
                <div className="p-2 rounded-lg bg-score-green/10 text-score-green shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    You're signed in
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed truncate">
                    {userEmail || "Welcome back!"}
                  </p>

                  <Link
                    to="/dashboard"
                    onClick={() => setIsDismissed(true)}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <User className="w-3 h-3" />
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              // Not logged in - signup prompt
              <div className="flex items-start gap-3 pr-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    Ready to claim your profile?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Sign up to review, claim & manage your reputation.
                  </p>

                  <button
                    onClick={() => {
                      setIsDismissed(true);
                      onAuthRequired();
                    }}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    Sign Up Free
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
