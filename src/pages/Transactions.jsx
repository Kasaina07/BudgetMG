import { useMemo, useRef, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Receipt,
  Search,
  FileDown,
  FileSpreadsheet,
  FileUp,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import EmptyState from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeletons";
import { exportTransactionsToPDF, exportTransactionsToExcel } from "@/lib/export";
import { parseTransactionsFile, buildDraftRow, rowHasErrors, markDuplicates, isDuplicate } from "@/lib/importExcel";
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

/** Champs du formulaire, réutilisés à l'identique dans la carte desktop et la feuille mobile. */
function TransactionFormFields({ form, setForm, handleCategoryChange, editingId, cancelEdit, saving, layout }) {
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

export default function Transactions() {
  const isMobile = useIsMobile();
  const [monthFilter, setMonthFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const {
    transactions,
    allTransactions,
    loading,
    addTransaction,
    updateTransaction,
    removeTransaction,
    importTransactions,
  } = useTransactions({ month: monthFilter === "all" ? undefined : Number(monthFilter) });
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null); // { rows: DraftRow[] } — chaque ligne porte _excluded, _isDuplicate, fieldErrors
  const [importing, setImporting] = useState(false);

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
    if (isMobile) setSheetOpen(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(false);
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

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-sélectionner le même fichier plus tard
    if (!file) return;

    try {
      const { rows } = await parseTransactionsFile(file);
      const withDuplicateFlag = markDuplicates(rows, allTransactions);
      // Exclue par défaut : lignes en erreur (impossible à importer telles quelles) et doublons probables.
      const withDefaults = withDuplicateFlag.map((r) => ({
        ...r,
        _excluded: rowHasErrors(r) || r._isDuplicate,
      }));
      setImportPreview({ rows: withDefaults });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Impossible de lire ce fichier",
        description: err.message || "Vérifiez qu'il s'agit bien d'un fichier Excel (.xlsx) ou CSV.",
      });
    }
  }

  /** Recalcule une ligne après une correction manuelle dans l'aperçu (champ édité par l'utilisateur). */
  function editImportRow(sourceRow, patch) {
    setImportPreview((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) => {
        if (r._sourceRow !== sourceRow) return r;
        const hadErrors = rowHasErrors(r);
        const rebuilt = buildDraftRow({ ...r.raw, ...patch }, sourceRow);
        rebuilt._isDuplicate = isDuplicate(rebuilt, allTransactions);
        // Ligne toujours invalide -> reste exclue. Ligne qui vient d'être corrigée -> on l'inclut
        // automatiquement sauf si elle s'avère être un doublon. Ligne déjà valide avant -> on garde
        // le choix (case à cocher / décision doublon) déjà fait par l'utilisateur.
        rebuilt._excluded = rowHasErrors(rebuilt)
          ? true
          : hadErrors
          ? rebuilt._isDuplicate
          : r._excluded;
        return rebuilt;
      });
      return { ...prev, rows };
    });
  }

  function toggleRowExcluded(sourceRow) {
    setImportPreview((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) =>
        r._sourceRow === sourceRow && !rowHasErrors(r) ? { ...r, _excluded: !r._excluded } : r
      );
      return { ...prev, rows };
    });
  }

  /** Décision explicite pour une ligne en doublon probable : true = "c'est un doublon, ignorer", false = "ce n'est pas un doublon, importer". */
  function setDuplicateDecision(sourceRow, isRealDuplicate) {
    setImportPreview((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) =>
        r._sourceRow === sourceRow ? { ...r, _excluded: isRealDuplicate } : r
      );
      return { ...prev, rows };
    });
  }

  function closeImportPreview() {
    setImportPreview(null);
  }

  async function confirmImport() {
    if (!importPreview) return;
    const rowsToImport = importPreview.rows
      .filter((r) => !r._excluded && !rowHasErrors(r))
      .map(({ _sourceRow, raw, categoryWasFallback, originalCategoryRaw, fieldErrors, _isDuplicate, _excluded, ...payload }) => payload);

    if (rowsToImport.length === 0) {
      toast({ variant: "destructive", title: "Aucune ligne à importer", description: "Toutes les lignes sont exclues ou encore invalides." });
      return;
    }

    setImporting(true);
    try {
      importTransactions(rowsToImport);
      toast({ title: "Import terminé", description: `${rowsToImport.length} transaction(s) ajoutée(s)` });
      closeImportPreview();
    } catch (err) {
      toast({ variant: "destructive", title: "Échec de l'import", description: err.message });
    } finally {
      setImporting(false);
    }
  }

  const formFieldsProps = { form, setForm, handleCategoryChange, editingId, cancelEdit, saving };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">Mouvements</p>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Transactions</h1>
          <p className="font-figure text-sm text-muted-foreground mt-0.5">
            {filtered.length} transaction{filtered.length > 1 ? "s" : ""} · Solde{" "}
            <span className="text-foreground font-semibold">{formatMGA(total)}</span>
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
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-fit"
        >
          <option value="all">Toutes les catégories</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleImportClick}
            title="Importer depuis Excel/CSV"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 sm:px-3 py-2.5 text-sm font-medium hover:bg-muted touch-target"
          >
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">Importer</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={filtered.length === 0}
            title="Exporter en PDF"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 sm:px-3 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:pointer-events-none touch-target"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            title="Exporter en Excel"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 sm:px-3 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:pointer-events-none touch-target"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Formulaire inline — desktop uniquement. Sur mobile, place au FAB + feuille modale ci-dessous. */}
      <form
        onSubmit={handleSubmit}
        className="hidden md:grid bg-card rounded-2xl border border-border p-5 shadow-warm-sm grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
      >
        <TransactionFormFields {...formFieldsProps} layout="inline" />
      </form>

      {loading ? (
        <>
          <div className="md:hidden space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border shadow-warm-sm p-4 h-[68px] animate-pulse" />
            ))}
          </div>
          <div className="hidden md:block bg-card rounded-2xl border border-border shadow-warm-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <TableSkeleton rows={6} columns={5} />
              </tbody>
            </table>
          </div>
        </>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={
            transactions.length === 0
              ? "Aucune transaction pour le moment"
              : "Aucun résultat pour ces filtres"
          }
          description={
            transactions.length === 0
              ? "Ajoutez votre première transaction avec le bouton + ci-dessous."
              : "Essayez une autre recherche ou réinitialisez les filtres."
          }
        />
      ) : (
        <>
          {/* Liste en cartes — mobile uniquement. Une table qui défile horizontalement est
              pénible au pouce ; ici chaque transaction tient sur une carte, actions à portée. */}
          <ul className="md:hidden space-y-2">
            {filtered.map((t) => (
              <li key={t.id} className="bg-card rounded-2xl border border-border shadow-warm-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(t.date).toLocaleDateString("fr-FR")} · {t.category}
                    </p>
                  </div>
                  <p
                    className={`font-figure text-sm font-semibold whitespace-nowrap ${
                      t.type === "Revenu" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {t.type === "Revenu" ? "+" : "-"}
                    {formatMGA(t.amount)}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 -mb-1 -mr-1.5">
                  <button
                    onClick={() => startEdit(t)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground touch-target"
                    title="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive/80 hover:text-destructive touch-target"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Table — desktop uniquement. */}
          <div className="hidden md:block bg-card rounded-2xl border border-border shadow-warm-sm overflow-hidden">
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
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{t.description}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{t.category}</td>
                      <td
                        className={`font-figure px-4 py-2.5 text-right font-medium ${
                          t.type === "Revenu" ? "text-success" : "text-destructive"
                        }`}
                      >
                        {t.type === "Revenu" ? "+" : "-"}
                        {formatMGA(t.amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(t)}
                            className="p-2 rounded-lg hover:bg-muted text-muted-foreground touch-target"
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive/80 hover:text-destructive touch-target"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Bouton flottant — mobile uniquement. Ouvre le formulaire en feuille modale. */}
      <button
        type="button"
        onClick={() => {
          if (!editingId) setForm(emptyForm);
          setSheetOpen(true);
        }}
        aria-label="Ajouter une transaction"
        className="md:hidden fixed z-20 right-4 bottom-[calc(env(safe-area-inset-bottom)+72px)] h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-warm-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : cancelEdit())}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <SheetHeader className="text-left">
            <SheetTitle>{editingId ? "Modifier la transaction" : "Nouvelle transaction"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <TransactionFormFields {...formFieldsProps} layout="sheet" />
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={!!importPreview} onOpenChange={(open) => !open && closeImportPreview()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Aperçu de l'import</DialogTitle>
            <DialogDescription>
              Corrigez directement les lignes en rouge (elles ne sont pas importables telles quelles),
              et confirmez ou infirmez chaque doublon probable avant de valider.
            </DialogDescription>
          </DialogHeader>

          {importPreview && (() => {
            const errorCount = importPreview.rows.filter(rowHasErrors).length;
            const duplicateCount = importPreview.rows.filter((r) => r._isDuplicate).length;
            const readyCount = importPreview.rows.filter((r) => !r._excluded && !rowHasErrors(r)).length;
            return (
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">{readyCount} prête(s) à importer</Badge>
                  {errorCount > 0 && (
                    <Badge variant="destructive">{errorCount} à corriger</Badge>
                  )}
                  {duplicateCount > 0 && (
                    <Badge variant="outline">{duplicateCount} doublon(s) probable(s)</Badge>
                  )}
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="w-10 px-3 py-2"></th>
                        <th className="text-left font-medium px-3 py-2">Date</th>
                        <th className="text-left font-medium px-3 py-2">Description</th>
                        <th className="text-left font-medium px-3 py-2">Catégorie</th>
                        <th className="text-left font-medium px-3 py-2">Type</th>
                        <th className="text-right font-medium px-3 py-2">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.rows.map((r) => {
                        const hasErrors = rowHasErrors(r);

                        // ---- Ligne invalide : champs éditables + messages d'erreur ----
                        if (hasErrors) {
                          return (
                            <tr key={r._sourceRow} className="border-t border-border bg-destructive/5 align-top">
                              <td className="px-3 py-2 pt-3">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="date"
                                  value={r.date || ""}
                                  onChange={(ev) => editImportRow(r._sourceRow, { date: ev.target.value })}
                                  className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                                    r.fieldErrors.date ? "border-destructive" : "border-border"
                                  }`}
                                />
                                {r.fieldErrors.date && (
                                  <p className="mt-1 text-xs text-destructive">{r.fieldErrors.date}</p>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={r.description}
                                  onChange={(ev) => editImportRow(r._sourceRow, { description: ev.target.value })}
                                  placeholder="Description"
                                  className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                                    r.fieldErrors.description ? "border-destructive" : "border-border"
                                  }`}
                                />
                                {r.fieldErrors.description && (
                                  <p className="mt-1 text-xs text-destructive">{r.fieldErrors.description}</p>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={r.category}
                                  onChange={(ev) => editImportRow(r._sourceRow, { category: ev.target.value })}
                                  className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                  {ALL_CATEGORIES.map((c) => (
                                    <option key={c.name} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                                {r.categoryWasFallback && r.originalCategoryRaw && (
                                  <p className="mt-1 text-xs text-warning">
                                    non reconnue : « {r.originalCategoryRaw} »
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={r.type}
                                  onChange={(ev) => editImportRow(r._sourceRow, { type: ev.target.value })}
                                  className="w-full rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                  <option value="Dépense">Dépense</option>
                                  <option value="Revenu">Revenu</option>
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  value={isNaN(r.amount) ? "" : r.amount}
                                  onChange={(ev) => editImportRow(r._sourceRow, { amount: ev.target.value })}
                                  placeholder="0"
                                  className={`w-full rounded-lg border px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring ${
                                    r.fieldErrors.amount ? "border-destructive" : "border-border"
                                  }`}
                                />
                                {r.fieldErrors.amount && (
                                  <p className="mt-1 text-xs text-destructive">{r.fieldErrors.amount}</p>
                                )}
                              </td>
                            </tr>
                          );
                        }

                        // ---- Ligne valide, mais doublon probable : décision explicite ----
                        if (r._isDuplicate) {
                          return (
                            <tr key={r._sourceRow} className="border-t border-border bg-warning/10">
                              <td className="px-3 py-2"></td>
                              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                                {new Date(r.date).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="px-3 py-2 font-medium">{r.description}</td>
                              <td className="px-3 py-2 text-muted-foreground">{r.category}</td>
                              <td className="px-3 py-2 text-muted-foreground">{r.type}</td>
                              <td className="px-3 py-2">
                                <div
                                  className={`text-right tabular-nums font-medium mb-1.5 ${
                                    r.type === "Revenu" ? "text-success" : "text-destructive"
                                  }`}
                                >
                                  {r.type === "Revenu" ? "+" : "-"}
                                  {formatMGA(r.amount)}
                                </div>
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setDuplicateDecision(r._sourceRow, true)}
                                    title="C'est bien un doublon : ne pas importer cette ligne"
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
                                      r._excluded
                                        ? "border-warning/40 bg-warning/15 text-warning"
                                        : "border-border text-muted-foreground hover:bg-muted"
                                    }`}
                                  >
                                    <ShieldAlert className="h-3 w-3" />
                                    Doublon
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDuplicateDecision(r._sourceRow, false)}
                                    title="Ce n'est pas un doublon : importer cette ligne quand même"
                                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
                                      !r._excluded
                                        ? "border-success/40 bg-success/15 text-success"
                                        : "border-border text-muted-foreground hover:bg-muted"
                                    }`}
                                  >
                                    <ShieldCheck className="h-3 w-3" />
                                    Pas un doublon
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        // ---- Ligne valide, standard : simple case à cocher ----
                        return (
                          <tr
                            key={r._sourceRow}
                            className={`border-t border-border ${r._excluded ? "opacity-40" : ""}`}
                          >
                            <td className="px-3 py-2">
                              <Checkbox
                                checked={!r._excluded}
                                onCheckedChange={() => toggleRowExcluded(r._sourceRow)}
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                              {new Date(r.date).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-3 py-2 font-medium">{r.description}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {r.category}
                              {r.categoryWasFallback && r.originalCategoryRaw && (
                                <span className="ml-1.5 text-xs text-warning">
                                  (non reconnue : « {r.originalCategoryRaw} »)
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{r.type}</td>
                            <td
                              className={`px-3 py-2 text-right tabular-nums font-medium ${
                                r.type === "Revenu" ? "text-success" : "text-destructive"
                              }`}
                            >
                              {r.type === "Revenu" ? "+" : "-"}
                              {formatMGA(r.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <button
              type="button"
              onClick={closeImportPreview}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={importing || !importPreview?.rows.length}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {importing ? "Import en cours…" : "Confirmer l'import"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
