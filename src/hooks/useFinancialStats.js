// ============================================================================
// hooks/useFinancialStats.js
// Phase 4 : Système de calcul avancé + Dashboard intelligent
// ============================================================================
// Compose useTransactions() + useBudget() pour produire tous les indicateurs
// dont le Dashboard a besoin :
//   - solde en temps réel (toutes transactions confondues, pas seulement la période)
//   - KPI de la période (revenus, dépenses, épargne, taux d'épargne, reste à vivre)
//   - variation en % vs la période précédente
//   - dépenses par catégorie (pour le camembert)
//   - budget prévu vs réel par catégorie + alertes de dépassement
//   - agrégation mensuelle sur l'année (pour les tendances)
//   - prévision simple ("forecast") de fin de mois et du mois suivant
//
// Le forecast est volontairement simple (règle de trois / moyenne mobile),
// pas un modèle statistique — cohérent avec "prioriser simplicité + robustesse".
// ============================================================================

import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudget } from "@/hooks/useBudget";
import { ALL_CATEGORIES, getCategoryGroup } from "@/lib/budgetCategories";

function computeKpis(transactions) {
  const revenus = transactions.filter((t) => t.type === "Revenu").reduce((s, t) => s + t.amount, 0);
  const depenses = transactions.filter((t) => t.type === "Dépense").reduce((s, t) => s + t.amount, 0);
  const depensesFixes = transactions
    .filter((t) => t.type === "Dépense" && getCategoryGroup(t.category) === "Dépenses fixes")
    .reduce((s, t) => s + t.amount, 0);
  const epargne = revenus - depenses;
  const taux = revenus ? (epargne / revenus) * 100 : 0;
  const reste = revenus - depensesFixes;
  return { revenus, depenses, epargne, taux, reste };
}

/** Variation en % entre une valeur courante et une valeur précédente (0 si non calculable). */
function variation(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function previousPeriod(month, year) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

function inPeriod(dateStr, month, year) {
  const d = new Date(dateStr);
  return d.getMonth() + 1 === month && d.getFullYear() === year;
}

/**
 * @param {object} [options]
 * @param {number} [options.month] - défaut : mois en cours
 * @param {number} [options.year] - défaut : année en cours
 */
export function useFinancialStats({ month, year } = {}) {
  const now = new Date();
  const m = month || now.getMonth() + 1;
  const y = year || now.getFullYear();

  const { allTransactions, loading: loadingTx } = useTransactions();
  const { lines: budgetLines, getValue: getBudgetValue, loading: loadingBudget } = useBudget({ year: y });

  const periodTx = useMemo(
    () => allTransactions.filter((t) => inPeriod(t.date, m, y)),
    [allTransactions, m, y]
  );

  const { month: prevMonth, year: prevYear } = previousPeriod(m, y);
  const previousTx = useMemo(
    () => allTransactions.filter((t) => inPeriod(t.date, prevMonth, prevYear)),
    [allTransactions, prevMonth, prevYear]
  );

  const kpis = useMemo(() => computeKpis(periodTx), [periodTx]);
  const previousKpis = useMemo(() => computeKpis(previousTx), [previousTx]);

  const variations = useMemo(
    () => ({
      revenus: variation(kpis.revenus, previousKpis.revenus),
      depenses: variation(kpis.depenses, previousKpis.depenses),
      epargne: variation(kpis.epargne, previousKpis.epargne),
    }),
    [kpis, previousKpis]
  );

  /** Solde réel = somme de TOUTES les transactions à date, pas seulement la période affichée. */
  const soldeTempsReel = useMemo(
    () => allTransactions.reduce((s, t) => s + (t.type === "Revenu" ? t.amount : -t.amount), 0),
    [allTransactions]
  );

  const depensesParCategorie = useMemo(() => {
    const map = {};
    periodTx
      .filter((t) => t.type === "Dépense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodTx]);

  /** Prévu vs réel + alerte de dépassement, catégorie par catégorie, pour la période affichée. */
  const budgetParCategorie = useMemo(() => {
    return ALL_CATEGORIES.filter((c) => c.type === "Dépense").map((c) => {
      const prevu = getBudgetValue(c.name, m);
      const reel = periodTx
        .filter((t) => t.category === c.name && t.type === "Dépense")
        .reduce((s, t) => s + t.amount, 0);
      const restant = prevu - reel;
      return {
        category: c.name,
        group: c.group,
        prevu,
        reel,
        restant,
        depasse: prevu > 0 && restant < 0,
      };
    });
    // budgetLines est inclus pour re-calculer quand les montants prévus changent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetLines, periodTx, getBudgetValue, m]);

  const alertesBudget = useMemo(
    () => budgetParCategorie.filter((b) => b.depasse),
    [budgetParCategorie]
  );

  /** Revenus/dépenses/épargne mois par mois, pour l'année sélectionnée (tendances). */
  const agregationMensuelle = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const tx = allTransactions.filter((t) => inPeriod(t.date, monthNum, y));
      const { revenus, depenses, epargne } = computeKpis(tx);
      return { month: monthNum, revenus, depenses, epargne };
    });
  }, [allTransactions, y]);

  /**
   * Prévision simple, sans dépendance externe :
   *  - finDeMoisDepenses : projette la dépense totale du mois en cours au
   *    prorata des jours déjà écoulés (utile en cours de mois).
   *  - moyenneEpargne3Mois : moyenne mobile de l'épargne des 3 derniers mois
   *    avec de l'historique, comme approximation de la tendance à venir.
   */
  const forecast = useMemo(() => {
    const isCurrentMonth = m === now.getMonth() + 1 && y === now.getFullYear();
    let finDeMoisDepenses = null;
    if (isCurrentMonth) {
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(y, m, 0).getDate();
      finDeMoisDepenses = daysInMonth > 0 ? (kpis.depenses / dayOfMonth) * daysInMonth : kpis.depenses;
    }

    const historique = agregationMensuelle
      .filter((row) => row.revenus > 0 || row.depenses > 0)
      .slice(0, m - 1); // mois déjà passés cette année, dans l'ordre chronologique
    const derniers3 = historique.slice(-3);
    const moyenneEpargne3Mois = derniers3.length
      ? derniers3.reduce((s, r) => s + r.epargne, 0) / derniers3.length
      : null;

    return { finDeMoisDepenses, moyenneEpargne3Mois };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, y, kpis, agregationMensuelle]);

  return {
    loading: loadingTx || loadingBudget,
    kpis,
    previousKpis,
    variations,
    soldeTempsReel,
    depensesParCategorie,
    budgetParCategorie,
    alertesBudget,
    agregationMensuelle,
    forecast,
  };
}
