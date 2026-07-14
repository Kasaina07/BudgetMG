// ============================================================================
// services/supabase.js
// Phase 1 : Fondations données — client cloud Supabase
// ============================================================================
// Ce fichier ne fait que DEUX choses volontairement :
//   1. Initialiser le client Supabase (auth + base de données).
//   2. Exposer des fonctions CRUD génériques côté cloud, avec la MÊME forme
//      d'API que services/storage.js (list/get/create/update/remove), pour
//      que les hooks (phase 4) puissent parler indifféremment au local ou
//      au cloud sans changer leur code.
//
// L'authentification (phase 2) et la logique de synchro/queue (phase 3) ne
// sont PAS ici : elles vivront dans hooks/useAuth.js et services/sync.js.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants. " +
      "Copiez .env.example vers .env.local et renseignez vos clés Supabase."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Fait correspondre les noms de tables "app" (storage.js) aux tables Postgres réelles. */
export const REMOTE_TABLES = Object.freeze({
  transactions: "transactions",
  budget: "budget_lines",
  goals: "savings_goals",
});

function remoteTableName(table) {
  const name = REMOTE_TABLES[table];
  if (!name) throw new Error(`[supabase] Table inconnue: ${table}`);
  return name;
}

/**
 * Liste les enregistrements distants d'un utilisateur.
 * RLS garantit déjà l'isolation par utilisateur côté serveur ; on ne filtre
 * ici que sur des critères métier optionnels (mois, catégorie, ...).
 */
export async function remoteList(table, { filter, sort, limit, includeDeleted = false } = {}) {
  let query = supabase.from(remoteTableName(table)).select("*");

  if (!includeDeleted) query = query.is("deleted_at", null);
  if (filter) {
    for (const [key, value] of Object.entries(filter)) query = query.eq(key, value);
  }
  if (sort) {
    const desc = sort.startsWith("-");
    query = query.order(desc ? sort.slice(1) : sort, { ascending: !desc });
  }
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function remoteCreate(table, data, userId) {
  const { data: created, error } = await supabase
    .from(remoteTableName(table))
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function remoteUpdate(table, id, patch) {
  const { data: updated, error } = await supabase
    .from(remoteTableName(table))
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

/** Soft delete distant (cohérent avec storage.js) : on renseigne deleted_at plutôt que DELETE. */
export async function remoteRemove(table, id) {
  const { error } = await supabase
    .from(remoteTableName(table))
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return { id };
}

/** Enregistrements distants modifiés après une date donnée — brique clé pour la synchro (phase 3). */
export async function remoteListSince(table, isoDate) {
  const { data, error } = await supabase
    .from(remoteTableName(table))
    .select("*")
    .gt("updated_at", isoDate ?? "1970-01-01");
  if (error) throw error;
  return data;
}
