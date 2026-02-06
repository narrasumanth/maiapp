import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Zap, LogIn, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  limit: number;
  onSignIn: () => void;
}

export const SearchLimitModal = ({
  isOpen,
  onClose,
  isAuthenticated,
  limit,
  onSignIn,
}: SearchLimitModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with icon */}
              <div className="relative bg-gradient-to-br from-destructive/20 to-orange-500/20 p-6 text-center">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
                
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 border-2 border-destructive/40 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground">
                  Search Limit Reached
                </h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="p-2 rounded-lg bg-muted">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isAuthenticated 
                        ? `You've used all ${limit} searches today`
                        : `You've used all ${limit} free searches`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAuthenticated 
                        ? "Your limit resets in 24 hours"
                        : "Daily limit for free users"
                      }
                    </p>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Sign in for 300 searches/day
                      </p>
                      <p className="text-xs text-muted-foreground">
                        4x more searches when you create an account
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2">
                  {!isAuthenticated ? (
                    <>
                      <Button
                        onClick={onSignIn}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In for More Searches
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full text-muted-foreground"
                      >
                        Maybe Later
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={onClose}
                      className="w-full"
                      size="lg"
                    >
                      Got It
                    </Button>
                  )}
                </div>
              </div>

              {/* Footer tip */}
              <div className="px-6 pb-4">
                <p className="text-xs text-center text-muted-foreground">
                  💡 Tip: Cached searches don't count against your limit
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
