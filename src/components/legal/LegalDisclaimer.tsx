import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface LegalDisclaimerProps {
  type: "fcra" | "tos" | "score";
  onAccept?: () => void;
  showAsModal?: boolean;
}

export const LegalDisclaimer = ({ type, onAccept, showAsModal = false }: LegalDisclaimerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    checkAcceptance();
  }, [type]);

  const checkAcceptance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsVisible(true);
      return;
    }

    const { data } = await supabase
      .from("user_disclaimer_acceptances")
      .select("id")
      .eq("user_id", user.id)
      .eq("disclaimer_type", type)
      .single();

    if (!data) {
      setIsVisible(true);
    } else {
      setHasAccepted(true);
    }
  };

  const handleAccept = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("user_disclaimer_acceptances").insert({
        user_id: user.id,
        disclaimer_type: type,
      });
    }

    setHasAccepted(true);
    setIsVisible(false);
    onAccept?.();
  };

  const disclaimerContent = {
    fcra: {
      title: "Important FCRA Notice",
      icon: AlertTriangle,
      color: "text-score-yellow",
      content: (
        <>
          <p className="mb-3">
            <strong>This is NOT a Consumer Reporting Agency.</strong>
          </p>
          <p className="mb-3">
            MAI Protocol scores are <strong>opinions</strong> based on aggregated public data and 
            AI analysis. They should not be used for:
          </p>
          <ul className="list-disc list-inside mb-3 space-y-1 text-sm">
            <li>Employment decisions or background checks</li>
            <li>Tenant screening or housing decisions</li>
            <li>Credit, insurance, or financial decisions</li>
            <li>Any purpose covered by the Fair Credit Reporting Act (FCRA)</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            By using this service, you agree not to use scores for any prohibited purpose.
          </p>
        </>
      ),
    },
    tos: {
      title: "Terms of Service",
      icon: Shield,
      color: "text-primary",
      content: (
        <>
          <p className="mb-3">
            MAI Protocol provides reputation intelligence as <strong>informational opinions only</strong>.
          </p>
          <ul className="list-disc list-inside mb-3 space-y-1 text-sm">
            <li>Scores are generated from public web data and AI analysis</li>
            <li>We do not guarantee accuracy of third-party information</li>
            <li>Entity owners can dispute and claim profiles</li>
            <li>Community voting influences but doesn't determine scores</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Full terms available at /terms. By continuing, you accept these terms.
          </p>
        </>
      ),
    },
    score: {
      title: "Score Disclaimer",
      icon: Shield,
      color: "text-primary",
      content: (
        <>
          <p className="mb-3 text-sm">
            This trust score is an <strong>AI-generated opinion</strong> based on publicly available 
            information at the time of analysis. It is not a factual assessment or official rating.
          </p>
          <p className="text-xs text-muted-foreground">
            Scores may not reflect recent changes. Always conduct your own due diligence.
          </p>
        </>
      ),
    },
  };

  const config = disclaimerContent[type];
  const IconComponent = config.icon;

  if (!isVisible || hasAccepted) return null;

  if (showAsModal) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-2xl max-w-lg w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl bg-secondary/50 ${config.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">{config.title}</h3>
            </div>

            <div className="text-foreground/80 mb-6">
              {config.content}
            </div>

            <Button onClick={handleAccept} className="w-full">
              I Understand & Accept
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Inline banner version
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary/30 border border-border rounded-xl p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${config.color}`} />
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-2">{config.title}</h4>
          <div className="text-sm text-muted-foreground">
            {config.content}
          </div>
        </div>
        <button
          onClick={handleAccept}
          className="shrink-0 p-1 hover:bg-secondary rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// Footer disclaimer for all pages
export const FooterDisclaimer = () => (
  <div className="text-center text-xs text-muted-foreground py-4 border-t border-border mt-8">
    <p>
      MAI Protocol scores are AI-generated opinions, not facts.{" "}
      <span className="text-score-yellow">Not for FCRA-regulated uses.</span>
    </p>
    <p className="mt-1">
      © {new Date().getFullYear()} MAI Protocol. All rights reserved.
    </p>
  </div>
);
