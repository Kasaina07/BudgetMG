// ============================================================================
// services/sync.js
// Phase 3 : Offline-first avancé & synchronisation intelligente
// ============================================================================
// Stratégie retenue (volontairement simple et robuste, cf. contrainte
// "prioriser simplicité + robustesse" — clé en contexte de connectivité
// faible/instable) :
//
//   1. PUSH — on envoie au cloud tout enregistrement local marqué `dirty`.
//      - `synced_at === null`  → jamais envoyé  → INSERT distant.
//      - `synced_at` renseigné → déjà existant  → UPDATE distant
//        (y compris pour une suppression : elle est soft-delete localement,
//        donc `deleted_at` fait simplement partie du payload envoyé).
//
//   2. PULL — on récupère les enregistrements distants modifiés depuis la
//      dernière synchro (`remoteListSince`) et on les fusionne localement :
//      - Si l'enregistrement local est `dirty` (modif locale pas encore
//        envoyée) → **on garde la version locale** ("priorité des données
//        locales" demandée dans le cahier des charges). Elle sera renvoyée
//        au prochain push et écrasera le serveur.
//      - Sinon → dernière écriture gagne, comparaison sur `updated_at`.
//
// Il n'y a pas de file d'attente séparée (`syncQueue` explicite) : le flag
// `dirty` sur chaque enregistrement JOUE ce rôle. C'est plus simple à
// maintenir et ça survit nativement à un rechargement de page ou un crash,
// puisqu'il est déjà persisté dans la même DB locale.
//
// La détection réseau, le retry avec backoff et l'appel périodique sont
// gérés côté React par hooks/useOfflineSync.js — ce fichier ne fait que la
// mécanique de synchro elle-même, testable indépendamment de l'UI.
// ============================================================================

import { list, markSynced, mergeRemote, getMeta, setMeta, TABLES } from "./storage";
import { remoteCreate, remoteUpdate, remoteListSince } from "./supabase";

// Champs qui n'existent que côté local (bookkeeping de synchro) : jamais
// envoyés à Supabase, qui n'a pas ces colonnes.
const LOCAL_ONLY_FIELDS = ["dirty", "synced_at"];

function toRemotePayload(record) {
  const payload = { ...record };
  for (const field of LOCAL_ONLY_FIELDS) delete payload[field];
  return payload;
}

function getDirtyRecords(table) {
  // includeDeleted: une suppression en attente de synchro est aussi "dirty".
  return list(table, { includeDeleted: true }).filter((r) => r.dirty);
}

/** Envoie tous les changements locaux en attente vers Supabase. */
export async function pushChanges(userId) {
  if (!userId) return { pushed: 0, failed: 0 };

  let pushed = 0;
  let failed = 0;

  for (const table of Object.values(TABLES)) {
    for (const record of getDirtyRecords(table)) {
      try {
        const payload = toRemotePayload(record);
        const remote = record.synced_at
          ? await remoteUpdate(table, record.id, payload)
          : await remoteCreate(table, payload, userId);
        markSynced(table, record.id, remote.updated_at);
        pushed += 1;
      } catch (err) {
        // On laisse `dirty: true` : le prochain passage réessaiera cette ligne.
        console.error(`[sync] Échec d'envoi ${table}/${record.id} :`, err.message);
        failed += 1;
      }
    }
  }

  return { pushed, failed };
}

/** Récupère les changements distants (autres appareils) et les fusionne localement. */
export async function pullChanges(userId) {
  if (!userId) return { pulled: 0, failed: 0 };

  const { lastSyncedAt } = getMeta();
  let pulled = 0;
  let failed = 0;

  for (const table of Object.values(TABLES)) {
    try {
      const remoteRecords = await remoteListSince(table, lastSyncedAt);
      for (const remoteRecord of remoteRecords) {
        mergeRemote(table, remoteRecord);
        pulled += 1;
      }
    } catch (err) {
      console.error(`[sync] Échec de récupération ${table} :`, err.message);
      failed += 1;
    }
  }

  return { pulled, failed };
}

/**
 * Cycle de synchro complet : push puis pull. Ne fait rien si hors-ligne ou
 * non authentifié (appelant responsable de vérifier `navigator.onLine`).
 */
export async function runSync(userId) {
  if (!userId) return { skipped: true };

  const pushResult = await pushChanges(userId);
  const pullResult = await pullChanges(userId);
  setMeta({ lastSyncedAt: new Date().toISOString() });

  const failed = pushResult.failed + pullResult.failed;
  if (failed > 0) {
    throw new Error(`${failed} élément(s) n'ont pas pu être synchronisés`);
  }

  return { ...pushResult, ...pullResult };
}
