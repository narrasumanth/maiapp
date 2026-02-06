import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Bell, Settings, Shield, ChevronDown, ShieldCheck } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { useAuth } from "@/hooks/useAuth";

export const UserMenu = () => {
  const {
    user,
    profile,
    isAdmin,
    notifications,
    unreadCount,
    needsOnboarding,
    setNeedsOnboarding,
    signOut,
    markAllAsRead,
    refreshProfile,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showNotifications, setShowNotifications] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-score-green";
    if (score >= 50) return "text-score-yellow";
    return "text-score-red";
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  // Not logged in - show sign in/sign up buttons
  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAuthMode("signin");
              setShowAuthModal(true);
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-foreground transition-colors text-sm font-medium"
          >
            <span>Sign In</span>
          </button>
          <button
            onClick={() => {
              setAuthMode("signup");
              setShowAuthModal(true);
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors text-sm font-medium"
          >
            <User className="w-4 h-4 hidden sm:block" />
            <span>Sign Up</span>
          </button>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />
      </>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={needsOnboarding} 
        onClose={() => {
          setNeedsOnboarding(false);
          refreshProfile();
        }} 
        userId={user.id} 
      />
      
      {/* Notifications Bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 glass-card-glow p-4 z-50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg ${
                        notif.is_read ? "bg-secondary/20" : "bg-primary/10 border border-primary/20"
                      }`}
                    >
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
        </div>
        
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className={`text-sm font-bold ${getScoreColor(profile?.trust_score || 0)}`}>
              {profile?.trust_score || 0}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-56 glass-card-glow p-2 z-50"
          >
            <div className="px-3 py-2 border-b border-white/10 mb-2">
              <p className="text-sm font-medium truncate">
                {profile?.display_name || user.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </Link>

            <Link
              to="/dashboard?tab=settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm">Admin Dashboard</span>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-score-red/10 text-score-red transition-colors mt-2 border-t border-white/10 pt-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {(isOpen || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
};
