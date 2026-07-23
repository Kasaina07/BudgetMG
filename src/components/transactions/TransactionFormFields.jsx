import { Plus, Check, X } from "lucide-react";
import { ALL_CATEGORIES } from "@/lib/budgetCategories";

/** Champs du formulaire, réutilisés à l'identique dans la carte desktop et la feuille mobile. */
export default function TransactionFormFields({
  form,
  setForm,
  handleCategoryChange,
  editingId,
  cancelEdit,
  saving,
  layout,
}) {
  return (
    <>
      <div className={layout === "sheet" ? "" : "lg:col-span-1"}>
        <label className="text-xs font-medium text-muted-foreground">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      <div className={layout === "sheet" ? "" : "lg:col-span-2"}>
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Ex : Courses Jumbo Score"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      <div className={layout === "sheet" ? "" : "lg:col-span-1"}>
        <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
        <select
          value={form.category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className={layout === "sheet" ? "" : "lg:col-span-1"}>
        <label className="text-xs font-medium text-muted-foreground">Montant (MGA)</label>
        <input
          type="number"
          inputMode="decimal"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          placeholder="0"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      <div className={layout === "sheet" ? "flex gap-2 pt-2" : "lg:col-span-1 flex gap-2"}>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium px-3 py-2.5 hover:bg-primary/90 disabled:opacity-50"
        >
          {editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? "Enregistrer" : "Ajouter"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2.5 hover:bg-muted touch-target"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );
}
