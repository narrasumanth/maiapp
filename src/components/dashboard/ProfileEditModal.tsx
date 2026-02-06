import { useState, useEffect } from "react";
import { X, Save, Loader2, Globe, Mail, FileText, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: {
    id: string;
    name: string;
    category: string;
    about?: string | null;
    contact_email?: string | null;
    website_url?: string | null;
    image_url?: string | null;
  } | null;
  onSave: () => void;
}

export const ProfileEditModal = ({ isOpen, onClose, entity, onSave }: ProfileEditModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    about: "",
    contact_email: "",
    website_url: "",
    image_url: "",
  });

  useEffect(() => {
    if (entity) {
      setFormData({
        about: entity.about || "",
        contact_email: entity.contact_email || "",
        website_url: entity.website_url || "",
        image_url: entity.image_url || "",
      });
    }
  }, [entity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("entities")
        .update({
          about: formData.about.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          website_url: formData.website_url.trim() || null,
          image_url: formData.image_url.trim() || null,
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
      <DialogContent className="sm:max-w-lg">
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
            </label>
            <textarea
              placeholder="Tell people about this profile..."
              value={formData.about}
              onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {formData.about.length}/500
            </p>
          </div>

          {/* Contact Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Contact Email
            </label>
            <input
              type="email"
              placeholder="contact@example.com"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Website
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Profile Image URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              Profile Image URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
            />
            {formData.image_url && (
              <div className="mt-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
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
