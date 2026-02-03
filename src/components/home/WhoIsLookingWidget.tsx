import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const WhoIsLookingWidget = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Show widget after a delay for engagement
    const timer = setTimeout(() => {
      if (!isDismissed) setIsVisible(true);
    }, 5000);

    // Generate random view count for demo
    setViewCount(Math.floor(Math.random() * 8) + 1);

    return () => clearTimeout(timer);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="relative bg-secondary/90 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-lg shadow-primary/10 max-w-xs">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <motion.div
                className="p-2 rounded-full bg-primary/20 text-primary"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Eye className="w-5 h-5" />
              </motion.div>

              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {viewCount} people searched for you today
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user ? "View your profile analytics" : "Sign in to see who"}
                </p>

                <motion.button
                  className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (user) {
                      window.location.href = "/dashboard";
                    } else {
                      // Trigger login modal - for now just navigate
                      window.location.href = "/dashboard";
                    }
                  }}
                >
                  {user ? (
                    <>
                      <Eye className="w-3 h-3" />
                      View Details
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3 h-3" />
                      See Who
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
