import { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { ClaimDisputeCard } from "./ClaimDisputeCard";

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

interface ClaimDisputesSectionProps {
  userId: string;
}

export const ClaimDisputesSection = ({ userId }: ClaimDisputesSectionProps) => {
  const [disputes, setDisputes] = useState<ClaimDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      // Fetch disputes where user is either challenger or owner
      const { data, error } = await supabase
        .from("claim_disputes")
        .select(`
          id,
          entity_id,
          challenger_id,
          current_owner_id,
          status,
          challenger_reason,
          challenger_evidence_urls,
          owner_response,
          owner_evidence_urls,
          admin_notes,
          created_at,
          response_deadline
        `)
        .or(`challenger_id.eq.${userId},current_owner_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch entity names for each dispute
      if (data && data.length > 0) {
        const entityIds = [...new Set(data.map(d => d.entity_id))];
        const { data: entities } = await supabase
          .from("entities")
          .select("id, name, category")
          .in("id", entityIds);

        const entityMap = new Map(entities?.map(e => [e.id, e]) || []);
        
        const disputesWithEntities = data.map(d => ({
          ...d,
          entity: entityMap.get(d.entity_id),
        }));

        setDisputes(disputesWithEntities);
      } else {
        setDisputes([]);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDisputes();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </GlassCard>
    );
  }

  if (disputes.length === 0) {
    return null; // Don't show section if no disputes
  }

  const pendingDisputes = disputes.filter(d => d.status === "pending");
  const resolvedDisputes = disputes.filter(d => d.status !== "pending");

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <ShieldAlert className="w-5 h-5 text-score-yellow" />
        <h2 className="text-lg font-bold">Profile Disputes</h2>
        {pendingDisputes.length > 0 && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-score-yellow/20 text-score-yellow text-xs font-medium">
            {pendingDisputes.length} pending
          </span>
        )}
      </div>

      {pendingDisputes.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-score-yellow/10 border border-score-yellow/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-score-yellow shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90">
              You have pending ownership disputes that require your attention. 
              Please review and provide evidence to support your claim.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {disputes.map(dispute => (
          <ClaimDisputeCard
            key={dispute.id}
            dispute={dispute}
            currentUserId={userId}
            onUpdate={fetchDisputes}
          />
        ))}
      </div>
    </GlassCard>
  );
};
