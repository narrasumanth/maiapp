import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Globe, Twitter, Linkedin, Mail, AlertCircle, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClaimProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  category: string;
}

type VerificationMethod = "social_proof" | "domain" | "manual";

export const ClaimProfileModal = ({
  isOpen,
  onClose,
  entityId,
  entityName,
  category,
}: ClaimProfileModalProps) => {
  const [step, setStep] = useState<"select" | "verify" | "submitted">("select");
  const [method, setMethod] = useState<VerificationMethod | null>(null);
  const [verificationData, setVerificationData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmitClaim = async () => {
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
          description: "You can only claim up to 4 profiles. Please manage your existing claims.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from("profile_claims")
        .insert({
          entity_id: entityId,
          user_id: user.id,
          verification_method: method,
          verification_data: { proof: verificationData },
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already claimed",
            description: "You already have a pending claim for this profile.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setStep("submitted");
        
        // Award points for submitting a claim
        await supabase.rpc("award_points", {
          _user_id: user.id,
          _amount: 10,
          _action_type: "claim_submitted",
          _reference_id: entityId,
        });
      }
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

  const verificationMethods = [
    {
      id: "social_proof" as VerificationMethod,
      icon: Twitter,
      title: "Social Proof",
      description: "Link your verified social media accounts",
      instructions: "Paste a link to your official Twitter, LinkedIn, or Instagram profile that matches this entity.",
    },
    {
      id: "domain" as VerificationMethod,
      icon: Globe,
      title: "Domain Verification",
      description: "Prove ownership via website domain",
      instructions: "Enter your website URL. We'll provide a verification code to add to your site.",
    },
    {
      id: "manual" as VerificationMethod,
      icon: Mail,
      title: "Manual Review",
      description: "Submit documents for review",
      instructions: "Describe why you should own this profile and provide any supporting evidence.",
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-lg mx-4 glass-card-glow p-6"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {step === "select" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Claim This Profile</h2>
                  <p className="text-sm text-muted-foreground">{entityName}</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                Choose how you'd like to verify your ownership of this {category.toLowerCase()}.
              </p>

              <div className="space-y-3">
                {verificationMethods.map((vm) => (
                  <motion.button
                    key={vm.id}
                    onClick={() => {
                      setMethod(vm.id);
                      setStep("verify");
                    }}
                    className="w-full p-4 rounded-xl bg-secondary/30 border border-white/10 hover:border-primary/30 hover:bg-secondary/50 transition-all text-left"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <vm.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{vm.title}</p>
                        <p className="text-sm text-muted-foreground">{vm.description}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-score-yellow/10 border border-score-yellow/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-score-yellow shrink-0 mt-0.5" />
                  <p className="text-sm text-score-yellow">
                    Claiming a profile you don't own is against our terms and may result in account suspension.
                  </p>
                </div>
              </div>
            </>
          )}

          {step === "verify" && method && (
            <>
              <button
                onClick={() => setStep("select")}
                className="text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                ← Back
              </button>

              <h2 className="text-xl font-bold mb-2">
                {verificationMethods.find(v => v.id === method)?.title}
              </h2>
              <p className="text-muted-foreground mb-6">
                {verificationMethods.find(v => v.id === method)?.instructions}
              </p>

              <textarea
                value={verificationData}
                onChange={(e) => setVerificationData(e.target.value)}
                placeholder={
                  method === "social_proof" 
                    ? "https://twitter.com/yourprofile" 
                    : method === "domain" 
                    ? "https://yourwebsite.com" 
                    : "Explain why you should own this profile..."
                }
                className="w-full p-4 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 resize-none mb-4"
                rows={4}
              />

              <button
                onClick={handleSubmitClaim}
                disabled={!verificationData.trim() || isLoading}
                className="w-full btn-neon py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Claim"
                )}
              </button>
            </>
          )}

          {step === "submitted" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-score-green/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-score-green" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Claim Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                We'll review your claim and get back to you within 24-48 hours.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You earned <span className="text-primary font-semibold">+10 points</span> for submitting!
              </p>
              <button
                onClick={onClose}
                className="btn-glass px-6 py-2"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
