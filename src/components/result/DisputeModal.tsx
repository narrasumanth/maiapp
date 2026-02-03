import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, FileText, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HoneypotField, useHoneypotValidation } from "@/components/security/HoneypotField";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  onAuthRequired: () => void;
}

const DISPUTE_TYPES = [
  { value: "inaccurate_score", label: "Inaccurate Score", description: "The trust score doesn't reflect reality" },
  { value: "false_review", label: "False Review", description: "A review contains false information" },
  { value: "incorrect_info", label: "Incorrect Information", description: "Entity details are wrong" },
  { value: "impersonation", label: "Impersonation", description: "Someone is impersonating this entity" },
  { value: "other", label: "Other", description: "Other issue not listed above" },
];

export const DisputeModal = ({ 
  isOpen, 
  onClose, 
  entityId, 
  entityName,
  onAuthRequired 
}: DisputeModalProps) => {
  const [disputeType, setDisputeType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { validateHoneypot } = useHoneypotValidation("dispute-form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bot check
    if (!validateHoneypot()) {
      toast({
        title: "Submission blocked",
        description: "Suspicious activity detected.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!disputeType || !title.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const urls = evidenceUrls.split("\n").filter(url => url.trim());

      const { error } = await supabase.from("disputes").insert({
        entity_id: entityId,
        user_id: user.id,
        dispute_type: disputeType,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 2000),
        evidence_urls: urls.length > 0 ? urls.slice(0, 5) : null,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Dispute submitted",
        description: "We'll review your case within 48 hours.",
      });

      // Award points for legitimate dispute
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 10,
        _action_type: "dispute",
        _reference_id: entityId,
      });

    } catch (error) {
      console.error("Error submitting dispute:", error);
      toast({
        title: "Error",
        description: "Failed to submit dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDisputeType("");
    setTitle("");
    setDescription("");
    setEvidenceUrls("");
    setIsSubmitted(false);
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

        <motion.div
          className="relative w-full max-w-lg mx-4 glass-card-glow p-6 max-h-[90vh] overflow-y-auto"
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

          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-score-green/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-score-green" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Dispute Submitted</h2>
              <p className="text-muted-foreground mb-4">
                Your dispute for <span className="font-medium text-foreground">{entityName}</span> has been received.
              </p>
              <p className="text-sm text-muted-foreground">
                Our moderation team will review your case within 48 hours. You'll receive a notification with the outcome.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 btn-glass px-6 py-2"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-score-yellow/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-score-yellow" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">File a Dispute</h2>
                  <p className="text-sm text-muted-foreground">Report an issue with {entityName}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <HoneypotField formId="dispute-form" />

                {/* Dispute Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Issue Type *</label>
                  <div className="grid grid-cols-1 gap-2">
                    {DISPUTE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setDisputeType(type.value)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          disputeType === type.value
                            ? "border-primary bg-primary/10"
                            : "border-white/10 bg-secondary/30 hover:border-white/20"
                        }`}
                      >
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of the issue"
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your dispute..."
                    maxLength={2000}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{description.length}/2000 characters</p>
                </div>

                {/* Evidence URLs */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Evidence URLs (optional)
                  </label>
                  <textarea
                    value={evidenceUrls}
                    onChange={(e) => setEvidenceUrls(e.target.value)}
                    placeholder="Enter URLs to supporting evidence (one per line)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !disputeType || !title.trim() || !description.trim()}
                  className="w-full btn-neon py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Dispute
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
