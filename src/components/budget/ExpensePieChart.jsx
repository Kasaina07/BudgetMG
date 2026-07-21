import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatMGA } from "@/lib/budgetCategories";

// Palette dérivée des tokens du design system (émeraude → or → nuances chaudes/froides complémentaires).
const COLORS = ["#1B5E4F", "#C98A2C", "#2E9468", "#C1432A", "#5A8A96", "#8C6A3F", "#3F7A6B", "#B98A5C", "#6E5B8C", "#A25A3E"];

export default function ExpensePieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        Aucune dépense sur cette période
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 12, maxWidth: 140, fontFamily: "var(--font-body)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
