import { useMemo, useState } from "react";
import { Wand2, TrendingDown, PiggyBank } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { formatMGA } from "@/lib/budgetCategories";
import { formatMonthYear, simulateCategoryReduction, simulateSavingsPlan, projectGoalDate } from "@/lib/projections";

/** Onglet 1 : "et si je réduisais telle catégorie de X% ?" */
function ReductionSimulator({ depensesParCategorie, currentMonthlySavings }) {
  const [categoryName, setCategoryName] = useState(depensesParCategorie[0]?.name || "");
  const [pct, setPct] = useState([15]);

  const category = depensesParCategorie.find((c) => c.name === categoryName);
  const spend = category?.value || 0;

  const result = useMemo(
    () => simulateCategoryReduction(spend, pct[0], currentMonthlySavings),
    [spend, pct, currentMonthlySavings]
  );

  if (depensesParCategorie.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Ajoutez des dépenses ce mois-ci pour pouvoir simuler une réduction.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Catégorie à réduire</label>
        <select
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {depensesParCategorie.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} — {formatMGA(c.value)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-muted-foreground">Réduction simulée</label>
          <span className="text-sm font-semibold text-primary">{pct[0]}%</span>
        </div>
        <Slider value={pct} onValueChange={setPct} min={0} max={75} step={5} />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Économie / mois</p>
          <p className="text-base font-heading font-semibold text-emerald-700 dark:text-emerald-400">
            +{formatMGA(result.monthlySaved)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Économie / an</p>
          <p className="text-base font-heading font-semibold text-emerald-700 dark:text-emerald-400">
            +{formatMGA(result.annualSaved)}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Votre épargne mensuelle passerait de <span className="font-medium text-foreground">{formatMGA(currentMonthlySavings)}</span> à{" "}
        <span className="font-medium text-foreground">{formatMGA(result.newMonthlySavings)}</span>.
      </p>
    </div>
  );
}

/** Onglet 2 : "et si j'épargnais X Ar/mois pendant N mois (pour un objectif) ?" */
function SavingsPlanSimulator({ goals }) {
  const [goalId, setGoalId] = useState(goals[0]?.id || "");
  const [monthlyAmount, setMonthlyAmount] = useState(50000);
  const [months, setMonths] = useState(6);

  const goal = goals.find((g) => g.id === goalId);
  const startAmount = goal?.current_amount || 0;
  const target = goal?.target_amount || 0;

  const trajectory = useMemo(
    () => simulateSavingsPlan(startAmount, Number(monthlyAmount) || 0, Number(months) || 0),
    [startAmount, monthlyAmount, months]
  );

  const projection = goal
    ? projectGoalDate(startAmount, target, Number(monthlyAmount) || 0)
    : null;

  const finalAmount = trajectory[trajectory.length - 1]?.amount || 0;

  return (
    <div className="space-y-4">
      {goals.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Objectif concerné (optionnel)</label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Simulation libre (sans objectif)</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {formatMGA(g.current_amount)} / {formatMGA(g.target_amount)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Épargne / mois (MGA)</label>
          <input
            type="number"
            inputMode="decimal"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="w-28">
          <label className="text-xs font-medium text-muted-foreground">Durée (mois)</label>
          <input
            type="number"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {trajectory.length > 1 && (
        <div className="h-40 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="whatifGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                width={0}
                tickFormatter={(v) => new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(v)}
                fontSize={11}
              />
              <Tooltip formatter={(v) => formatMGA(v)} labelFormatter={(m) => `Mois ${m}`} />
              {target > 0 && (
                <ReferenceLine y={target} stroke="#059669" strokeDasharray="4 4" label={{ value: "Objectif", fontSize: 10, fill: "#059669" }} />
              )}
              <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#whatifGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl bg-muted p-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          Après {months || 0} mois : <span className="font-medium text-foreground">{formatMGA(finalAmount)}</span>
        </p>
        {goal && projection?.reached === false && (
          <p className="text-xs text-muted-foreground">
            Objectif "{goal.name}" atteint vers{" "}
            <span className="font-medium text-foreground">{formatMonthYear(projection.date)}</span> (~{projection.months} mois à ce rythme).
          </p>
        )}
        {goal && projection?.reached === true && (
          <p className="text-xs text-emerald-600 font-medium">Cet objectif est déjà atteint 🎉</p>
        )}
      </div>
    </div>
  );
}

export default function WhatIfSimulator({ depensesParCategorie, kpis, goals }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Wand2 className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="font-heading font-semibold">Simulateur "et si"</p>
          <p className="text-xs text-muted-foreground">Testez l'impact d'une décision avant de la prendre</p>
        </div>
      </div>

      <Tabs defaultValue="reduction">
        <TabsList>
          <TabsTrigger value="reduction" className="gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            Réduire une dépense
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-1.5">
            <PiggyBank className="h-3.5 w-3.5" />
            Plan d'épargne
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reduction">
          <ReductionSimulator depensesParCategorie={depensesParCategorie} currentMonthlySavings={kpis.epargne} />
        </TabsContent>
        <TabsContent value="plan">
          <SavingsPlanSimulator goals={goals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
