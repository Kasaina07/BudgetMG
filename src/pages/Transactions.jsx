import { useMemo, useState } from "react";
import { Plus, Search, FileDown, FileSpreadsheet, FileUp } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionImport } from "@/hooks/useTransactionImport";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import TransactionFormFields from "@/components/transactions/TransactionFormFields";
import TransactionsList from "@/components/transactions/TransactionsList";
import ImportPreviewDialog from "@/components/transactions/ImportPreviewDialog";
import { exportTransactionsToPDF, exportTransactionsToExcel } from "@/lib/export";
import { ALL_CATEGORIES, MONTHS, formatMGA, getCategoryType } from "@/lib/budgetCategories";

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: ALL_CATEGORIES[0]?.name || "",
  type: getCategoryType(ALL_CATEGORIES[0]?.name),
  amount: "",
};

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

  // --- Formulaire d'ajout / édition ---
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // --- Import Excel / CSV : toute la logique vit dans ce hook dédié ---
  const {
    fileInputRef,
    importPreview,
    importing,
    handleImportClick,
    handleFileSelected,
    editImportRow,
    toggleRowExcluded,
    setDuplicateDecision,
    closeImportPreview,
    confirmImport,
  } = useTransactionImport({ allTransactions, importTransactions });

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

  const total = filtered.reduce((s, t) => s + (t.type === "Revenu" ? t.amount : -t.amount), 0);

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
    setTransactionToDelete(t);
  }

  function confirmDeleteTransaction() {
    if (!transactionToDelete) return;
    const t = transactionToDelete;
    removeTransaction(t.id);
    toast({ title: "Transaction supprimée", description: t.description });
    if (editingId === t.id) cancelEdit();
    setTransactionToDelete(null);
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
          aria-label="Filtrer par mois"
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
            aria-label="Rechercher une transaction"
            className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filtrer par catégorie"
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

      <TransactionsList
        loading={loading}
        filtered={filtered}
        hasAnyTransaction={transactions.length > 0}
        onEdit={startEdit}
        onDelete={handleDelete}
      />

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

      <ImportPreviewDialog
        importPreview={importPreview}
        importing={importing}
        editImportRow={editImportRow}
        toggleRowExcluded={toggleRowExcluded}
        setDuplicateDecision={setDuplicateDecision}
        closeImportPreview={closeImportPreview}
        confirmImport={confirmImport}
      />

      <ConfirmDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
        title="Supprimer cette transaction ?"
        description={
          transactionToDelete
            ? `"${transactionToDelete.description}" sera définitivement supprimée. Cette action est irréversible.`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={confirmDeleteTransaction}
      />
    </div>
  );
}
