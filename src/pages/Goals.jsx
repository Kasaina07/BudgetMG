import { useState } from "react";
import { useSavingsGoals } from "@/hooks/useSavingsGoals";
import { Plus, Trash2, Target, PiggyBank } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeletons";
import { formatMGA } from "@/lib/budgetCategories";

const emptyForm = { name: "", target_amount: "", current_amount: "" };

export default function Goals() {
  const { goals, loading, addGoal, removeGoal, addFunds } = useSavingsGoals();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [addAmounts, setAddAmounts] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.target_amount) return;
    setSaving(true);
    try {
      addGoal({
        name: form.name,
        target_amount: Number(form.target_amount),
        current_amount: Number(form.current_amount) || 0,
      });
      toast({ title: "Objectif créé", description: form.name });
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(goal) {
    if (!window.confirm(`Supprimer l'objectif "${goal.name}" ?`)) return;
    removeGoal(goal.id);
    toast({ title: "Objectif supprimé", description: goal.name });
  }

  function handleAddFunds(goal) {
    const amount = Number(addAmounts[goal.id]);
    if (!amount) return;
    const updated = addFunds(goal, amount);
    setAddAmounts((prev) => ({ ...prev, [goal.id]: "" }));
    if (updated.current_amount >= updated.target_amount) {
      toast({ title: "Objectif atteint 🎉", description: `${goal.name} est complet !` });
    } else {
      toast({ title: "Montant ajouté", description: `+${formatMGA(amount)} sur ${goal.name}` });
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">Objectifs d'épargne</h1>
        <p className="text-sm text-muted-foreground">Suivez votre progression vers chaque objectif</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl border border-border p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
      >
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nom de l'objectif</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex : Fonds d'urgence"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Montant cible (MGA)</label>
          <input
            type="number"
            value={form.target_amount}
            onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
            placeholder="0"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground">Déjà épargné (MGA)</label>
            <input
              type="number"
              value={form.current_amount}
              onChange={(e) => setForm((f) => ({ ...f, current_amount: e.target.value }))}
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium px-3 py-2 h-[38px] hover:bg-primary/90 disabled:opacity-50 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </form>

      {loading ? (
        <CardSkeleton count={3} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aucun objectif pour le moment"
          description="Créez votre premier objectif d'épargne avec le formulaire ci-dessus."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = g.target_amount ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
            const reached = g.current_amount >= g.target_amount;
            return (
              <div key={g.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <PiggyBank className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMGA(g.current_amount)} / {formatMGA(g.target_amount)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(g)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 shrink-0"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${reached ? "bg-emerald-500" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pct}% atteint{reached ? " 🎉" : ""}</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Ajouter un montant"
                    value={addAmounts[g.id] || ""}
                    onChange={(e) => setAddAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={() => handleAddFunds(g)}
                    className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
