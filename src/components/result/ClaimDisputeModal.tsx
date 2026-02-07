import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShieldAlert, AlertTriangle, FileText, Loader2, Clock, Upload,
  Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addEvidenceField = () => {
    if (evidenceUrls.length < 5) {
      setEvidenceUrls([...evidenceUrls, ""]);
    }
  };

  const updateEvidenceUrl = (index: number, value: string) => {
    const updated = [...evidenceUrls];
    updated[index] = value;
    setEvidenceUrls(updated);
  };

  const removeEvidenceUrl = (index: number) => {
    if (evidenceUrls.length > 1) {
      setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
    }
  };

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

      // Calculate 48-hour deadline
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 48);

      // Filter out empty evidence URLs
      const validEvidenceUrls = evidenceUrls.filter(url => url.trim());

      // Create the dispute with deadline
      const { data: newDispute, error } = await supabase
        .from("claim_disputes")
        .insert({
          entity_id: entityId,
          challenger_id: user.id,
          current_owner_id: currentOwnerId,
          challenger_reason: reason.trim(),
          challenger_evidence_urls: validEvidenceUrls,
          response_deadline: deadline.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Get challenger's profile for email
      const { data: challengerProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      // Get owner's email
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", currentOwnerId)
        .single();

      // Send email to challenger (confirmation)
      supabase.functions.invoke("send-dispute-email", {
        body: {
          type: "dispute_created",
          recipientEmail: user.email,
          recipientName: challengerProfile?.display_name,
          entityName,
          disputeId: newDispute.id,
          isChallenger: true,
          deadline: deadline.toISOString(),
        },
      }).catch(err => console.error("Failed to send challenger email:", err));

      // Create notification for owner
      await supabase.from("notifications").insert({
        user_id: currentOwnerId,
        type: "dispute_received",
        title: "⚠️ Profile Dispute Alert",
        message: `Someone is disputing your ownership of "${entityName}". You have 48 hours to respond with evidence.`,
      });

      toast({
        title: "Dispute submitted! ⚖️",
        description: "The owner has 48 hours to respond. Track progress in your dashboard.",
      });

      setReason("");
      setEvidenceUrls([""]);
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
    setEvidenceUrls([""]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl bg-score-yellow/10 border border-score-yellow/20 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-7 h-7 text-score-yellow" />
          </div>
          <DialogTitle className="text-xl text-center">Dispute Ownership</DialogTitle>
          <DialogDescription className="text-center">
            Contest ownership of <strong>{entityName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* 48 Hour Notice */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">48-Hour Response Window</p>
                <p className="text-xs text-muted-foreground">
                  The current owner will have 48 hours to submit their evidence. An admin will review both sides.
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 rounded-lg bg-score-yellow/10 border border-score-yellow/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-score-yellow shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Important</p>
                <p className="text-muted-foreground">
                  Filing a false claim may result in account restrictions. 
                  Only proceed if you have legitimate ownership rights.
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Why should you own this profile? <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="I am the person/business represented by this profile because..."
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/1000 characters (minimum 50)
            </p>
          </div>

          {/* Evidence URLs */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Evidence Links <span className="text-muted-foreground">(optional but recommended)</span>
              </div>
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Link to official profiles, documents, IDs, or any proof of ownership
            </p>
            
            <div className="space-y-2">
              {evidenceUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => updateEvidenceUrl(index, e.target.value)}
                      placeholder="https://linkedin.com/in/your-profile"
                      className="pl-10"
                    />
                  </div>
                  {evidenceUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEvidenceUrl(index)}
                      className="shrink-0"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {evidenceUrls.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEvidenceField}
                className="mt-2"
              >
                <Upload className="w-3 h-3 mr-2" />
                Add Another Link
              </Button>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || reason.trim().length < 50}
            className="w-full bg-score-yellow hover:bg-score-yellow/90 text-black"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 mr-2" />
                Submit Dispute
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Both parties will receive email notifications. Admin will review within 48-72 hours.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
