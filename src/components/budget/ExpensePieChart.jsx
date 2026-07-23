import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatMGA } from "@/lib/budgetCategories";
import { getChartColor } from "@/lib/chartColors";

export default function ExpensePieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        Aucune dépense sur cette période
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      {/* Donut centré pleine largeur, avec le total affiché au centre plutôt
          qu'une légende recharts collée à droite : sur mobile, une légende
          verticale accolée au graphique force soit un donut minuscule, soit
          des libellés qui débordent sur le dessin (ex. noms de catégorie
          longs comme "Factures (Eau, Électricité, Internet,...)"). */}
      <div className="relative mx-auto" style={{ maxWidth: 260 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={100}
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={getChartColor(i)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMGA(value)}
              contentStyle={{
                fontFamily: "var(--font-body)",
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Total superposé au centre du donut (zone vide du innerRadius). */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">Total</span>
          <span className="font-figure font-semibold text-sm text-center px-2 leading-tight">
            {formatMGA(total)}
          </span>
        </div>
      </div>

      {/* Légende personnalisée, pleine largeur, sous le graphique — chaque
          ligne a toute la largeur disponible donc les noms longs passent
          simplement à la ligne au lieu de chevaucher le dessin. */}
      <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
        {data.map((entry, i) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <li key={entry.name} className="flex items-start gap-2 text-xs min-w-0">
              <span
                className="mt-0.5 h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getChartColor(i) }}
              />
              <span className="min-w-0 flex-1 text-foreground/80 leading-snug break-words">
                {entry.name}
              </span>
              <span className="shrink-0 font-figure font-medium text-muted-foreground tabular-nums">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}