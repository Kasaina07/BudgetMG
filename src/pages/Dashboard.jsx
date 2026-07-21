import { useState } from "react";
import { Wallet, TrendingDown, PiggyBank, Percent, Coins, AlertTriangle, TrendingUp } from "lucide-react";
import KpiCard from "@/components/budget/KpiCard";
import ExpensePieChart from "@/components/budget/ExpensePieChart";
import BudgetVsActualChart from "@/components/budget/BudgetVsActualChart";
import { KpiSkeleton } from "@/components/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinancialStats } from "@/hooks/useFinancialStats";
import { MONTHS, formatMGA } from "@/lib/budgetCategories";

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const {
    loading,
    kpis,
    variations,
    soldeTempsReel,
    depensesParCategorie,
    budgetParCategorie,
    alertesBudget,
    forecast,
  } = useFinancialStats({ month, year });

  const barData = budgetParCategorie
    .map((b) => ({ name: b.category, Prévu: b.prevu, Réel: b.reel }))
    .filter((d) => d.Prévu || d.Réel)
    .sort((a, b) => b.Prévu + b.Réel - (a.Prévu + a.Réel));

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <Skeleton className="h-7 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <KpiSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">
            {MONTHS[month - 1]} {year}
          </p>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Tableau de bord</h1>
          <p className="font-figure text-sm text-muted-foreground mt-0.5">
            Solde total <span className="text-foreground font-semibold">{formatMGA(soldeTempsReel)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {alertesBudget.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/25 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-destructive">
              {alertesBudget.length} catégorie{alertesBudget.length > 1 ? "s" : ""} en dépassement de budget
            </p>
            <p className="text-xs text-destructive/75 mt-0.5">
              {alertesBudget.map((a) => a.category).join(" · ")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          label="Total des revenus"
          value={formatMGA(kpis.revenus)}
          icon={Wallet}
          tone="primary"
          variation={variations.revenus}
        />
        <KpiCard
          label="Total des dépenses"
          value={formatMGA(kpis.depenses)}
          icon={TrendingDown}
          tone="danger"
          variation={variations.depenses}
          invertVariationColor
        />
        <KpiCard
          label="Épargne générée"
          value={formatMGA(kpis.epargne)}
          icon={PiggyBank}
          tone={kpis.epargne >= 0 ? "success" : "danger"}
          variation={variations.epargne}
        />
        <KpiCard label="Taux d'épargne" value={`${kpis.taux.toFixed(1)} %`} icon={Percent} tone="success" />
        <KpiCard label="Reste à vivre" value={formatMGA(kpis.reste)} icon={Coins} tone="accent" />
      </div>

      {forecast.finDeMoisDepenses !== null && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-warm-sm flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4" />
          </span>
          <p className="text-sm">
            Au rythme actuel, vos dépenses de {MONTHS[month - 1]} devraient atteindre environ{" "}
            <span className="font-figure font-semibold">{formatMGA(forecast.finDeMoisDepenses)}</span> en fin de mois.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-warm-sm">
          <h2 className="font-heading font-semibold tracking-tight">Répartition des dépenses</h2>
          <p className="text-xs text-muted-foreground mb-3">Détail par catégorie</p>
          <ExpensePieChart data={depensesParCategorie} />
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 shadow-warm-sm">
          <h2 className="font-heading font-semibold tracking-tight">Budget prévu vs réel</h2>
          <p className="text-xs text-muted-foreground mb-3">
            {MONTHS[month - 1]} {year}
          </p>
          <BudgetVsActualChart data={barData} />
        </div>
      </div>
    </div>
  );
}
