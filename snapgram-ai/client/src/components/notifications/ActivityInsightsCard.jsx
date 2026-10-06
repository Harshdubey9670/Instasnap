import { useState, useEffect } from "react";
import { Heart, MessageCircle, UserPlus, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";
import api from "../../services/api";

const Sparkline = ({ points }) => {
  const max = Math.max(1, ...points.map((p) => p.count));
  const w = 100;
  const h = 32;
  const step = w / Math.max(1, points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - (p.count / max) * (h - 4) - 2;
    return [x, y];
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id="insights-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#insights-sparkline-fill)" stroke="none" />
      <path d={linePath} fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const StatTile = ({ icon: Icon, label, stat, iconClass }) => (
  <div className="flex flex-col items-center text-center px-1">
    <Icon className={cn("w-4 h-4 mb-1", iconClass)} />
    <p className="font-bold text-text-primary text-base leading-tight">{stat?.count ?? 0}</p>
    <p className="text-[11px] text-text-secondary">{label}</p>
    {stat?.changePct !== null && stat?.changePct !== undefined && (
      <span className={cn("text-[10px] font-semibold mt-0.5", stat.changePct >= 0 ? "text-emerald-500" : "text-red-500")}>
        {stat.changePct >= 0 ? "↑" : "↓"} {Math.abs(stat.changePct)}%
      </span>
    )}
  </div>
);

export const ActivityInsightsCard = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/notifications/insights")
      .then((res) => {
        if (!cancelled && res.data.success) setInsights(res.data.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="warm-card p-4">
        <div className="h-40 rounded-xl bg-bg-surface-hover animate-pulse" />
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="warm-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-500" /> Activity Insights
        </h3>
        <span className="text-[11px] text-text-secondary">Last 7 days</span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <StatTile icon={Heart} label="Likes" stat={insights.likes} iconClass="text-red-500 fill-red-500" />
        <StatTile icon={MessageCircle} label="Comments" stat={insights.comments} iconClass="text-primary-500" />
        <StatTile icon={UserPlus} label="New followers" stat={insights.newFollowers} iconClass="text-emerald-500" />
      </div>

      <div className="mt-3">
        <Sparkline points={insights.dailyTotals} />
      </div>

      {insights.overallChangePct !== null && insights.overallChangePct !== undefined && (
        <div className="mt-3 pt-3 border-t border-border-soft flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-snug">
            <span className="font-semibold text-text-primary">
              {insights.overallChangePct >= 0 ? "You're getting noticed!" : "Things have quieted down."}
            </span>{" "}
            {insights.overallChangePct >= 0 ? "+" : ""}
            {insights.overallChangePct}% activity vs. last week.
          </p>
        </div>
      )}
    </div>
  );
};
