import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, UserCheck, Link2, Copy, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";

interface MutualVerificationProps {
  entityId: string;
  entityName: string;
  isOwner: boolean;
  onAuthRequired: () => void;
}

interface VerificationRequest {
  id: string;
  requester_entity_id: string;
  target_entity_id: string;
  verification_code: string;
  status: string;
  created_at: string;
}

export const MutualVerification = ({
  entityId,
  entityName,
  isOwner,
  onAuthRequired,
}: MutualVerificationProps) => {
  const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOwner) {
      fetchVerificationData();
    }
  }, [entityId, isOwner]);

  const fetchVerificationData = async () => {
    // Get pending incoming requests
    const { data: incoming } = await supabase
      .from("profile_verifications")
      .select("*")
      .eq("target_entity_id", entityId)
      .eq("status", "pending");

    if (incoming) {
      setPendingRequests(incoming);
    }

    // Check if we have an outgoing verification code
    const { data: outgoing } = await supabase
      .from("profile_verifications")
      .select("verification_code")
      .eq("requester_entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (outgoing?.verification_code) {
      setMyCode(outgoing.verification_code);
    }
  };

  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateVerificationRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onAuthRequired();
      return;
    }

    setIsLoading(true);
    const code = generateVerificationCode();

    try {
      // For demo, we'll create a self-reference (in real app, user would select target entity)
      const { error } = await supabase
        .from("profile_verifications")
        .insert({
          requester_entity_id: entityId,
          target_entity_id: entityId, // Would be different in real implementation
          verification_code: code,
        });

      if (error) throw error;

      setMyCode(code);
      toast({
        title: "Verification code created!",
        description: "Share this code with the other profile owner.",
      });
    } catch (error) {
      console.error("Error creating verification:", error);
      toast({
        title: "Error",
        description: "Failed to create verification code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!inputCode.trim()) return;

    setIsLoading(true);

    try {
      // Find matching verification request
      const { data: verification, error } = await supabase
        .from("profile_verifications")
        .select("*")
        .eq("verification_code", inputCode.toUpperCase())
        .eq("target_entity_id", entityId)
        .eq("status", "pending")
        .single();

      if (error || !verification) {
        toast({
          title: "Invalid code",
          description: "This verification code is invalid or expired.",
          variant: "destructive",
        });
        return;
      }

      // Update to verified
      await supabase
        .from("profile_verifications")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("id", verification.id);

      toast({
        title: "Verification successful!",
        description: "The profiles are now mutually verified.",
      });

      setInputCode("");
      fetchVerificationData();
    } catch (error) {
      console.error("Error verifying:", error);
      toast({
        title: "Error",
        description: "Failed to verify code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (myCode) {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      toast({
        title: "Code copied!",
        description: "Share this code with the other profile owner.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOwner) return null;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Mutual Verification</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Verify your connection with another profile by exchanging verification codes.
      </p>

      {/* My Verification Code */}
      {myCode ? (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Your verification code</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold text-primary flex-1">{myCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-score-green" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this code with the other profile owner to verify your connection.
          </p>
        </div>
      ) : (
        <button
          onClick={handleCreateVerificationRequest}
          disabled={isLoading}
          className="w-full btn-glass mb-4 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              Generate Verification Code
            </>
          )}
        </button>
      )}

      {/* Enter Someone's Code */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Enter someone's code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="flex-1 p-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 font-mono text-center uppercase"
          />
          <button
            onClick={handleVerifyCode}
            disabled={!inputCode.trim() || isLoading}
            className="btn-neon px-4 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-medium mb-2">Pending Verifications ({pendingRequests.length})</p>
          {pendingRequests.map((req) => (
            <motion.div
              key={req.id}
              className="p-3 rounded-xl bg-secondary/30 border border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm">
                Code: <span className="font-mono font-bold">{req.verification_code}</span>
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
