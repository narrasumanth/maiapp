import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Globe, Mail, Phone, MapPin, ExternalLink, Edit2, Check, X,
  Linkedin, Twitter, Instagram, Facebook, Youtube, Github
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";

interface SocialLink {
  platform: string;
  url: string;
}

interface AboutSectionProps {
  entityId: string;
  entityName: string;
  category: string;
  about?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  location?: string;
  socialLinks?: SocialLink[];
  isOwner: boolean;
  onAuthRequired: () => void;
}

const socialIconMap: Record<string, typeof Globe> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  github: Github,
  tiktok: Globe, // No TikTok icon in lucide
  other: Globe,
  website: Globe,
};

const getPlatformLabel = (platform: string) => {
  const labels: Record<string, string> = {
    twitter: "X (Twitter)",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    github: "GitHub",
    tiktok: "TikTok",
    other: "Link",
  };
  return labels[platform] || platform;
};

export const AboutSection = ({
  entityId,
  entityName,
  category,
  about,
  contactEmail,
  contactPhone,
  websiteUrl,
  location,
  socialLinks = [],
  isOwner,
  onAuthRequired,
}: AboutSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editAbout, setEditAbout] = useState(about || "");
  const [editEmail, setEditEmail] = useState(contactEmail || "");
  const [editPhone, setEditPhone] = useState(contactPhone || "");
  const [editWebsite, setEditWebsite] = useState(websiteUrl || "");
  const [editLocation, setEditLocation] = useState(location || "");

  const handleSave = async () => {
    await supabase
      .from("entities")
      .update({
        about: editAbout.trim() || null,
        contact_email: editEmail.trim() || null,
        contact_phone: editPhone.trim() || null,
        website_url: editWebsite.trim() || null,
        location: editLocation.trim() || null,
      })
      .eq("id", entityId);
    
    setIsEditing(false);
  };

  const hasContactInfo = contactEmail || contactPhone || websiteUrl || location;
  const hasSocialLinks = socialLinks && socialLinks.length > 0;

  return (
    <GlassCard className="p-5">
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
              className="w-full p-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 resize-none text-foreground"
              rows={4}
              maxLength={2000}
              placeholder={`Tell people about this ${category.toLowerCase()}...`}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {editAbout.length}/2000
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 text-foreground"
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Phone</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 text-foreground"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Website</label>
              <input
                type="url"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 text-foreground"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Location</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/30 border border-border focus:border-primary/50 text-foreground"
                placeholder="San Francisco, CA"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      ) : (
        <>
          {/* About Text */}
          {about ? (
            <p className="text-muted-foreground mb-4 leading-relaxed whitespace-pre-wrap">{about}</p>
          ) : (
            <p className="text-muted-foreground/50 mb-4 italic">
              No description available. {isOwner ? "Click edit to add one." : ""}
            </p>
          )}

          {/* Contact Info Grid */}
          {hasContactInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{contactEmail}</span>
                </a>
              )}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>{contactPhone}</span>
                </a>
              )}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="truncate">{websiteUrl.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          )}

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="pt-4 border-t border-border/50">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Social Links</h4>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link, index) => {
                  const Icon = socialIconMap[link.platform] || Globe;
                  return (
                    <motion.a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{getPlatformLabel(link.platform)}</span>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Claim CTA */}
      {!isOwner && (
        <div className="mt-4 pt-4 border-t border-border/50">
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
