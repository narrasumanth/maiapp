import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Check, Loader2, Sparkles, User, Mail, Phone, 
  MapPin, Globe, ArrowRight, ArrowLeft, Bell 
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

interface ClaimProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  category: string;
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
  middleName: z.string().max(50).optional(),
  location: z.string().min(1, "Location is required").max(100),
  country: z.string().min(1, "Country is required"),
});

const contactSchema = z.object({
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required").max(20),
});

export const ClaimProfileModal = ({
  isOpen,
  onClose,
  entityId,
  entityName,
}: ClaimProfileModalProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailAlreadyVerified, setEmailAlreadyVerified] = useState(false);
  const [phoneAlreadyVerified, setPhoneAlreadyVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    location: "",
    country: "",
    email: "",
    phone: "",
    emailSubscription: true,
  });

  // Fetch user profile on mount to check existing verifications
  useEffect(() => {
    if (!isOpen) return;

    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's email from auth
      if (user.email) {
        setFormData(prev => ({ ...prev, email: user.email || "" }));
        // Email is verified if user signed up with it
        setEmailVerified(true);
        setEmailAlreadyVerified(true);
      }

      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, middle_name, location, country, phone, phone_verified, email_verified")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          middleName: profile.middle_name || "",
          location: profile.location || "",
          country: profile.country || "",
          phone: profile.phone || "",
        }));

        if (profile.phone_verified) {
          setPhoneVerified(true);
          setPhoneAlreadyVerified(true);
        }
        if (profile.email_verified) {
          setEmailVerified(true);
          setEmailAlreadyVerified(true);
        }
      }
    };

    fetchUserProfile();
  }, [isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = () => {
    const result = personalDetailsSchema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName || undefined,
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

  const validateStep2 = () => {
    const result = contactSchema.safeParse({
      email: formData.email,
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

  const sendEmailOtp = async () => {
    if (!validateStep2()) return;
    
    setVerifyingEmail(true);
    try {
      // In a real app, you'd send an OTP via email
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmailOtpSent(true);
      toast({
        title: "Verification code sent",
        description: `Check your email at ${formData.email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (emailOtp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setVerifyingEmail(true);
    try {
      // Simulate OTP verification - in production, verify against backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      // For demo, accept any 6-digit code
      setEmailVerified(true);
      toast({
        title: "Email verified! ✓",
        description: "Your email has been verified successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const sendPhoneOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setErrors(prev => ({ ...prev, phone: "Valid phone number is required" }));
      return;
    }
    
    setVerifyingPhone(true);
    try {
      // Simulate sending SMS OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPhoneOtpSent(true);
      toast({
        title: "Verification code sent",
        description: `Check your phone ${formData.phone}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const verifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setVerifyingPhone(true);
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPhoneVerified(true);
      toast({
        title: "Phone verified! ✓",
        description: "Your phone has been verified successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      if (!emailVerified) {
        toast({
          title: "Email verification required",
          description: "Please verify your email to continue",
          variant: "destructive",
        });
        return;
      }
      if (!phoneVerified) {
        toast({
          title: "Phone verification required",
          description: "Please verify your phone number to continue",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
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

      // Check if already claimed
      const { data: existingClaim } = await supabase
        .from("profile_claims")
        .select("id")
        .eq("entity_id", entityId)
        .eq("user_id", user.id)
        .single();

      if (existingClaim) {
        toast({
          title: "Already claimed",
          description: "You already have a pending claim for this profile.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update user profile with contact details
      await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName || null,
          location: formData.location,
          country: formData.country,
          phone: formData.phone,
          phone_verified: phoneVerified,
          email_subscription: formData.emailSubscription,
          display_name: `${formData.firstName} ${formData.lastName}`,
        })
        .eq("user_id", user.id);

      // Submit claim with verification data
      const { error } = await supabase
        .from("profile_claims")
        .insert({
          entity_id: entityId,
          user_id: user.id,
          verification_method: "verified_claim",
          verification_data: { 
            type: "verified_claim",
            email_verified: emailVerified,
            phone_verified: phoneVerified,
            contact_details: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              middleName: formData.middleName,
              location: formData.location,
              country: formData.country,
              email: formData.email,
              phone: formData.phone,
            },
            email_subscription: formData.emailSubscription,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) throw error;

      // Award points
      await supabase.rpc("award_points", {
        _user_id: user.id,
        _amount: 25, // More points for verified claim
        _action_type: "verified_claim_submitted",
        _reference_id: entityId,
      });

      setIsSuccess(true);
      toast({
        title: "Claim submitted! 🎉",
        description: "We'll review and approve your verified claim shortly.",
      });
    } catch (error) {
      console.error("Error submitting claim:", error);
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setStep(1);
    setFormData({
      firstName: "",
      lastName: "",
      middleName: "",
      location: "",
      country: "",
      email: "",
      phone: "",
      emailSubscription: true,
    });
    setEmailVerified(false);
    setPhoneVerified(false);
    setEmailOtpSent(false);
    setPhoneOtpSent(false);
    setEmailOtp("");
    setPhoneOtp("");
    setErrors({});
    onClose();
  };

  const renderStep1 = () => (
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
          Middle Name <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.middleName}
          onChange={(e) => updateField("middleName", e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
          placeholder="Middle name"
          maxLength={50}
        />
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
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      {/* Email Verification */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Email Verification</span>
          </div>
          {emailVerified && (
            <span className="flex items-center gap-1 text-xs text-score-green">
              <Check className="w-3 h-3" /> {emailAlreadyVerified ? "Already Verified" : "Verified"}
            </span>
          )}
        </div>
        
        {emailAlreadyVerified ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{formData.email}</p>
            <p className="text-xs text-score-green/80">✓ Verified during signup</p>
          </div>
        ) : !emailOtpSent ? (
          <div className="space-y-2">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            <button
              onClick={sendEmailOtp}
              disabled={verifyingEmail || !formData.email}
              className="w-full py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors disabled:opacity-50"
            >
              {verifyingEmail ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Verification Code"}
            </button>
          </div>
        ) : !emailVerified ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to {formData.email}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 px-3 py-2.5 rounded-lg bg-background/50 border border-border focus:border-primary/50 text-center tracking-widest text-sm"
                placeholder="000000"
                maxLength={6}
              />
              <button
                onClick={verifyEmailOtp}
                disabled={verifyingEmail || emailOtp.length !== 6}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {verifyingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </button>
            </div>
            <button 
              onClick={() => { setEmailOtpSent(false); setEmailOtp(""); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Change email
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{formData.email}</p>
        )}
      </div>

      {/* Phone Verification */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Phone Verification</span>
          </div>
          {phoneVerified && (
            <span className="flex items-center gap-1 text-xs text-score-green">
              <Check className="w-3 h-3" /> {phoneAlreadyVerified ? "Already Verified" : "Verified"}
            </span>
          )}
        </div>
        
        {phoneAlreadyVerified ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{formData.phone}</p>
            <p className="text-xs text-score-green/80">✓ Verified during signup</p>
          </div>
        ) : !phoneOtpSent ? (
          <div className="space-y-2">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              placeholder="+1 (555) 000-0000"
              maxLength={20}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            <button
              onClick={sendPhoneOtp}
              disabled={verifyingPhone || !formData.phone}
              className="w-full py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors disabled:opacity-50"
            >
              {verifyingPhone ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Verification Code"}
            </button>
          </div>
        ) : !phoneVerified ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to {formData.phone}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 px-3 py-2.5 rounded-lg bg-background/50 border border-border focus:border-primary/50 text-center tracking-widest text-sm"
                placeholder="000000"
                maxLength={6}
              />
              <button
                onClick={verifyPhoneOtp}
                disabled={verifyingPhone || phoneOtp.length !== 6}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {verifyingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </button>
            </div>
            <button 
              onClick={() => { setPhoneOtpSent(false); setPhoneOtp(""); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Change phone
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{formData.phone}</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-secondary/30 border border-border">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          What you get as a verified owner
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-score-green" /> Edit profile description & details
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-score-green" /> Add social links & contact info
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-score-green" /> View who's visiting your profile
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-score-green" /> Receive direct messages
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-score-green" /> Create private share links
          </li>
        </ul>
      </div>

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={formData.emailSubscription}
              onChange={(e) => updateField("emailSubscription", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-5 h-5 rounded border-2 border-primary/50 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
              {formData.emailSubscription && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 font-medium text-sm">
              <Bell className="w-4 h-4 text-primary" />
              Subscribe to updates
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Get notified about profile activity, score changes, and important updates
            </p>
          </div>
        </label>
      </div>

      <div className="p-3 rounded-lg bg-score-green/10 border border-score-green/20">
        <div className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-score-green" />
          <span className="text-score-green font-medium">Email verified</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <Check className="w-4 h-4 text-score-green" />
          <span className="text-score-green font-medium">Phone verified</span>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 rounded-full bg-score-green/10 border border-score-green/20 flex items-center justify-center mx-auto mb-6"
      >
        <Check className="w-10 h-10 text-score-green" />
      </motion.div>
      <DialogHeader>
        <DialogTitle className="text-2xl mb-2">Claim Submitted!</DialogTitle>
        <DialogDescription>
          Your verified claim is being reviewed. We'll notify you once approved.
        </DialogDescription>
      </DialogHeader>
      <p className="text-sm text-muted-foreground mt-4">
        You earned <span className="text-primary font-semibold">+25 points</span> for verified claim!
      </p>
      <button
        onClick={handleClose}
        className="mt-6 px-6 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
      >
        Done
      </button>
    </div>
  );

  return (
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
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 w-8 rounded-full transition-colors ${
                          i <= step ? "bg-primary" : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">Step {step} of 3</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <DialogTitle className="text-xl text-center">
                  {step === 1 && "Personal Details"}
                  {step === 2 && "Verify Contact Info"}
                  {step === 3 && "Confirm & Subscribe"}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {entityName}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
              </div>

              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitClaim}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Submit Verified Claim
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Verified claims are reviewed within 24-48 hours
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
