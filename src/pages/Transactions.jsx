import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Plus, Trash2, Pencil, X, Check, Receipt, Search, FileDown, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeletons";
import { exportTransactionsToPDF, exportTransactionsToExcel } from "@/lib/export";
import {
  ALL_CATEGORIES,
  MONTHS,
  formatMGA,
  getCategoryType,
} from "@/lib/budgetCategories";

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: ALL_CATEGORIES[0]?.name || "",
  type: getCategoryType(ALL_CATEGORIES[0]?.name),
  amount: "",
};

export default function Transactions() {
  const [monthFilter, setMonthFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    removeTransaction,
  } = useTransactions({ month: monthFilter === "all" ? undefined : Number(monthFilter) });
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (query && !t.description.toLowerCase().includes(query) && !t.category.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [transactions, categoryFilter, search]);

  const total = filtered.reduce(
    (s, t) => s + (t.type === "Revenu" ? t.amount : -t.amount),
    0
  );

  function handleCategoryChange(category) {
    setForm((f) => ({ ...f, category, type: getCategoryType(category) }));
  }

  function startEdit(t) {
    setEditingId(t.id);
    setForm({
      date: t.date,
      description: t.description,
      category: t.category,
      type: t.type,
      amount: t.amount,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        description: form.description,
        category: form.category,
        type: form.type,
        amount: Number(form.amount),
      };
      if (editingId) {
        updateTransaction(editingId, payload);
        toast({ title: "Transaction modifiée", description: form.description });
      } else {
        addTransaction(payload);
        toast({ title: "Transaction ajoutée", description: form.description });
      }
      cancelEdit();
    } catch (err) {
      toast({ variant: "destructive", title: "Échec de l'enregistrement", description: err.message });
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(t) {
    if (!window.confirm(`Supprimer "${t.description}" ?`)) return;
    removeTransaction(t.id);
    toast({ title: "Transaction supprimée", description: t.description });
    if (editingId === t.id) cancelEdit();
  }

  function handleExportPDF() {
    if (filtered.length === 0) return;
    exportTransactionsToPDF(filtered, { title: "Transactions" });
    toast({ title: "Export PDF généré", description: `${filtered.length} transaction(s)` });
  }

  function handleExportExcel() {
    if (filtered.length === 0) return;
    exportTransactionsToExcel(filtered);
    toast({ title: "Export Excel généré", description: `${filtered.length} transaction(s)` });
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} transaction{filtered.length > 1 ? "s" : ""} · Solde : {formatMGA(total)}
          </p>
        </div>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-fit"
        >
          <option value="all">Tous les mois</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une description ou une catégorie…"
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-fit"
        >
          <option value="all">Toutes les catégories</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={filtered.length === 0}
            title="Exporter en PDF"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileDown className="h-4 w-4" />
            PDF
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            title="Exporter en Excel"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl border border-border p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
      >
        <div className="lg:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Ex : Courses Jumbo Score"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div className="lg:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
          <select
            value={form.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Montant (MGA)</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div className="lg:col-span-1 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium px-3 py-2 hover:bg-primary/90 disabled:opacity-50"
          >
            {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? "Enregistrer" : "Ajouter"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Date</th>
                <th className="text-left font-medium px-4 py-3">Description</th>
                <th className="text-left font-medium px-4 py-3">Catégorie</th>
                <th className="text-right font-medium px-4 py-3">Montant</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={6} columns={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      icon={Receipt}
                      title={
                        transactions.length === 0
                          ? "Aucune transaction pour le moment"
                          : "Aucun résultat pour ces filtres"
                      }
                      description={
                        transactions.length === 0
                          ? "Ajoutez votre première transaction avec le formulaire ci-dessus."
                          : "Essayez une autre recherche ou réinitialisez les filtres."
                      }
                      className="border-0 rounded-none"
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                      {new Date(t.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{t.description}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.category}</td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                        t.type === "Revenu" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "Revenu" ? "+" : "-"}
                      {formatMGA(t.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(t)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                          title="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
