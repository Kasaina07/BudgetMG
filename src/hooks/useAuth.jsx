// ============================================================================
// hooks/useAuth.jsx
// Phase 2 : Authentification (Supabase Auth)
// ============================================================================
// Fournit :
//   - <AuthProvider> : à placer une fois, en haut de l'app (dans App.jsx).
//   - useAuth()       : hook consommé par les pages/composants pour lire
//                       l'utilisateur courant et déclencher signUp/signIn/signOut.
//
// Ce que fait ce fichier, et pourquoi :
//   - Écoute la session Supabase (supabase.auth.onAuthStateChange) pour rester
//     synchronisé même si le token est rafraîchi en arrière-plan.
//   - À chaque changement de session, met à jour services/storage.js
//     (_meta.userId) : c'est ce qui permettra, en phase 4, aux hooks
//     métier de savoir à quel utilisateur associer les données locales.
//   - À la déconnexion, vide la base locale (resetDB) pour éviter qu'un autre
//     utilisateur sur le même appareil/poste partagé voie les données du
//     précédent — important dans un contexte offline-first où tout reste
//     aussi en localStorage.
//
// Ce que ce fichier NE fait PAS (volontairement, ce sera la phase 3) :
//   - Il ne gère pas la file de synchronisation ni les conflits.
// ============================================================================

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { resetDB, setMeta } from "@/services/storage";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    function applySession(newSession) {
      if (!mounted) return;
      setSession(newSession);
      setMeta({ userId: newSession?.user?.id ?? null });
    }

    // 1. Récupère la session existante (rafraîchie automatiquement par le SDK
    //    si un token valide est déjà présent en localStorage — fonctionne donc
    //    même juste après une reconnexion réseau).
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      if (mounted) setLoading(false);
    });

    // 2. S'abonne à tout changement futur (login, logout, refresh de token).
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      applySession(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setMeta({ userId: data.session?.user?.id ?? null });
    setSession(data.session);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    resetDB(); // repart d'une base locale vierge pour le prochain utilisateur
    setSession(null);
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth() doit être utilisé à l'intérieur d'un <AuthProvider>.");
  }
  return ctx;
}
