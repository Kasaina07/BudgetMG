import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

const TONE_STYLES = {
  primary: { bar: "bg-primary", icon: "bg-primary/10 text-primary" },
  success: { bar: "bg-success", icon: "bg-success/10 text-success" },
  danger: { bar: "bg-destructive", icon: "bg-destructive/10 text-destructive" },
  accent: { bar: "bg-accent", icon: "bg-accent/15 text-accent" },
};

/**
 * @param {number} [variation] - variation en % vs la période précédente. Positif = hausse.
 * @param {boolean} [invertVariationColor] - pour les dépenses, une hausse est "mauvaise" (rouge) : passer true.
 */
export default function KpiCard({ label, value, icon: Icon, tone = "primary", variation, invertVariationColor = false }) {
  const hasVariation = typeof variation === "number" && Number.isFinite(variation);
  const isPositive = variation >= 0;
  const isGood = invertVariationColor ? !isPositive : isPositive;
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.primary;

  return (
    <div className="relative bg-card rounded-2xl border border-border pl-5 pr-4 py-4 shadow-warm-sm flex items-start justify-between gap-3 overflow-hidden">
      <span className={cn("absolute left-0 top-0 bottom-0 w-1", toneStyle.bar)} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="font-figure text-lg font-semibold tracking-tight mt-1 truncate">{value}</p>
        {hasVariation && (
          <p
            className={cn(
              "text-xs font-medium mt-1 inline-flex items-center gap-0.5",
              isGood ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(variation).toFixed(1)} % vs mois préc.
          </p>
        )}
      </div>
      {Icon && (
        <span className={cn("shrink-0 h-9 w-9 rounded-xl flex items-center justify-center", toneStyle.icon)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      )}
    </div>
  );
}
