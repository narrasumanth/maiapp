import { useState } from "react";
import { 
  Eye, Copy, ExternalLink, Link2, CheckCircle, Edit, Users, 
  Share2, MoreVertical, Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClaimedEntity {
  id: string;
  name: string;
  category: string;
  is_verified: boolean;
  normalized_name: string;
  about?: string | null;
  image_url?: string | null;
  visitor_count?: number;
}

interface ClaimedProfileCardProps {
  entity: ClaimedEntity;
  onEdit: (entity: ClaimedEntity) => void;
  onShare: (entity: ClaimedEntity) => void;
}

export const ClaimedProfileCard = ({ entity, onEdit, onShare }: ClaimedProfileCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const generatePermanentLink = () => {
    const nameSlug = entity.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const idPrefix = entity.id.replace(/-/g, '').substring(0, 8);
    return `${window.location.origin}/lookup/${nameSlug}_${idPrefix}`;
  };

  const copyLink = () => {
    const link = generatePermanentLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Your permanent profile link has been copied.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const viewProfile = () => {
    sessionStorage.setItem("mai-entity-id", entity.id);
    navigate(`/result?q=${encodeURIComponent(entity.name)}`);
  };

  return (
    <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-4">
        {/* Profile Image */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border border-border/50 shrink-0">
          {entity.image_url ? (
            <img src={entity.image_url} alt={entity.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-primary">
              {entity.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold flex items-center gap-2 truncate">
                {entity.name}
                {entity.is_verified && (
                  <CheckCircle className="w-4 h-4 text-score-green shrink-0" />
                )}
              </p>
              <p className="text-sm text-muted-foreground">{entity.category}</p>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={viewProfile}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(entity)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(entity)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* About preview */}
          {entity.about && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {entity.about}
            </p>
          )}

          {/* Stats & Link Row */}
          <div className="flex items-center gap-3 mt-3">
            {/* Visitor Count */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{entity.visitor_count || 0} views</span>
            </div>

            {/* Permanent Link */}
            <div className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/50 border border-border/50 overflow-hidden">
              <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate font-mono flex-1">
                {generatePermanentLink().replace(window.location.origin, '')}
              </span>
              <button
                onClick={copyLink}
                className="p-1 rounded hover:bg-secondary/50 transition-colors shrink-0"
                title="Copy link"
              >
                {copied ? (
                  <CheckCircle className="w-3 h-3 text-score-green" />
                ) : (
                  <Copy className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              <a
                href={generatePermanentLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-secondary/50 transition-colors shrink-0"
                title="Open link"
              >
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
