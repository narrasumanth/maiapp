import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Plus, Copy, Check, Trash2, Clock, Activity, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit_per_hour: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setApiKeys(data);
    }
    setIsLoading(false);
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'mai_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const hashKey = async (key: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsCreating(true);

    try {
      const newKey = generateApiKey();
      const keyHash = await hashKey(newKey);
      const keyPrefix = newKey.substring(0, 8);

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key_hash: keyHash,
          key_prefix: keyPrefix,
          permissions: ["read"],
          rate_limit_per_hour: 100,
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys([data, ...apiKeys]);
      setNewKeyVisible(newKey);
      setNewKeyName("");

      toast({
        title: "API key created",
        description: "Make sure to copy your key now. You won't be able to see it again!",
      });
    } catch (error) {
      console.error("Error creating API key:", error);
      toast({
        title: "Error",
        description: "Failed to create API key.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard.",
    });
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId);

      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      toast({
        title: "Key deleted",
        description: "API key has been revoked.",
      });
    } catch (error) {
      console.error("Error deleting key:", error);
    }
  };

  const handleToggleActive = async (key: ApiKey) => {
    try {
      await supabase
        .from("api_keys")
        .update({ is_active: !key.is_active })
        .eq("id", key.id);

      setApiKeys(apiKeys.map(k => 
        k.id === key.id ? { ...k, is_active: !k.is_active } : k
      ));
    } catch (error) {
      console.error("Error toggling key:", error);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="fixed inset-0 grid-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-neon-gradient flex items-center justify-center">
              <Key className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">API Keys</h1>
              <p className="text-muted-foreground">Manage your API access for external integrations</p>
            </div>
          </div>

          {/* Create New Key */}
          <GlassCard className="p-6 mb-8">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New API Key
            </h2>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., Production App)"
                className="flex-1 px-4 py-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 focus:outline-none transition-colors"
              />
              <button
                onClick={handleCreateKey}
                disabled={isCreating}
                className="btn-neon px-6"
              >
                {isCreating ? "Creating..." : "Create Key"}
              </button>
            </div>

            {/* Newly created key display */}
            {newKeyVisible && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-score-green/10 border border-score-green/20"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-score-yellow shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-score-green mb-2">
                      Your new API key (copy it now - you won't see it again!)
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-3 rounded-lg bg-secondary/50 font-mono text-sm break-all">
                        {newKeyVisible}
                      </code>
                      <button
                        onClick={() => handleCopyKey(newKeyVisible)}
                        className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors shrink-0"
                      >
                        {copiedId === newKeyVisible ? (
                          <Check className="w-5 h-5 text-score-green" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => setNewKeyVisible(null)}
                      className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                    >
                      I've copied it, hide the key
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </GlassCard>

          {/* API Documentation */}
          <GlassCard className="p-6 mb-8">
            <h2 className="font-semibold mb-4">API Endpoints</h2>
            <div className="space-y-3 text-sm font-mono">
              <div className="p-3 rounded-lg bg-secondary/30">
                <span className="text-score-green">GET</span> /public-api/score/:name
                <span className="text-muted-foreground ml-2">- Get trust score</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <span className="text-score-green">GET</span> /public-api/entity/:id
                <span className="text-muted-foreground ml-2">- Get entity details</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <span className="text-score-green">GET</span> /public-api/search?q=query
                <span className="text-muted-foreground ml-2">- Search entities</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <span className="text-primary">POST</span> /public-api/verify
                <span className="text-muted-foreground ml-2">- Verify private link</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Include your API key in the <code className="px-1 py-0.5 rounded bg-secondary">x-api-key</code> header.
            </p>
          </GlassCard>

          {/* Existing Keys */}
          <GlassCard className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Your API Keys ({apiKeys.length})
            </h2>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading keys...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No API keys yet. Create one above to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <motion.div
                    key={key.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${
                      key.is_active 
                        ? "border-white/10 bg-secondary/20" 
                        : "border-score-red/20 bg-score-red/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{key.name}</h3>
                          {!key.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-score-red/20 text-score-red">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{key.key_prefix}...****</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                          </span>
                          {key.last_used_at && (
                            <span>
                              Last used {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                            {key.rate_limit_per_hour} req/hr
                          </span>
                          {key.permissions.map(perm => (
                            <span key={perm} className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(key)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            key.is_active
                              ? "bg-score-yellow/10 text-score-yellow hover:bg-score-yellow/20"
                              : "bg-score-green/10 text-score-green hover:bg-score-green/20"
                          }`}
                        >
                          {key.is_active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-2 rounded-lg bg-score-red/10 text-score-red hover:bg-score-red/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ApiKeysPage;
