import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Copy, Check, Code, ExternalLink, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface TrustBadgeWidgetProps {
  entityId: string;
  entityName: string;
  currentScore: number;
}

interface StyleConfig {
  theme: "dark" | "light";
  size: "small" | "medium" | "large";
}

interface WidgetToken {
  id: string;
  token: string;
  style_config: StyleConfig;
  domains: string[];
  impression_count: number;
}

export const TrustBadgeWidget = ({ entityId, entityName, currentScore }: TrustBadgeWidgetProps) => {
  const { toast } = useToast();
  const [widget, setWidget] = useState<WidgetToken | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [domains, setDomains] = useState("");

  useEffect(() => {
    fetchWidget();
  }, [entityId]);

  const fetchWidget = async () => {
    const { data } = await supabase
      .from("widget_tokens")
      .select("*")
      .eq("entity_id", entityId)
      .eq("is_active", true)
      .single();

    if (data) {
      const styleConfig = data.style_config as unknown as StyleConfig | null;
      const widgetData: WidgetToken = {
        ...data,
        style_config: styleConfig || { theme: "dark", size: "medium" },
      };
      setWidget(widgetData);
      setTheme(styleConfig?.theme || "dark");
      setSize(styleConfig?.size || "medium");
      setDomains((data.domains || []).join(", "));
    }
  };

  const createWidget = async () => {
    setIsCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      setIsCreating(false);
      return;
    }

    const token = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    const domainList = domains.split(",").map(d => d.trim()).filter(Boolean);

    const { data, error } = await supabase
      .from("widget_tokens")
      .insert({
        entity_id: entityId,
        created_by: user.id,
        token,
        style_config: { theme, size },
        domains: domainList,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating widget", description: error.message, variant: "destructive" });
    } else if (data) {
      const styleConfig = data.style_config as unknown as StyleConfig | null;
      setWidget({
        ...data,
        style_config: styleConfig || { theme: "dark", size: "medium" },
      });
      toast({ title: "Widget created!", description: "Copy the embed code to your website." });
    }

    setIsCreating(false);
  };

  const updateWidget = async () => {
    if (!widget) return;

    const domainList = domains.split(",").map(d => d.trim()).filter(Boolean);

    await supabase
      .from("widget_tokens")
      .update({
        style_config: { theme, size },
        domains: domainList,
      })
      .eq("id", widget.id);

    toast({ title: "Widget updated!" });
  };

  const getEmbedCode = () => {
    if (!widget) return "";
    
    const baseUrl = window.location.origin;
    return `<!-- MAI Trust Badge -->
<div id="mai-trust-badge" data-token="${widget.token}"></div>
<script src="${baseUrl}/widget.js" async></script>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPreviewClasses = () => {
    const sizeClasses = {
      small: "w-24 h-8 text-xs",
      medium: "w-32 h-10 text-sm",
      large: "w-40 h-12 text-base",
    };

    const themeClasses = {
      dark: "bg-black/90 text-white border-white/20",
      light: "bg-white text-black border-black/20",
    };

    return `${sizeClasses[size]} ${themeClasses[theme]}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 86) return theme === "dark" ? "#a855f7" : "#7c3aed";
    if (score >= 61) return theme === "dark" ? "#22c55e" : "#16a34a";
    if (score >= 40) return theme === "dark" ? "#eab308" : "#ca8a04";
    return theme === "dark" ? "#ef4444" : "#dc2626";
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Embeddable Trust Badge</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Add a live trust score badge to your website to show visitors your verified reputation.
      </p>

      {/* Preview */}
      <div className="mb-6">
        <Label className="text-sm mb-2 block">Preview</Label>
        <div className="p-6 bg-secondary/20 rounded-xl flex items-center justify-center">
          <motion.div
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${getPreviewClasses()}`}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            key={`${theme}-${size}`}
          >
            <div 
              className="font-bold"
              style={{ color: getScoreColor(currentScore) }}
            >
              {currentScore}
            </div>
            <div className="flex-1 truncate text-xs opacity-80">
              MAI Verified
            </div>
            <Shield className="w-4 h-4 opacity-60" />
          </motion.div>
        </div>
      </div>

      {/* Customization */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Label className="text-sm mb-2 block">Theme</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-colors ${
                theme === "dark" 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-secondary/50 border-border hover:border-primary/50"
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-colors ${
                theme === "light" 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-secondary/50 border-border hover:border-primary/50"
              }`}
            >
              Light
            </button>
          </div>
        </div>

        <div>
          <Label className="text-sm mb-2 block">Size</Label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as "small" | "medium" | "large")}
            className="w-full py-2 px-3 rounded-lg bg-secondary/50 border border-border text-sm"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <Label className="text-sm mb-2 block">Allowed Domains (optional)</Label>
        <Input
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          placeholder="example.com, sub.example.com"
          className="bg-secondary/30"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty to allow all domains, or specify allowed domains separated by commas.
        </p>
      </div>

      {widget ? (
        <>
          {/* Embed Code */}
          <div className="mb-4">
            <Label className="text-sm mb-2 block flex items-center gap-2">
              <Code className="w-4 h-4" />
              Embed Code
            </Label>
            <div className="relative">
              <pre className="bg-secondary/50 rounded-lg p-4 text-xs overflow-x-auto">
                {getEmbedCode()}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-2 bg-background/80 rounded-lg hover:bg-background transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-score-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <span>Impressions: {widget.impression_count.toLocaleString()}</span>
            <a
              href={`${window.location.origin}/widget-preview?token=${widget.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Test Widget
            </a>
          </div>

          <Button onClick={updateWidget} variant="outline" className="w-full">
            <Palette className="w-4 h-4 mr-2" />
            Update Widget Style
          </Button>
        </>
      ) : (
        <Button onClick={createWidget} disabled={isCreating} className="w-full">
          {isCreating ? "Creating..." : "Create Widget"}
        </Button>
      )}
    </GlassCard>
  );
};
