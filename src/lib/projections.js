// ============================================================================
// lib/projections.js
// Fonctions pures de simulation "et si" (what-if) et de projection d'objectifs.
// Aucune dépendance externe, aucun accès au storage : facilement testable.
// ============================================================================

const MONTH_NAMES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Ex: "mars 2027" */
export function formatMonthYear(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Projette la date d'atteinte d'un objectif d'épargne à partir d'un rythme
 * mensuel constant. Renvoie null si le rythme est nul/négatif (pas de
 * projection possible) ou si l'objectif est déjà atteint.
 *
 * @param {number} currentAmount
 * @param {number} targetAmount
 * @param {number} monthlyContribution
 * @param {Date} [from]
 */
export function projectGoalDate(currentAmount, targetAmount, monthlyContribution, from = new Date()) {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return { reached: true, months: 0, date: from };
  if (!monthlyContribution || monthlyContribution <= 0) return null;

  const months = Math.ceil(remaining / monthlyContribution);
  return { reached: false, months, date: addMonths(from, months) };
}

/**
 * Simule l'effet d'une réduction de % sur les dépenses d'une catégorie,
 * sur l'épargne mensuelle et annuelle.
 *
 * @param {number} categoryMonthlySpend - dépense actuelle/moyenne de la catégorie sur le mois
 * @param {number} reductionPct - 0-100
 * @param {number} currentMonthlySavings - épargne mensuelle actuelle (kpis.epargne)
 */
export function simulateCategoryReduction(categoryMonthlySpend, reductionPct, currentMonthlySavings) {
  const monthlySaved = categoryMonthlySpend * (reductionPct / 100);
  return {
    monthlySaved,
    annualSaved: monthlySaved * 12,
    newMonthlySavings: currentMonthlySavings + monthlySaved,
    newCategorySpend: categoryMonthlySpend - monthlySaved,
  };
}

/**
 * Simule une trajectoire d'épargne : montant à chaque mois, en partant d'un
 * montant de départ et en ajoutant une contribution mensuelle constante.
 *
 * @returns {{month: number, amount: number}[]} de 0 (aujourd'hui) à `months`
 */
export function simulateSavingsPlan(startAmount, monthlyContribution, months) {
  return Array.from({ length: months + 1 }, (_, i) => ({
    month: i,
    amount: startAmount + monthlyContribution * i,
  }));
}
