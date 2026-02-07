import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const VisionTeaser = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="max-w-5xl mx-auto px-4 py-8"
    >
      <button
        onClick={() => navigate("/vision")}
        className="group w-full p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/40 transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/15 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold text-foreground">
                  Your Vision, Our Pulse
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/20 text-primary">
                  New
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Discover how we're building the next-generation trust layer for the internet
              </p>
            </div>
          </div>
          
          <div className="shrink-0 p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </button>
    </motion.div>
  );
};
