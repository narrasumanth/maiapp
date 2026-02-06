import { useState, useEffect } from "react";
import { Save, Loader2, Globe, Mail, FileText, Phone, MapPin, Link2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SocialLink {
  platform: string;
  url: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: {
    id: string;
    name: string;
    category: string;
    about?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    website_url?: string | null;
    location?: string | null;
    social_links?: SocialLink[] | null;
  } | null;
  onSave: () => void;
}

const SOCIAL_PLATFORMS = [
  { value: "linkedin", label: "LinkedIn", icon: "🔗" },
  { value: "twitter", label: "X (Twitter)", icon: "𝕏" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "github", label: "GitHub", icon: "💻" },
  { value: "other", label: "Other", icon: "🌐" },
];

const MAX_ABOUT_LENGTH = 2000;
const MAX_SOCIAL_LINKS = 3;

export const ProfileEditModal = ({ isOpen, onClose, entity, onSave }: ProfileEditModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    about: "",
    contact_email: "",
    contact_phone: "",
    website_url: "",
    location: "",
  });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    if (entity) {
      setFormData({
        about: entity.about || "",
        contact_email: entity.contact_email || "",
        contact_phone: entity.contact_phone || "",
        website_url: entity.website_url || "",
        location: entity.location || "",
      });
      setSocialLinks(entity.social_links || []);
    }
  }, [entity]);

  const handleAddSocialLink = () => {
    if (socialLinks.length >= MAX_SOCIAL_LINKS) {
      toast({
        title: "Limit reached",
        description: `Maximum ${MAX_SOCIAL_LINKS} social links allowed`,
        variant: "destructive",
      });
      return;
    }
    setSocialLinks([...socialLinks, { platform: "linkedin", url: "" }]);
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSocialLinkChange = (index: number, field: "platform" | "url", value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity) return;

    // Validate social links
    const validSocialLinks = socialLinks.filter(link => link.url.trim() !== "");

    setIsLoading(true);
    try {
      // Cast social links to JSON-compatible format
      const socialLinksJson = validSocialLinks.length > 0 
        ? validSocialLinks.map(link => ({ platform: link.platform, url: link.url }))
        : null;

      const { error } = await supabase
        .from("entities")
        .update({
          about: formData.about.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          website_url: formData.website_url.trim() || null,
          location: formData.location.trim() || null,
          social_links: socialLinksJson,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entity.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      });
      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!entity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Profile: {entity.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* About */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              About
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Tell people about this profile... Share your story, achievements, or what makes you unique."
              value={formData.about}
              onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none"
              rows={5}
              maxLength={MAX_ABOUT_LENGTH}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {formData.about.length}/{MAX_ABOUT_LENGTH}
            </p>
          </div>

          {/* Contact Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Contact Email
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="email"
              placeholder="contact@example.com"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Contact Number
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.contact_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Location
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="San Francisco, CA"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Website
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Social Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                Social Links
                <span className="text-xs text-muted-foreground font-normal">(max {MAX_SOCIAL_LINKS})</span>
              </label>
              {socialLinks.length < MAX_SOCIAL_LINKS && (
                <button
                  type="button"
                  onClick={handleAddSocialLink}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Link
                </button>
              )}
            </div>

            <div className="space-y-3">
              {socialLinks.map((link, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    value={link.platform}
                    onChange={(e) => handleSocialLinkChange(index, "platform", e.target.value)}
                    className="w-32 px-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 text-sm text-foreground"
                  >
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.icon} {platform.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => handleSocialLinkChange(index, "url", e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialLink(index)}
                    className="p-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {socialLinks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 bg-secondary/20 rounded-lg">
                  No social links added. Click "Add Link" to add up to {MAX_SOCIAL_LINKS} links.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-foreground font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
