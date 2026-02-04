import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Eye, EyeOff, Plus, X, Check, Loader2,
  Globe, Twitter, Linkedin, Instagram, Facebook, Youtube, 
  Mail, Phone, MapPin, Briefcase, GraduationCap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ProfileCustomizerProps {
  entityId: string;
  entityName: string;
  category: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  is_verified: boolean;
}

interface CustomField {
  key: string;
  label: string;
  value: string;
  visible: boolean;
}

const platformOptions = [
  { id: "website", label: "Website", icon: Globe },
  { id: "twitter", label: "Twitter/X", icon: Twitter },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "youtube", label: "YouTube", icon: Youtube },
];

const defaultFields: CustomField[] = [
  { key: "location", label: "Location", value: "", visible: true },
  { key: "occupation", label: "Occupation", value: "", visible: true },
  { key: "education", label: "Education", value: "", visible: true },
  { key: "phone", label: "Phone", value: "", visible: false },
];

const fieldIcons: Record<string, typeof Globe> = {
  location: MapPin,
  occupation: Briefcase,
  education: GraduationCap,
  phone: Phone,
};

export const ProfileCustomizer = ({ entityId, entityName, category }: ProfileCustomizerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>(defaultFields);
  const [about, setAbout] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchEntityData();
    fetchSocialLinks();
  }, [entityId]);

  const fetchEntityData = async () => {
    const { data } = await supabase
      .from("entities")
      .select("about, contact_email, metadata")
      .eq("id", entityId)
      .single();

    if (data) {
      setAbout(data.about || "");
      setContactEmail(data.contact_email || "");
      
      // Load custom fields from metadata
      if (data.metadata && typeof data.metadata === 'object') {
        const meta = data.metadata as Record<string, any>;
        if (meta.custom_fields) {
          setCustomFields(meta.custom_fields);
        }
      }
    }
  };

  const fetchSocialLinks = async () => {
    const { data } = await supabase
      .from("entity_social_links")
      .select("*")
      .eq("entity_id", entityId);
    
    if (data) {
      setSocialLinks(data);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save entity details - cast to Json compatible type
      const metadataPayload = { 
        custom_fields: customFields.map(f => ({ 
          key: f.key, 
          label: f.label, 
          value: f.value, 
          visible: f.visible 
        })) 
      };
      
      const { error } = await supabase
        .from("entities")
        .update({
          about,
          contact_email: contactEmail,
          metadata: metadataPayload as any,
        })
        .eq("id", entityId);

      if (error) throw error;

      toast({
        title: "Saved! ✨",
        description: "Your profile has been updated.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!newPlatform || !newUrl) return;

    try {
      const { error } = await supabase
        .from("entity_social_links")
        .insert({
          entity_id: entityId,
          platform: newPlatform,
          url: newUrl,
        });

      if (error) throw error;

      setNewPlatform("");
      setNewUrl("");
      fetchSocialLinks();
      toast({ title: "Link added!" });
    } catch (error) {
      toast({ title: "Failed to add link", variant: "destructive" });
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    try {
      await supabase
        .from("entity_social_links")
        .delete()
        .eq("id", linkId);
      
      fetchSocialLinks();
    } catch (error) {
      toast({ title: "Failed to remove link", variant: "destructive" });
    }
  };

  const toggleFieldVisibility = (key: string) => {
    setCustomFields(fields =>
      fields.map(f => f.key === key ? { ...f, visible: !f.visible } : f)
    );
  };

  const updateFieldValue = (key: string, value: string) => {
    setCustomFields(fields =>
      fields.map(f => f.key === key ? { ...f, value } : f)
    );
  };

  return (
    <GlassCard className="p-5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Customize Your Profile</h3>
            <p className="text-sm text-muted-foreground">Add info & choose what to show</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-muted-foreground"
        >
          <Plus className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
        </motion.div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 space-y-6"
        >
          {/* About Section */}
          <div>
            <Label className="text-sm font-medium mb-2 block">About / Bio</Label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder={`Tell people about this ${category.toLowerCase()}...`}
              className="w-full p-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 resize-none text-sm"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{about.length}/500</p>
          </div>

          {/* Contact Email */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Contact Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 text-sm"
              />
            </div>
          </div>

          {/* Custom Fields with Visibility Toggle */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Profile Fields</Label>
            <div className="space-y-3">
              {customFields.map((field) => {
                const FieldIcon = fieldIcons[field.key] || Globe;
                return (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <FieldIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateFieldValue(field.key, e.target.value)}
                        placeholder={field.label}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => toggleFieldVisibility(field.key)}
                      className={`p-2 rounded-lg transition-colors ${
                        field.visible 
                          ? 'bg-score-green/10 text-score-green' 
                          : 'bg-secondary/50 text-muted-foreground'
                      }`}
                      title={field.visible ? "Visible to everyone" : "Hidden from profile"}
                    >
                      {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click the eye icon to show/hide fields on your public profile
            </p>
          </div>

          {/* Social Links */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Social Links</Label>
            
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {socialLinks.map((link) => {
                  const platform = platformOptions.find(p => p.id === link.platform);
                  const Icon = platform?.icon || Globe;
                  return (
                    <div
                      key={link.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 border border-border group"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{link.platform}</span>
                      {link.is_verified && <Check className="w-3 h-3 text-score-green" />}
                      <button
                        onClick={() => handleRemoveLink(link.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="flex-1 p-2.5 rounded-xl bg-secondary/30 border border-border text-sm"
              >
                <option value="">Select platform...</option>
                {platformOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 p-2.5 rounded-xl bg-secondary/30 border border-border text-sm"
              />
              <button
                onClick={handleAddLink}
                disabled={!newPlatform || !newUrl}
                className="px-3 py-2.5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </motion.div>
      )}
    </GlassCard>
  );
};
