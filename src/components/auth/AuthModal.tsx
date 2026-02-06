import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2, CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to get user-friendly error messages
const getErrorMessage = (error: any): { title: string; message: string } => {
  const errorMessage = error?.message?.toLowerCase() || "";
  
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
        console.log("AuthModal: Auth state changed:", event);
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
          console.log("AuthModal: User signed in, closing modal");
          setIsLoading(false);
          onClose();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isOpen, onClose]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorInfo(null);
    
    try {
      // First check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("User already logged in, closing modal");
        setIsLoading(false);
        onClose();
        return;
      }
      
      // Detect if running on custom domain
      const isCustomDomain = 
        !window.location.hostname.includes("lovable.app") &&
        !window.location.hostname.includes("lovableproject.com") &&
        !window.location.hostname.includes("localhost");
      
      console.log("Starting Google sign-in, custom domain:", isCustomDomain, "host:", window.location.hostname);
      
      if (isCustomDomain) {
        // For custom domains, use Supabase directly with skipBrowserRedirect
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true,
          },
        });
        
        if (error) {
          console.error("Custom domain OAuth error:", error);
          const errorDetails = getErrorMessage(error);
          setErrorInfo(errorDetails);
          setMode("error");
          setIsLoading(false);
          return;
        }
        
        if (data?.url) {
          console.log("Redirecting to OAuth URL:", data.url);
          // Don't set isLoading to false here - we're about to redirect
          window.location.href = data.url;
          return; // Keep loading state as we redirect
        }
      } else {
        // For Lovable domains, use the managed lovable auth
        console.log("Using Lovable managed OAuth");
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        
        console.log("Lovable OAuth result:", result);
        
        if (result.error) {
          console.error("Lovable OAuth error:", result.error);
          const errorDetails = getErrorMessage(result.error);
          setErrorInfo(errorDetails);
          setMode("error");
          setIsLoading(false);
          return;
        }
        
        // If redirected, keep loading state - page will change
        if (result.redirected) {
          console.log("OAuth redirect initiated, keeping loading state");
          return; // Don't set loading to false - redirect in progress
        }
        
        // If we got tokens directly (rare, but possible), session should be set
        // The auth state change listener will close the modal
        console.log("OAuth completed without redirect");
      }
    } catch (err) {
      console.error("Google sign in error:", err);
      const errorDetails = getErrorMessage(err);
      setErrorInfo(errorDetails);
      setMode("error");
      setIsLoading(false);
    }
    // Note: We intentionally don't have a finally block that sets isLoading to false
    // because successful auth redirects away or triggers the auth state change listener
  };

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
                /* Main Sign In Options */
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
                      Sign in to access your account
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Google Sign In */}
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-3 border border-border disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      <span className="text-sm sm:text-base">
                        {isLoading ? "Connecting..." : "Continue with Google"}
                      </span>
                    </button>

                    <div className="relative my-3 sm:my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-card text-muted-foreground">or</span>
                      </div>
                    </div>

                    {/* Magic Link Option */}
                    <button
                      onClick={() => setMode("magic-link")}
                      disabled={isLoading}
                      className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-secondary/50 text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-3 border border-border disabled:opacity-50"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-sm sm:text-base">Continue with Email</span>
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-5 sm:mt-6 leading-relaxed">
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
