import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, Clock, CheckCircle, XCircle, 
  Upload, FileText, ChevronDown, ChevronUp, User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChallenger = currentUserId === dispute.challenger_id;
  const isOwner = currentUserId === dispute.current_owner_id;

  const getStatusConfig = () => {
    switch (dispute.status) {
      case "pending":
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

  const handleSubmitResponse = async () => {
    if (!response.trim() && !evidenceUrl.trim()) {
      toast({
        title: "Please provide a response",
        description: "Add a response or evidence URL to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: any = {};

      if (isOwner) {
        updates.owner_response = response.trim() || dispute.owner_response;
        if (evidenceUrl.trim()) {
          updates.owner_evidence_urls = [...dispute.owner_evidence_urls, evidenceUrl.trim()];
        }
      } else if (isChallenger && evidenceUrl.trim()) {
        updates.challenger_evidence_urls = [...dispute.challenger_evidence_urls, evidenceUrl.trim()];
      }

      const { error } = await supabase
        .from("claim_disputes")
        .update(updates)
        .eq("id", dispute.id);

      if (error) throw error;

      toast({
        title: "Response submitted",
        description: "Your response has been recorded.",
      });
      setEvidenceUrl("");
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
            View Details & Respond
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
            
            {dispute.challenger_evidence_urls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
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
            )}
          </div>

          {/* Owner's Response */}
          {(dispute.owner_response || isOwner) && (
            <div className="p-3 rounded-lg bg-background/50">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-score-green" />
                <span className="text-xs font-medium">
                  {isOwner ? "Your Response" : "Owner's Response"}
                </span>
              </div>
              
              {dispute.owner_response ? (
                <p className="text-sm text-foreground/90">{dispute.owner_response}</p>
              ) : isOwner && dispute.status === "pending" ? (
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Explain why you are the rightful owner of this profile..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm resize-none min-h-[80px]"
                  maxLength={500}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">No response yet</p>
              )}

              {dispute.owner_evidence_urls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
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
              )}
            </div>
          )}

          {/* Add Evidence (for pending disputes) */}
          {dispute.status === "pending" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Add Evidence (URL to document, screenshot, etc.)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm"
                />
                <button
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting || (!response.trim() && !evidenceUrl.trim())}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "..." : "Submit"}
                </button>
              </div>
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
            Filed {new Date(dispute.created_at).toLocaleDateString()}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
