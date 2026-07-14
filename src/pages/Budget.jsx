import { Copy } from "lucide-react";
import { useBudget } from "@/hooks/useBudget";
import { useToast } from "@/components/ui/use-toast";
import { TableSkeleton } from "@/components/Skeletons";
import {
  CATEGORY_GROUPS,
  MONTHS,
  formatMGA,
} from "@/lib/budgetCategories";

export default function Budget() {
  const year = new Date().getFullYear();
  const { loading, getValue, setValue, duplicateAcrossYear, rowTotal } = useBudget({ year });
  const { toast } = useToast();

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

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">
          Budget annuel prévisionnel
        </h1>
        <p className="text-sm text-muted-foreground">
          Prévisions mensuelles par catégorie — année {year}
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3 sticky left-0 bg-muted/50 z-10 min-w-[200px]">
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
                              // La clé inclut la valeur : si elle change ailleurs (sync cloud),
                              // React remonte le champ avec la bonne valeur par défaut.
                              key={`${cat}-${m}-${value}`}
                              defaultValue={value}
                              onBlur={(e) => updateCell(cat, m, e.target.value)}
                              className="w-full bg-transparent text-right tabular-nums px-2 py-1.5 rounded-lg border border-transparent hover:border-border focus:border-ring focus:bg-card focus:outline-none"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-1.5 text-right font-medium tabular-nums">
                        {formatMGA(rowTotal(cat))}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => duplicateRow(cat)}
                          title="Appliquer la valeur de janvier à toute l'année"
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
                      <td key={i} className="px-3 py-2 text-right tabular-nums text-xs text-muted-foreground">
                        {Math.round(groupTotal(g, i + 1) / 1000)}k
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-medium tabular-nums">
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