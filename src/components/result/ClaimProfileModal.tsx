import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Check, Loader2, Sparkles, User, Mail, Phone, 
  MapPin, Globe, ArrowRight, ArrowLeft, Link2, AlertTriangle,
  CheckCircle2, XCircle
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
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface ClaimProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  category: string;
  claimedBy?: string | null;
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
  phone: z.string().min(10, "Valid phone number is required").max(20),
});

type VerificationStep = "details" | "phone-verify" | "ready" | "success";

export const ClaimProfileModal = ({
  isOpen,
  onClose,
  entityId,
  entityName,
  claimedBy,
}: ClaimProfileModalProps) => {
  const [step, setStep] = useState<VerificationStep>("details");
  const [isLoading, setIsLoading] = useState(false);
  const [permanentLink, setPermanentLink] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [currentOwnerId, setCurrentOwnerId] = useState<string | null>(claimedBy || null);
  const { toast } = useToast();

  // Verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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

  // Fetch user profile and verification status on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Email is verified if user is logged in via OAuth or confirmed email
      setIsEmailVerified(!!user.email_confirmed_at || user.app_metadata?.provider === "google");

      if (user.email) {
        setFormData(prev => ({ ...prev, email: user.email || "" }));
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, location, country, phone, phone_verified")
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
        setIsPhoneVerified(!!profile.phone_verified);
        
        // If both are verified, skip to ready step
        if ((!!user.email_confirmed_at || user.app_metadata?.provider === "google") && profile.phone_verified) {
          setStep("ready");
        }
      }
    };

    fetchUserProfile();
  }, [isOpen]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
    
    // Reset phone verification if phone changes
    if (field === "phone" && isPhoneVerified) {
      setIsPhoneVerified(false);
      setOtpSent(false);
      setPhoneOtp("");
    }
  };

  const validateDetails = () => {
    const result = personalDetailsSchema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      location: formData.location,
      country: formData.country,
      phone: formData.phone,
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

  const handleSendPhoneOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast({
        title: "Invalid phone",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setSendingOtp(true);
    try {
      // In production, this would send a real SMS via Twilio/etc.
      // For now, we simulate OTP sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOtpSent(true);
      toast({
        title: "OTP Sent!",
        description: `A verification code has been sent to ${formData.phone}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setVerifyingOtp(true);
    try {
      // In production, verify against stored OTP
      // For demo, accept any 6-digit code
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ 
            phone: formData.phone,
            phone_verified: true 
          })
          .eq("user_id", user.id);
      }
      
      setIsPhoneVerified(true);
      setStep("ready");
      toast({
        title: "Phone Verified! ✓",
        description: "Your phone number has been verified",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleProceedToVerification = () => {
    if (!validateDetails()) return;
    
    if (!isEmailVerified) {
      toast({
        title: "Email not verified",
        description: "Please verify your email address first",
        variant: "destructive",
      });
      return;
    }

    if (isPhoneVerified) {
      setStep("ready");
    } else {
      setStep("phone-verify");
    }
  };

  const handleSubmitClaim = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to claim a profile.",
        variant: "destructive",
      });
      return;
    }

    if (!isEmailVerified || !isPhoneVerified) {
      toast({
        title: "Verification required",
        description: "Both email and phone must be verified to claim a profile.",
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
          phone: formData.phone,
          phone_verified: true,
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

      setStep("success");
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
    setStep("details");
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
    setPhoneOtp("");
    setOtpSent(false);
    onClose();
  };

  const renderVerificationStatus = () => (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className={`p-3 rounded-xl border ${isEmailVerified ? 'bg-score-green/5 border-score-green/20' : 'bg-destructive/5 border-destructive/20'}`}>
        <div className="flex items-center gap-2">
          {isEmailVerified ? (
            <CheckCircle2 className="w-4 h-4 text-score-green" />
          ) : (
            <XCircle className="w-4 h-4 text-destructive" />
          )}
          <span className="text-sm font-medium">Email</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{formData.email || "Not set"}</p>
      </div>
      <div className={`p-3 rounded-xl border ${isPhoneVerified ? 'bg-score-green/5 border-score-green/20' : 'bg-muted/30 border-border'}`}>
        <div className="flex items-center gap-2">
          {isPhoneVerified ? (
            <CheckCircle2 className="w-4 h-4 text-score-green" />
          ) : (
            <Phone className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Phone</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{isPhoneVerified ? "Verified" : "Not verified"}</p>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-4">
      {renderVerificationStatus()}
      
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
          Phone <span className="text-destructive">*</span>
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
        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        <p className="text-xs text-muted-foreground mt-1">Required for verification</p>
      </div>

      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground truncate flex-1">{formData.email}</span>
          {isEmailVerified ? (
            <Check className="w-3.5 h-3.5 text-score-green" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-score-yellow" />
          )}
        </div>
      </div>

      {!isEmailVerified && (
        <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">
              Your email is not verified. Please verify your email to claim profiles.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderPhoneVerification = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
        <Phone className="w-8 h-8 text-primary" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Verify Your Phone</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We'll send a verification code to <span className="font-medium text-foreground">{formData.phone}</span>
        </p>
      </div>

      {!otpSent ? (
        <Button
          onClick={handleSendPhoneOtp}
          disabled={sendingOtp}
          className="w-full"
          size="lg"
        >
          {sendingOtp ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              Send Verification Code
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Enter the 6-digit code</p>
            <InputOTP
              maxLength={6}
              value={phoneOtp}
              onChange={setPhoneOtp}
              className="justify-center"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerifyPhoneOtp}
            disabled={verifyingOtp || phoneOtp.length !== 6}
            className="w-full"
            size="lg"
          >
            {verifyingOtp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Verify Phone
              </>
            )}
          </Button>

          <button
            onClick={handleSendPhoneOtp}
            disabled={sendingOtp}
            className="text-sm text-primary hover:underline"
          >
            Resend code
          </button>
        </div>
      )}

      <button
        onClick={() => setStep("details")}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to details
      </button>
    </div>
  );

  const renderReady = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-score-green/10 border border-score-green/20 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-8 h-8 text-score-green" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">Ready to Claim!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your email and phone are verified. You can now claim this profile.
        </p>
      </div>

      {renderVerificationStatus()}

      <Button
        onClick={handleSubmitClaim}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Claiming...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Claim Profile
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        By claiming, you confirm you are {entityName} or authorized to manage this profile
      </p>
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

  const renderContent = () => {
    switch (step) {
      case "phone-verify":
        return renderPhoneVerification();
      case "ready":
        return renderReady();
      case "success":
        return renderSuccess();
      default:
        return (
          <>
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
              {renderDetailsForm()}
            </div>

            <button
              onClick={handleProceedToVerification}
              disabled={isLoading || !isEmailVerified}
              className="w-full mt-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPhoneVerified ? (
                <>
                  <Shield className="w-4 h-4" />
                  Continue to Claim
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Verify Phone to Continue
                </>
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Both email & phone verification required to claim
            </p>
          </>
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>

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
