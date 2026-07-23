import { useState } from "react";
import { Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { useBudget } from "@/hooks/useBudget";
import { useToast } from "@/components/ui/use-toast";
import { TableSkeleton } from "@/components/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CATEGORY_GROUPS,
  MONTHS,
  formatMGA,
} from "@/lib/budgetCategories";

/**
 * Sélecteur de mois pour la vue mobile : le tableau à 12 colonnes n'est
 * pas exploitable sur petit écran (défilement horizontal peu lisible),
 * donc on affiche un mois à la fois, avec navigation précédent/suivant.
 */
function MonthSwitcher({ month, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(month === 1 ? 12 : month - 1)}
        aria-label="Mois précédent"
        className="touch-target p-2.5 rounded-xl border border-border bg-card hover:bg-muted shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <select
        value={month}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Sélectionner le mois du budget"
        className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onChange(month === 12 ? 1 : month + 1)}
        aria-label="Mois suivant"
        className="touch-target p-2.5 rounded-xl border border-border bg-card hover:bg-muted shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Squelette de chargement pour les cartes de la vue mobile. */
function MobileBudgetSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 shadow-warm-sm space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function Budget() {
  const year = new Date().getFullYear();
  const { loading, getValue, setValue, duplicateAcrossYear, rowTotal } = useBudget({ year });
  const { toast } = useToast();
  const [mobileMonth, setMobileMonth] = useState(new Date().getMonth() + 1);

  function updateCell(cat, month, value) {
    setValue(cat, month, value);
  }

  function duplicateRow(cat) {
    duplicateAcrossYear(cat);
    toast({ title: "Valeur appliquée", description: `${cat} · janvier reporté sur les 12 mois` });
  }

  const groupTotal = (group, month) =>
    group.categories.reduce((s, c) => s + getValue(c, month), 0);
  const groupAnnual = (group) => group.categories.reduce((s, c) => s + rowTotal(c), 0);
  const monthGrandTotal = (month) => CATEGORY_GROUPS.reduce((s, g) => s + groupTotal(g, month), 0);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">Prévisionnel</p>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">
          Budget annuel
        </h1>
        <p className="text-sm text-muted-foreground">
          Prévisions mensuelles par catégorie — année {year}
        </p>
      </div>

      {/* --- Vue mobile : un mois à la fois, cartes par groupe de catégories --- */}
      <div className="md:hidden space-y-4">
        <MonthSwitcher month={mobileMonth} onChange={setMobileMonth} />

        {loading ? (
          <MobileBudgetSkeleton />
        ) : (
          <>
            {CATEGORY_GROUPS.map((g) => (
              <div key={g.group} className="bg-card rounded-2xl border border-border shadow-warm-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {g.group}
                  </span>
                  <span className="font-figure text-xs font-medium text-muted-foreground">
                    {formatMGA(groupTotal(g, mobileMonth))}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {g.categories.map((cat) => {
                    const value = getValue(cat, mobileMonth);
                    return (
                      <div key={cat} className="px-4 py-3 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cat}</p>
                          <p className="font-figure text-[11px] text-muted-foreground mt-0.5">
                            Total annuel {formatMGA(rowTotal(cat))}
                          </p>
                        </div>
                        <input
                          type="number"
                          inputMode="decimal"
                          // La clé inclut le mois et la valeur : si la valeur change ailleurs
                          // (sync cloud) ou qu'on change de mois, le champ se remonte avec
                          // la bonne valeur par défaut plutôt que de garder l'ancienne saisie.
                          key={`${cat}-${mobileMonth}-${value}`}
                          defaultValue={value}
                          onBlur={(e) => updateCell(cat, mobileMonth, e.target.value)}
                          aria-label={`Montant prévu pour ${cat}, ${MONTHS[mobileMonth - 1]}`}
                          className="font-figure w-28 shrink-0 bg-background text-right px-3 py-2.5 rounded-xl border border-border focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => duplicateRow(cat)}
                          aria-label={`Appliquer la valeur de janvier de ${cat} à toute l'année`}
                          title="Appliquer la valeur de janvier à toute l'année"
                          className="touch-target p-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <p className="text-sm font-medium">Total {MONTHS[mobileMonth - 1]}</p>
              <p className="font-figure text-sm font-semibold">{formatMGA(monthGrandTotal(mobileMonth))}</p>
            </div>
          </>
        )}
      </div>

      {/* --- Vue desktop : tableau complet des 12 mois --- */}
      <div className="hidden md:block bg-card rounded-2xl border border-border shadow-warm-sm overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted text-muted-foreground sticky top-0 z-20">
              <tr>
                <th className="text-left font-medium px-4 py-3 sticky left-0 bg-muted z-30 min-w-[200px]">
                  Catégorie
                </th>
                {MONTHS.map((m) => (
                  <th key={m} className="text-right font-medium px-3 py-3 min-w-[88px]">
                    {m}
                  </th>
                ))}
                <th className="text-right font-medium px-4 py-3 min-w-[120px]">Total annuel</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <TableSkeleton rows={8} columns={15} />
              </tbody>
            ) : (
              CATEGORY_GROUPS.map((g) => (
                <tbody key={g.group}>
                  <tr className="bg-muted/30">
                    <td
                      colSpan={15}
                      className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground sticky left-0 bg-muted/30 z-10"
                    >
                      {g.group}
                    </td>
                  </tr>
                  {g.categories.map((cat) => (
                    <tr key={cat} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-1.5 sticky left-0 bg-card z-10 font-medium">
                        {cat}
                      </td>
                      {MONTHS.map((_, i) => {
                        const m = i + 1;
                        const value = getValue(cat, m);
                        return (
                          <td key={m} className="px-1 py-1">
                            <input
                              type="number"
                              inputMode="decimal"
                              // La clé inclut la valeur : si elle change ailleurs (sync cloud),
                              // React remonte le champ avec la bonne valeur par défaut.
                              key={`${cat}-${m}-${value}`}
                              defaultValue={value}
                              onBlur={(e) => updateCell(cat, m, e.target.value)}
                              aria-label={`Montant prévu pour ${cat}, ${MONTHS[i]} ${year}`}
                              className="font-figure w-full bg-transparent text-right px-2 py-1.5 rounded-lg border border-transparent hover:border-border focus:border-ring focus:bg-card focus:outline-none"
                            />
                          </td>
                        );
                      })}
                      <td className="font-figure px-4 py-1.5 text-right font-medium">
                        {formatMGA(rowTotal(cat))}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => duplicateRow(cat)}
                          title="Appliquer la valeur de janvier à toute l'année"
                          aria-label={`Appliquer la valeur de janvier de ${cat} à toute l'année`}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 border-t border-border">
                    <td className="px-4 py-2 sticky left-0 bg-muted/20 z-10 text-xs font-medium text-muted-foreground">
                      Sous-total {g.group}
                    </td>
                    {MONTHS.map((_, i) => (
                      <td key={i} className="font-figure px-3 py-2 text-right text-xs text-muted-foreground">
                        {Math.round(groupTotal(g, i + 1) / 1000)}k
                      </td>
                    ))}
                    <td className="font-figure px-4 py-2 text-right font-medium">
                      {formatMGA(groupAnnual(g))}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              ))
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
