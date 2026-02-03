import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Globe, Twitter, Linkedin, Instagram, Facebook, Youtube, 
  Mail, Phone, MapPin, ExternalLink, Plus, Edit2, Check, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { getCategoryConfig, platformIcons } from "./CategoryLayout";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  is_verified: boolean;
}

interface AboutSectionProps {
  entityId: string;
  entityName: string;
  category: string;
  about?: string;
  contactEmail?: string;
  websiteUrl?: string;
  isOwner: boolean;
  onAuthRequired: () => void;
}

const socialIconMap: Record<string, typeof Globe> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  website: Globe,
};

export const AboutSection = ({
  entityId,
  entityName,
  category,
  about,
  contactEmail,
  websiteUrl,
  isOwner,
  onAuthRequired,
}: AboutSectionProps) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editAbout, setEditAbout] = useState(about || "");
  const [editEmail, setEditEmail] = useState(contactEmail || "");
  const [editWebsite, setEditWebsite] = useState(websiteUrl || "");
  const [newLinkPlatform, setNewLinkPlatform] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const config = getCategoryConfig(category);

  useEffect(() => {
    fetchSocialLinks();
  }, [entityId]);

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
    await supabase
      .from("entities")
      .update({
        about: editAbout,
        contact_email: editEmail,
        website_url: editWebsite,
      })
      .eq("id", entityId);
    
    setIsEditing(false);
  };

  const handleAddLink = async () => {
    if (!newLinkPlatform || !newLinkUrl) return;

    await supabase
      .from("entity_social_links")
      .insert({
        entity_id: entityId,
        platform: newLinkPlatform,
        url: newLinkUrl,
      });
    
    setNewLinkPlatform("");
    setNewLinkUrl("");
    fetchSocialLinks();
  };

  const handleRemoveLink = async (linkId: string) => {
    await supabase
      .from("entity_social_links")
      .delete()
      .eq("id", linkId);
    
    fetchSocialLinks();
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">About</h3>
        {isOwner && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isEditing ? "Cancel" : "Edit"}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description</label>
            <textarea
              value={editAbout}
              onChange={(e) => setEditAbout(e.target.value)}
              className="w-full p-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50 resize-none"
              rows={4}
              placeholder={`Tell people about this ${category.toLowerCase()}...`}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Contact Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50"
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Website</label>
            <input
              type="url"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
              className="w-full p-3 rounded-xl bg-secondary/30 border border-white/10 focus:border-primary/50"
              placeholder="https://example.com"
            />
          </div>

          <button
            onClick={handleSave}
            className="btn-neon w-full flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      ) : (
        <>
          {about ? (
            <p className="text-muted-foreground mb-4 leading-relaxed">{about}</p>
          ) : (
            <p className="text-muted-foreground/50 mb-4 italic">
              No description available. {isOwner ? "Click edit to add one." : ""}
            </p>
          )}

          {/* Contact Info */}
          {(contactEmail || websiteUrl) && (
            <div className="space-y-2 mb-4">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {contactEmail}
                </a>
              )}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  {websiteUrl.replace(/^https?:\/\//, "")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium mb-3">Links</h4>
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link) => {
              const Icon = socialIconMap[link.platform] || Globe;
              return (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm capitalize">{link.platform}</span>
                  {link.is_verified && (
                    <Check className="w-3 h-3 text-score-green" />
                  )}
                  {isOwner && isEditing && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveLink(link.id);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-score-red flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </motion.a>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Link (Owner Only) */}
      {isOwner && isEditing && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium mb-2">Add Link</h4>
          <div className="flex gap-2">
            <select
              value={newLinkPlatform}
              onChange={(e) => setNewLinkPlatform(e.target.value)}
              className="flex-1 p-2 rounded-lg bg-secondary/30 border border-white/10 text-sm"
            >
              <option value="">Select platform...</option>
              {config.platforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
            <input
              type="url"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 p-2 rounded-lg bg-secondary/30 border border-white/10 text-sm"
            />
            <button
              onClick={handleAddLink}
              disabled={!newLinkPlatform || !newLinkUrl}
              className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Claim CTA */}
      {!isOwner && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onAuthRequired}
            className="w-full text-sm text-primary hover:underline"
          >
            Is this you? Claim this profile →
          </button>
        </div>
      )}
    </GlassCard>
  );
};
