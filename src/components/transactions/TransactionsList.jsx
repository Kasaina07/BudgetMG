import { useEffect, useState } from "react";
import { Pencil, Trash2, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeletons";
import { formatMGA } from "@/lib/budgetCategories";

const PAGE_SIZE = 50;

/**
 * Affiche les transactions filtrées : cartes empilées sur mobile (un tableau
 * qui défile horizontalement est pénible au pouce), tableau classique sur
 * desktop. Gère aussi les états de chargement et "aucun résultat".
 *
 * Pagination côté client par lots de 50 : au-delà de quelques centaines de
 * lignes (import Excel massif, plusieurs années d'historique), afficher tout
 * d'un coup ralentit le rendu — surtout sur les téléphones d'entrée de gamme
 * visés par l'app. Une vraie virtualisation (react-virtual) irait plus loin,
 * mais la pagination suffit largement ici et n'ajoute aucune dépendance.
 */
export default function TransactionsList({
  loading,
  filtered,
  hasAnyTransaction,
  onEdit,
  onDelete,
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Revenir à la page 1 dès que la liste filtrée change (nouvelle recherche,
  // changement de mois/catégorie) — sinon on peut se retrouver sur une page
  // vide après avoir filtré une liste plus courte.
  useEffect(() => {
    setPage(1);
  }, [filtered]);

  const currentPage = Math.min(page, pageCount);
  const pageItems =
    filtered.length > PAGE_SIZE
      ? filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
      : filtered;

  if (loading) {
    return (
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
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={hasAnyTransaction ? "Aucun résultat pour ces filtres" : "Aucune transaction pour le moment"}
        description={
          hasAnyTransaction
            ? "Essayez une autre recherche ou réinitialisez les filtres."
            : "Ajoutez votre première transaction avec le bouton + ci-dessous."
        }
      />
    );
  }

  return (
    <>
      {/* Liste en cartes — mobile uniquement. Une table qui défile horizontalement est
          pénible au pouce ; ici chaque transaction tient sur une carte, actions à portée. */}
      <ul className="md:hidden space-y-2">
        {pageItems.map((t) => (
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
                onClick={() => onEdit(t)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground touch-target"
                title="Modifier"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(t)}
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
              {pageItems.map((t) => (
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
                        onClick={() => onEdit(t)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground touch-target"
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(t)}
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

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted-foreground">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} sur{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Page précédente"
              className="touch-target p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              aria-label="Page suivante"
              className="touch-target p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
