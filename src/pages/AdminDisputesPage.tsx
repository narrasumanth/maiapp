import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ShieldAlert, ArrowLeft, Clock, CheckCircle, XCircle, 
  User, FileText, ExternalLink, Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";

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
  challenger_profile?: {
    display_name: string | null;
  };
  owner_profile?: {
    display_name: string | null;
  };
}

const AdminDisputesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [disputes, setDisputes] = useState<ClaimDispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<ClaimDispute | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    // Check admin role
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await fetchDisputes();
  };

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("claim_disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch entity names
        const entityIds = [...new Set(data.map(d => d.entity_id))];
        const { data: entities } = await supabase
          .from("entities")
          .select("id, name, category")
          .in("id", entityIds);
        const entityMap = new Map(entities?.map(e => [e.id, e]) || []);

        // Fetch profile names
        const userIds = [...new Set([...data.map(d => d.challenger_id), ...data.map(d => d.current_owner_id)])];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const disputesWithData = data.map(d => ({
          ...d,
          entity: entityMap.get(d.entity_id),
          challenger_profile: profileMap.get(d.challenger_id),
          owner_profile: profileMap.get(d.current_owner_id),
        }));

        setDisputes(disputesWithData);
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (decision: "challenger_wins" | "owner_wins" | "dismissed") => {
    if (!selectedDispute) return;

    if (!adminNotes.trim()) {
      toast({
        title: "Please add notes",
        description: "Provide reasoning for your decision.",
        variant: "destructive",
      });
      return;
    }

    setIsResolving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update dispute status
      const { error: disputeError } = await supabase
        .from("claim_disputes")
        .update({
          status: decision,
          admin_notes: adminNotes.trim(),
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", selectedDispute.id);

      if (disputeError) throw disputeError;

      // If challenger wins, transfer ownership
      if (decision === "challenger_wins") {
        const { error: entityError } = await supabase
          .from("entities")
          .update({
            claimed_by: selectedDispute.challenger_id,
          })
          .eq("id", selectedDispute.entity_id);

        if (entityError) throw entityError;
      }

      toast({
        title: "Dispute resolved",
        description: `The dispute has been marked as ${decision.replace("_", " ")}.`,
      });

      setSelectedDispute(null);
      setAdminNotes("");
      await fetchDisputes();
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute.",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingDisputes = disputes.filter(d => d.status === "pending");
  const resolvedDisputes = disputes.filter(d => d.status !== "pending");

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-score-yellow/10 border border-score-yellow/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-score-yellow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Claim Disputes</h1>
            <p className="text-muted-foreground">Review and resolve profile ownership disputes</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending Disputes */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-score-yellow" />
                Pending ({pendingDisputes.length})
              </h2>

              {pendingDisputes.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-score-green mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No pending disputes</p>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {pendingDisputes.map(dispute => (
                    <GlassCard
                      key={dispute.id}
                      className={`p-5 cursor-pointer transition-all ${
                        selectedDispute?.id === dispute.id 
                          ? "ring-2 ring-primary" 
                          : "hover:border-primary/30"
                      }`}
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setAdminNotes("");
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium mb-1">{dispute.entity?.name || "Unknown"}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {dispute.challenger_profile?.display_name || "User"} vs{" "}
                            {dispute.owner_profile?.display_name || "Owner"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Filed {new Date(dispute.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-score-yellow/20 text-score-yellow text-xs font-medium">
                          Pending
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Dispute Detail */}
            {selectedDispute && (
              <GlassCard className="p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  Review: {selectedDispute.entity?.name}
                </h3>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  {/* Challenger */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Challenger</span>
                    </div>
                    <p className="text-sm text-foreground/90 mb-3">
                      {selectedDispute.challenger_reason}
                    </p>
                    {selectedDispute.challenger_evidence_urls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedDispute.challenger_evidence_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs hover:bg-primary/20"
                          >
                            <FileText className="w-3 h-3" />
                            Evidence {i + 1}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Current Owner */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-score-green" />
                      <span className="font-medium text-sm">Current Owner</span>
                    </div>
                    {selectedDispute.owner_response ? (
                      <>
                        <p className="text-sm text-foreground/90 mb-3">
                          {selectedDispute.owner_response}
                        </p>
                        {selectedDispute.owner_evidence_urls.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedDispute.owner_evidence_urls.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded bg-score-green/10 text-score-green text-xs hover:bg-score-green/20"
                              >
                                <FileText className="w-3 h-3" />
                                Evidence {i + 1}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No response submitted yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Admin Notes / Reasoning
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Explain your decision..."
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm resize-none min-h-[80px]"
                  />
                </div>

                {/* Decision Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleResolve("challenger_wins")}
                    disabled={isResolving}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Award to Challenger
                  </button>
                  <button
                    onClick={() => handleResolve("owner_wins")}
                    disabled={isResolving}
                    className="flex-1 py-2.5 rounded-xl bg-score-green text-white font-medium hover:bg-score-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                    Keep Owner
                  </button>
                  <button
                    onClick={() => handleResolve("dismissed")}
                    disabled={isResolving}
                    className="py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss
                  </button>
                </div>
              </GlassCard>
            )}

            {/* Resolved Disputes */}
            {resolvedDisputes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                  Resolved ({resolvedDisputes.length})
                </h2>

                <div className="space-y-3">
                  {resolvedDisputes.map(dispute => (
                    <GlassCard key={dispute.id} className="p-4 opacity-70">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-sm">{dispute.entity?.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {dispute.status.replace("_", " ")} • {new Date(dispute.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          dispute.status === "challenger_wins" 
                            ? "bg-primary/20 text-primary" 
                            : dispute.status === "owner_wins"
                            ? "bg-score-green/20 text-score-green"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {dispute.status.replace("_", " ")}
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDisputesPage;
