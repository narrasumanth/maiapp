import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2, CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to get user-friendly error messages
const getErrorMessage = (error: any): { title: string; message: string } => {
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorCode = error?.code?.toString() || "";
  
  // OAuth specific errors
  if (errorMessage.includes("oauth") || errorMessage.includes("secret") || errorCode === "400") {
    return {
      title: "Sign-in configuration issue",
      message: "There was a problem with the sign-in service. Please try again or use email sign-in instead.",
    };
  }
  
  if (errorMessage.includes("validation failed") || errorMessage.includes("code_verifier")) {
    return {
      title: "Session expired",
      message: "Your sign-in session expired. Please try again.",
    };
  }
  
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return {
      title: "Too many attempts",
      message: "Please wait a few minutes before trying again.",
    };
  }
  
  if (errorMessage.includes("email not confirmed")) {
    return {
      title: "Email not verified",
      message: "Please check your inbox and verify your email first.",
    };
  }
  
  if (errorMessage.includes("invalid") || errorMessage.includes("credentials")) {
    return {
      title: "Invalid credentials",
      message: "Please check your email and try again.",
    };
  }
  
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return {
      title: "Connection error",
      message: "Please check your internet connection and try again.",
    };
  }
  
  if (errorMessage.includes("popup") || errorMessage.includes("blocked")) {
    return {
      title: "Popup blocked",
      message: "Please allow popups for this site and try again.",
    };
  }
  
  return {
    title: "Sign in failed",
    message: error?.message || "Something went wrong. Please try again.",
  };
};

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<"main" | "magic-link" | "check-email" | "error">("main");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ title: string; message: string } | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode("main");
      setEmail("");
      setIsLoading(false);
      setErrorInfo(null);
      
      // Check if already logged in - close modal immediately
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          console.log("AuthModal: User already logged in, closing modal");
          onClose();
        }
      });
    }
  }, [isOpen, onClose]);

  // Listen for auth state changes to close modal on successful sign-in
  useEffect(() => {
    if (!isOpen) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthModal: Auth state changed:", event, "Session:", !!session?.user);
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
          console.log("AuthModal: User signed in successfully, forcing page reload");
          setIsLoading(false);
          onClose();
          // Force a hard reload to fully reset the app state with the new session
          window.location.reload();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isOpen, onClose]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorInfo(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        const errorDetails = getErrorMessage(error);
        setErrorInfo(errorDetails);
        setMode("error");
      } else {
        setMode("check-email");
      }
    } catch (err) {
      console.error("Magic link error:", err);
      const errorDetails = getErrorMessage(err);
      setErrorInfo(errorDetails);
      setMode("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMode("main");
    setEmail("");
    setIsLoading(false);
    setErrorInfo(null);
    onClose();
  };

  const handleRetry = () => {
    setErrorInfo(null);
    setMode("main");
  };

  if (!isOpen) return null;

  // Use portal to render modal at document body level to escape parent stacking contexts
  return createPortal(
    <>
      {/* Backdrop - highest z-index to ensure it's above navbar and all other elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
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
            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary/50 transition-colors z-10"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <AnimatePresence mode="wait">
              {mode === "error" ? (
                /* Error Screen */
                <motion.div
                  key="error"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 sm:p-6 text-center"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold mb-2">{errorInfo?.title}</h2>
                  <p className="text-muted-foreground text-sm mb-5 sm:mb-6 leading-relaxed">
                    {errorInfo?.message}
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleRetry}
                      className="w-full py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full py-2.5 sm:py-3 rounded-xl text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : mode === "check-email" ? (
                /* Check Email Screen */
                <motion.div
                  key="check-email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 sm:p-6 text-center"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold mb-2">Check your email</h2>
                  <p className="text-muted-foreground text-sm mb-3 sm:mb-4">
                    We sent a magic link to <span className="font-medium text-foreground break-all">{email}</span>
                  </p>
                  <p className="text-muted-foreground text-xs mb-5 sm:mb-6">
                    Click the link in the email to sign in. You can close this window.
                  </p>
                  <button
                    onClick={() => setMode("main")}
                    className="text-sm text-primary hover:underline"
                  >
                    Use a different method
                  </button>
                </motion.div>
              ) : mode === "magic-link" ? (
                /* Magic Link Form */
                <motion.div
                  key="magic-link"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 sm:p-6"
                >
                  <button
                    onClick={() => setMode("main")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 sm:mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  
                  <h2 className="text-lg sm:text-xl font-bold mb-2">Sign in with email</h2>
                  <p className="text-muted-foreground text-sm mb-5 sm:mb-6">
                    We'll send you a magic link to sign in instantly.
                  </p>

                  <form onSubmit={handleMagicLink} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground text-base"
                        required
                        autoFocus
                        autoComplete="email"
                        inputMode="email"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="w-full py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send magic link"
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* Main Sign In - Email Only */
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-5 sm:p-6"
                >
                  <div className="text-center mb-5 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-1">Welcome to MAI</h2>
                    <p className="text-muted-foreground text-sm">
                      Sign in with your email to continue
                    </p>
                  </div>

                  <form onSubmit={handleMagicLink} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground text-base"
                        required
                        autoFocus
                        autoComplete="email"
                        inputMode="email"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="w-full py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send magic link
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center mt-5 sm:mt-6 leading-relaxed">
                    We'll send you a magic link to sign in instantly.
                    <br />
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>,
    document.body
  );
};
