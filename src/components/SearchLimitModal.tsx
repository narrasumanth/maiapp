import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Zap, LogIn, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";

interface SearchLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  limit: number;
}

export const SearchLimitModal = ({
  isOpen,
  onClose,
  isAuthenticated,
  limit,
}: SearchLimitModalProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignIn = () => {
    onClose();
    setShowAuthModal(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && createPortal(
          <>
            {/* Backdrop - high z-index */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
              style={{ touchAction: 'none' }}
            />

            {/* Modal Container - Scrollable with highest z-index */}
            <div 
              className="fixed inset-0 z-[10000] overflow-y-auto"
              style={{ touchAction: 'pan-y' }}
            >
              <div className="min-h-full flex items-center justify-center p-4 py-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header with icon */}
                    <div className="relative bg-gradient-to-br from-destructive/20 to-orange-500/20 p-5 sm:p-6 text-center">
                      <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                      
                      <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-full bg-destructive/20 border-2 border-destructive/40 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
                      </div>
                      
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        Search Limit Reached
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="p-2 rounded-lg bg-muted shrink-0">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {isAuthenticated 
                              ? `You've used all ${limit} searches`
                              : `You've used all ${limit} free searches`
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isAuthenticated 
                              ? "Your limit resets in 1 hour"
                              : "Hourly limit for free users"
                            }
                          </p>
                        </div>
                      </div>

                      {!isAuthenticated && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary/20">
                          <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              Sign in for 300 searches/hour
                            </p>
                            <p className="text-xs text-muted-foreground">
                              3x more searches with an account
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2">
                        {!isAuthenticated ? (
                          <>
                            <Button
                              onClick={handleSignIn}
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
                    <div className="px-4 sm:px-6 pb-4">
                      <p className="text-xs text-center text-muted-foreground">
                        💡 Cached searches don't count against your limit
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>,
          document.body
        )}
      </AnimatePresence>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};
