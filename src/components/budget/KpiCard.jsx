import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

const TONE_STYLES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
};

/**
 * @param {number} [variation] - variation en % vs la période précédente. Positif = hausse.
 * @param {boolean} [invertVariationColor] - pour les dépenses, une hausse est "mauvaise" (rouge) : passer true.
 */
export default function KpiCard({ label, value, icon: Icon, tone = "primary", variation, invertVariationColor = false }) {
  const hasVariation = typeof variation === "number" && Number.isFinite(variation);
  const isPositive = variation >= 0;
  const isGood = invertVariationColor ? !isPositive : isPositive;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-heading font-semibold tracking-tight mt-1 truncate">{value}</p>
        {hasVariation && (
          <p
            className={cn(
              "text-xs font-medium mt-1 inline-flex items-center gap-0.5",
              isGood ? "text-emerald-600" : "text-red-500"
            )}
          >
            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(variation).toFixed(1)} % vs mois préc.
          </p>
        )}
      </div>
      {Icon && (
        <span className={cn("shrink-0 h-9 w-9 rounded-xl flex items-center justify-center", TONE_STYLES[tone] || TONE_STYLES.primary)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      )}
    </div>
  );
}
