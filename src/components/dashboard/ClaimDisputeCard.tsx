import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, Clock, CheckCircle, XCircle, 
  Upload, FileText, ChevronDown, ChevronUp, User,
  Link as LinkIcon, Loader2, Timer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, differenceInHours, isPast } from "date-fns";

interface ClaimDispute {
  id: string;
  entity_id: string;
  challenger_id: string;
  current_owner_id: string;
  status: string;
  challenger_reason: string;
  challenger_evidence_urls: string[];
  owner_response: string | null;
  owner_evidence_urls: string[];
  admin_notes: string | null;
  created_at: string;
  response_deadline?: string;
  entity?: {
    name: string;
    category: string;
  };
}

interface ClaimDisputeCardProps {
  dispute: ClaimDispute;
  currentUserId: string;
  onUpdate: () => void;
}

export const ClaimDisputeCard = ({ dispute, currentUserId, onUpdate }: ClaimDisputeCardProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [response, setResponse] = useState(dispute.owner_response || "");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChallenger = currentUserId === dispute.challenger_id;
  const isOwner = currentUserId === dispute.current_owner_id;

  // Deadline calculations
  const deadline = dispute.response_deadline ? new Date(dispute.response_deadline) : null;
  const isExpired = deadline ? isPast(deadline) : false;
  const hoursRemaining = deadline ? differenceInHours(deadline, new Date()) : 48;

  const getStatusConfig = () => {
    switch (dispute.status) {
      case "pending":
        if (isExpired) {
          return { icon: Timer, color: "text-destructive", bg: "bg-destructive/10", label: "Deadline Passed" };
        }
        return { icon: Clock, color: "text-score-yellow", bg: "bg-score-yellow/10", label: "Pending Review" };
      case "challenger_wins":
        return { icon: CheckCircle, color: "text-score-green", bg: "bg-score-green/10", label: "Challenger Won" };
      case "owner_wins":
        return { icon: CheckCircle, color: "text-score-green", bg: "bg-score-green/10", label: "Owner Retained" };
      case "dismissed":
        return { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted/50", label: "Dismissed" };
      default:
        return { icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted/50", label: dispute.status };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

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

  const handleSubmitResponse = async () => {
    if (isOwner && !response.trim() && !evidenceUrls.some(u => u.trim())) {
      toast({
        title: "Please provide a response",
        description: "Add a response or evidence to continue.",
        variant: "destructive",
      });
      return;
    }

    if (isChallenger && !evidenceUrls.some(u => u.trim())) {
      toast({
        title: "Please add evidence",
        description: "Add at least one evidence URL.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const validEvidenceUrls = evidenceUrls.filter(url => url.trim());
      const updates: any = {};

      if (isOwner) {
        updates.owner_response = response.trim() || dispute.owner_response;
        if (validEvidenceUrls.length > 0) {
          updates.owner_evidence_urls = [...(dispute.owner_evidence_urls || []), ...validEvidenceUrls];
        }
      } else if (isChallenger && validEvidenceUrls.length > 0) {
        updates.challenger_evidence_urls = [...(dispute.challenger_evidence_urls || []), ...validEvidenceUrls];
      }

      const { error } = await supabase
        .from("claim_disputes")
        .update(updates)
        .eq("id", dispute.id);

      if (error) throw error;

      toast({
        title: "Response submitted! ✓",
        description: "Your evidence has been added to the dispute.",
      });
      setEvidenceUrls([""]);
      setResponse("");
      onUpdate();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-secondary/30 border border-border"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-score-yellow shrink-0" />
            <h3 className="font-medium truncate">
              {dispute.entity?.name || "Profile Dispute"}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {isChallenger ? "You are challenging this profile" : "Someone is challenging your ownership"}
          </p>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bg}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
          <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Deadline Timer */}
      {dispute.status === "pending" && deadline && (
        <div className={`mt-3 p-3 rounded-lg ${isExpired ? 'bg-destructive/10 border border-destructive/20' : 'bg-primary/10 border border-primary/20'}`}>
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${isExpired ? 'text-destructive' : 'text-primary'}`} />
            <div className="flex-1">
              <p className={`text-xs font-medium ${isExpired ? 'text-destructive' : 'text-primary'}`}>
                {isExpired ? 'Deadline Passed' : `${hoursRemaining}h remaining`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOwner ? 'Submit your response before deadline' : 'Owner must respond by'} {deadline.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expand/Collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-1 mt-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            View Details & {isOwner ? 'Respond' : 'Add Evidence'}
          </>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-border space-y-4"
        >
          {/* Challenger's Claim */}
          <div className="p-3 rounded-lg bg-background/50">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">
                {isChallenger ? "Your Claim" : "Challenger's Claim"}
              </span>
            </div>
            <p className="text-sm text-foreground/90">{dispute.challenger_reason}</p>
            
            {dispute.challenger_evidence_urls && dispute.challenger_evidence_urls.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Evidence submitted:</p>
                <div className="flex flex-wrap gap-2">
                  {dispute.challenger_evidence_urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      Evidence {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Owner's Response */}
          <div className="p-3 rounded-lg bg-background/50">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-score-green" />
              <span className="text-xs font-medium">
                {isOwner ? "Your Response" : "Owner's Response"}
              </span>
            </div>
            
            {dispute.owner_response ? (
              <>
                <p className="text-sm text-foreground/90">{dispute.owner_response}</p>
                {dispute.owner_evidence_urls && dispute.owner_evidence_urls.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Evidence submitted:</p>
                    <div className="flex flex-wrap gap-2">
                      {dispute.owner_evidence_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded bg-score-green/10 text-score-green text-xs hover:bg-score-green/20 transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          Evidence {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : isOwner && dispute.status === "pending" ? (
              <div className="space-y-3">
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Explain why you are the rightful owner. Include any relevant details about your identity or connection to this profile..."
                  className="min-h-[100px] resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">{response.length}/1000</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No response submitted yet</p>
            )}
          </div>

          {/* Add Evidence (for pending disputes) */}
          {dispute.status === "pending" && (
            <div className="p-4 rounded-lg bg-background/50 border border-dashed border-border">
              <label className="text-sm font-medium mb-3 block">
                {isOwner ? "Add Evidence to Your Response" : "Add More Evidence"}
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Link to official profiles, documents, screenshots, or any proof
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
                        placeholder="https://..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {evidenceUrls.length < 5 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addEvidenceField}
                  className="mt-2"
                >
                  <Upload className="w-3 h-3 mr-2" />
                  Add Another
                </Button>
              )}

              <Button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || (isOwner ? (!response.trim() && !evidenceUrls.some(u => u.trim())) : !evidenceUrls.some(u => u.trim()))}
                className="w-full mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit {isOwner ? 'Response' : 'Evidence'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Admin Notes */}
          {dispute.admin_notes && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">Admin Decision</span>
              </div>
              <p className="text-sm text-foreground/90">{dispute.admin_notes}</p>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground text-right">
            Filed {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
