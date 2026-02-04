import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";

interface Alert {
  id: string;
  name: string;
  score: number;
  warning: string;
  reportCount: number;
}

const alerts: Alert[] = [
  { id: "1", name: "CryptoMoonShot.io", score: 12, warning: "Rug pull detected", reportCount: 234 },
  { id: "2", name: "@luxury_deals_2024", score: 8, warning: "Fake products", reportCount: 89 },
  { id: "3", name: "FreeiPhone15.click", score: 3, warning: "Phishing site", reportCount: 512 },
];

export const HighRiskAlerts = () => {
  const navigate = useNavigate();

  const handleClick = (name: string) => {
    navigate(`/?search=${encodeURIComponent(name)}`);
  };

  return (
    <GlassCard className="p-6 border-score-red/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-score-red" />
        <h2 className="text-lg font-bold">High Risk Alerts</h2>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            onClick={() => handleClick(alert.name)}
            className="p-4 rounded-xl bg-score-red/5 border border-score-red/10 hover:bg-score-red/10 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl font-bold text-score-red">{alert.score}</span>
              <span className="text-lg">🚨</span>
            </div>
            <p className="font-medium text-sm truncate flex items-center gap-1.5">
              {alert.name}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="text-xs text-score-red/80 mt-1">{alert.warning}</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              {alert.reportCount} reports
            </p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};
