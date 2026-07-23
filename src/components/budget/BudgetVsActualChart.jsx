import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatMGA } from "@/lib/budgetCategories";

const MAX_LABEL_CHARS = 16;

/** Tronque les noms de catégorie trop longs pour l'axe (ex. "Factures (Eau,
 *  Électricité, Internet,...)") — le nom complet reste visible dans le
 *  tooltip au survol/tap, donc rien n'est perdu, juste condensé à l'affichage. */
function truncateLabel(name) {
  return name.length > MAX_LABEL_CHARS ? `${name.slice(0, MAX_LABEL_CHARS - 1)}…` : name;
}

export default function BudgetVsActualChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        Aucune donnée de budget pour cette période
      </div>
    );
  }

  // Barres horizontales plutôt que verticales : avec 8-9 catégories dont
  // certaines au nom long, un axe des noms en bas (même incliné) finit par
  // se chevaucher sur un écran étroit. À l'horizontale, chaque catégorie a
  // sa propre ligne et le nom se lit normalement, sans rotation.
  // Hauteur proportionnelle au nombre de catégories plutôt que fixe, pour
  // que chaque paire de barres ait assez de place quel que soit leur nombre.
  const chartHeight = Math.max(220, data.length * 42);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        barCategoryGap="28%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickFormatter={truncateLabel}
          width={100}
        />
        <Tooltip
          formatter={(value) => formatMGA(value)}
          labelFormatter={(label) => label}
          contentStyle={{
            fontFamily: "var(--font-body)",
            borderRadius: 12,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
        {/* "Prévu" en gris neutre (référence discrète), "Réel" dans la couleur de marque
            (--chart-1, alignée sur --primary) — cohérent avec le thème clair et sombre. */}
        <Bar dataKey="Prévu" fill="hsl(var(--muted-foreground) / 0.35)" radius={[0, 5, 5, 0]} barSize={12} />
        <Bar dataKey="Réel" fill="hsl(var(--chart-1))" radius={[0, 5, 5, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}