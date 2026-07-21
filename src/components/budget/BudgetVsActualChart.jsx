import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatMGA } from "@/lib/budgetCategories";

export default function BudgetVsActualChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        Aucune donnée de budget pour cette période
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
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
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
        <Bar dataKey="Prévu" fill="#C9BFA8" radius={[5, 5, 0, 0]} />
        <Bar dataKey="Réel" fill="#2F82B8" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
