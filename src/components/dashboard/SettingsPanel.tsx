import { useState, useEffect } from "react";
import { 
  User, Mail, Phone, MapPin, Save, Loader2, 
  ArrowLeft, Shield, Bell, Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GlassCard } from "@/components/GlassCard";

interface SettingsPanelProps {
  userId: string;
  onBack: () => void;
}

interface ProfileSettings {
  display_name: string;
  phone: string;
  location: string;
  email_subscription: boolean;
}

export const SettingsPanel = ({ userId, onBack }: SettingsPanelProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>({
    display_name: "",
    phone: "",
    location: "",
    email_subscription: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, phone, location, email_subscription")
          .eq("user_id", userId)
          .single();

        if (error) throw error;

        if (data) {
          setSettings({
            display_name: data.display_name || "",
            phone: data.phone || "",
            location: data.location || "",
            email_subscription: data.email_subscription ?? true,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  const handleSave = async () => {
    if (!settings.display_name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your display name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: settings.display_name.trim(),
          phone: settings.phone.trim() || null,
          location: settings.location.trim() || null,
          email_subscription: settings.email_subscription,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Settings saved!",
        description: "Your profile settings have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Account Settings</h2>
      </div>

      {/* Profile Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Profile Information</h3>
        </div>

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Display Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={settings.display_name}
                onChange={(e) => setSettings(prev => ({ ...prev, display_name: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Your name"
                maxLength={50}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="+1 (555) 000-0000"
                maxLength={20}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Location <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={settings.location}
                onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="City, Country"
                maxLength={100}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Notification Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Notifications</h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/50">
          <div>
            <p className="font-medium">Email Updates</p>
            <p className="text-sm text-muted-foreground">
              Receive notifications about your profiles
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.email_subscription}
              onChange={(e) => setSettings(prev => ({ ...prev, email_subscription: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>
      </GlassCard>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
};
