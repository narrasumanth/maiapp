import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Check, Loader2, Sparkles, User, Mail, Phone, 
  MapPin, Globe, ArrowRight, ArrowLeft, Link2, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { z } from "zod";
import { ClaimDisputeModal } from "./ClaimDisputeModal";

interface ClaimProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  category: string;
  claimedBy?: string | null; // If already claimed, pass the owner ID
}

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", 
  "France", "Spain", "Italy", "Japan", "Brazil", "Mexico", "India",
  "China", "South Korea", "Netherlands", "Sweden", "Switzerland",
  "Singapore", "United Arab Emirates", "South Africa", "Other"
];

const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  location: z.string().min(1, "Location is required").max(100),
  country: z.string().min(1, "Country is required"),
});

export const ClaimProfileModal = ({
  isOpen,
  onClose,
  entityId,
  entityName,
  claimedBy,
}: ClaimProfileModalProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [permanentLink, setPermanentLink] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(claimedBy || null);
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    location: "",
    country: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch user profile on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (user.email) {
        setFormData(prev => ({ ...prev, email: user.email || "" }));
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, location, country, phone")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          location: profile.location || "",
          country: profile.country || "",
          phone: profile.phone || "",
        }));
      }
    };

    fetchUserProfile();
  }, [isOpen]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = () => {
    const result = personalDetailsSchema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      location: formData.location,
      country: formData.country,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmitClaim = async () => {
    if (!validateStep1()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to claim a profile.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if user already has 4 claimed profiles
      const { count } = await supabase
        .from("entities")
        .select("id", { count: "exact", head: true })
        .eq("claimed_by", user.id);

      if (count && count >= 4) {
        toast({
          title: "Claim limit reached",
          description: "You can only claim up to 4 profiles.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if already claimed by someone else
      const { data: existingEntity } = await supabase
        .from("entities")
        .select("claimed_by")
        .eq("id", entityId)
        .single();

      if (existingEntity?.claimed_by) {
        // Profile is claimed - show dispute option
        if (existingEntity.claimed_by === user.id) {
          toast({
            title: "Already yours",
            description: "You already own this profile.",
          });
        } else {
          setCurrentOwnerId(existingEntity.claimed_by);
          setShowDisputeModal(true);
          onClose();
        }
        setIsLoading(false);
        return;
      }

      // Update user profile with contact details
      await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          location: formData.location,
          country: formData.country,
          phone: formData.phone || null,
          phone_verified: !!formData.phone,
          email_verified: true,
          display_name: `${formData.firstName} ${formData.lastName}`,
        })
        .eq("user_id", user.id);

      // Auto-approve: Directly update entity claimed_by and is_verified
      const { error: claimError } = await supabase
        .from("entities")
        .update({
          claimed_by: user.id,
          is_verified: true,
        })
        .eq("id", entityId);

      if (claimError) throw claimError;

      // Award points for claiming
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 25,
        _action_type: "profile_claimed",
        _reference_id: entityId,
      });

      // Generate permanent link
      const nameSlug = entityName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      const idPrefix = entityId.replace(/-/g, '').substring(0, 8);
      setPermanentLink(`${window.location.origin}/lookup/${nameSlug}_${idPrefix}`);

      setIsSuccess(true);
      toast({
        title: "Profile claimed! 🎉",
        description: "You now own this profile and can share your permanent link.",
      });
    } catch (error) {
      console.error("Error claiming profile:", error);
      toast({
        title: "Error",
        description: "Failed to claim profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(permanentLink);
    toast({
      title: "Link copied!",
      description: "Your permanent profile link is ready to share.",
    });
  };

  const handleClose = () => {
    setIsSuccess(false);
    setStep(1);
    setFormData({
      firstName: "",
      lastName: "",
      location: "",
      country: "",
      email: "",
      phone: "",
    });
    setPermanentLink("");
    setErrors({});
    onClose();
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            First Name <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              placeholder="John"
              maxLength={50}
            />
          </div>
          {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Last Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            placeholder="Doe"
            maxLength={50}
          />
          {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          City / Place <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            placeholder="New York City"
            maxLength={100}
          />
        </div>
        {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Country <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={formData.country}
            onChange={(e) => updateField("country", e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
          >
            <option value="">Select country</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Phone <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            placeholder="+1 (555) 000-0000"
            maxLength={20}
          />
        </div>
      </div>

      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">{formData.email}</span>
          <Check className="w-3.5 h-3.5 text-score-green ml-auto" />
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 rounded-full bg-score-green/10 border border-score-green/20 flex items-center justify-center mx-auto mb-5"
      >
        <Check className="w-10 h-10 text-score-green" />
      </motion.div>
      <DialogHeader>
        <DialogTitle className="text-2xl mb-2">Profile Claimed!</DialogTitle>
        <DialogDescription>
          You now own <span className="font-medium text-foreground">{entityName}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Your Permanent Link</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-background/50 px-3 py-2 rounded-lg truncate">
            {permanentLink}
          </code>
          <button
            onClick={copyLink}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        You earned <span className="text-primary font-semibold">+25 points</span>!
      </p>

      <button
        onClick={handleClose}
        className="mt-5 w-full py-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 font-medium transition-colors"
      >
        Done
      </button>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {renderSuccess()}
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DialogHeader>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <DialogTitle className="text-xl text-center">Claim This Profile</DialogTitle>
                  <DialogDescription className="text-center">
                    {entityName}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  {renderForm()}
                </div>

                <button
                  onClick={handleSubmitClaim}
                  disabled={isLoading}
                  className="w-full mt-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Claim Profile
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Profiles are auto-approved for verified users
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal - opens when profile is already claimed */}
      {currentOwnerId && (
        <ClaimDisputeModal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          entityId={entityId}
          entityName={entityName}
          currentOwnerId={currentOwnerId}
        />
      )}
    </>
  );
};
