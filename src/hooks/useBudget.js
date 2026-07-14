// ============================================================================
// hooks/useBudget.js
// Phase 4 : Hooks React personnalisés — logique métier du budget prévisionnel
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { list, create, update, TABLES } from "@/services/storage";

/** @param {object} [options] @param {number} [options.year] - défaut : année en cours */
export function useBudget({ year } = {}) {
  const targetYear = year || new Date().getFullYear();
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    setLines(list(TABLES.BUDGET_LINES, { filter: { year: targetYear } }));
    setLoading(false);
  }, [targetYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function handle(e) {
      if (!e.detail?.table || e.detail.table === TABLES.BUDGET_LINES) refresh();
    }
    window.addEventListener("storage:changed", handle);
    window.addEventListener("storage:synced", handle);
    return () => {
      window.removeEventListener("storage:changed", handle);
      window.removeEventListener("storage:synced", handle);
    };
  }, [refresh]);

  // map[category][month] = ligne de budget, pour un accès O(1) depuis l'UI (grille)
  const map = useMemo(() => {
    const m = {};
    lines.forEach((l) => {
      if (!m[l.category]) m[l.category] = {};
      m[l.category][l.month] = l;
    });
    return m;
  }, [lines]);

  const getValue = useCallback((category, month) => map[category]?.[month]?.planned_amount || 0, [map]);

  /** Crée ou met à jour la ligne de budget d'une catégorie/mois. */
  const setValue = useCallback(
    (category, month, value) => {
      const amount = Number(value) || 0;
      const existing = map[category]?.[month];
      const record = existing
        ? update(TABLES.BUDGET_LINES, existing.id, { planned_amount: amount })
        : create(TABLES.BUDGET_LINES, { category, month, year: targetYear, planned_amount: amount });
      refresh();
      return record;
    },
    [map, targetYear, refresh]
  );

  /** Applique la valeur de janvier à tous les mois de l'année pour une catégorie. */
  const duplicateAcrossYear = useCallback(
    (category) => {
      const value = getValue(category, 1);
      for (let m = 1; m <= 12; m++) {
        if (getValue(category, m) !== value) setValue(category, m, value);
      }
    },
    [getValue, setValue]
  );

  const rowTotal = useCallback(
    (category) => Array.from({ length: 12 }, (_, i) => getValue(category, i + 1)).reduce((s, v) => s + v, 0),
    [getValue]
  );

  return { lines, loading, year: targetYear, getValue, setValue, duplicateAcrossYear, rowTotal, refresh };
}
