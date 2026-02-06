import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ClaimDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  currentOwnerId: string;
}

export const ClaimDisputeModal = ({
  isOpen,
  onClose,
  entityId,
  entityName,
  currentOwnerId,
}: ClaimDisputeModalProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Please provide a reason",
        description: "Explain why you believe you should own this profile.",
        variant: "destructive",
      });
      return;
    }

    if (reason.trim().length < 50) {
      toast({
        title: "More detail needed",
        description: "Please provide at least 50 characters explaining your claim.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user already has a pending dispute for this entity
      const { data: existingDispute } = await supabase
        .from("claim_disputes")
        .select("id")
        .eq("entity_id", entityId)
        .eq("challenger_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingDispute) {
        toast({
          title: "Dispute already exists",
          description: "You already have a pending dispute for this profile.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create the dispute
      const { error } = await supabase
        .from("claim_disputes")
        .insert({
          entity_id: entityId,
          challenger_id: user.id,
          current_owner_id: currentOwnerId,
          challenger_reason: reason.trim(),
          challenger_evidence_urls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
        });

      if (error) throw error;

      toast({
        title: "Dispute submitted",
        description: "Your ownership claim has been filed. You can track progress in your dashboard.",
      });

      setReason("");
      setEvidenceUrl("");
      onClose();
    } catch (error: any) {
      console.error("Error submitting dispute:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setEvidenceUrl("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl bg-score-yellow/10 border border-score-yellow/20 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-7 h-7 text-score-yellow" />
          </div>
          <DialogTitle className="text-xl text-center">Dispute Ownership</DialogTitle>
          <DialogDescription className="text-center">
            This profile is already claimed. Submit a dispute if you believe you should be the owner.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Warning */}
          <div className="p-3 rounded-lg bg-score-yellow/10 border border-score-yellow/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-score-yellow shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Important</p>
                <p className="text-muted-foreground">
                  Filing a false claim may result in account restrictions. 
                  Only proceed if you have legitimate ownership rights to <strong>{entityName}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Why should you own this profile? <span className="text-destructive">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain your claim in detail. For example: I am the person/business represented by this profile, here's why..."
              className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none min-h-[120px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/1000 characters (minimum 50)
            </p>
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Evidence URL <span className="text-muted-foreground">(optional)</span>
              </div>
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://link-to-proof.com"
              className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link to documentation, official profile, or other proof of ownership
            </p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || reason.trim().length < 50}
            className="w-full py-3 rounded-xl bg-score-yellow hover:bg-score-yellow/90 text-black font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                Submit Dispute
              </>
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Both parties will be able to submit evidence. An admin will review and decide.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
