import { Twitter, Instagram, Facebook } from "lucide-react";

const socialLinks = [
  { icon: Twitter, href: "https://x.com/maipulse", label: "X (Twitter)" },
  { icon: Instagram, href: "https://www.instagram.com/maipulseapp/", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61575637117630", label: "Facebook" },
];

export const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-border/30 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 transition-all duration-200 group"
                aria-label={label}
              >
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
          
          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Made purely for fun and exploration. Our AI has personality, not professional judgment—use it to discover, not to decide. 🎭✨
          </p>
        </div>
      </div>
    </footer>
  );
};
