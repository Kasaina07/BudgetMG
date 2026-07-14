# Budget MGA — Dashboard

Application de suivi budgétaire personnel : React (Vite) + Tailwind CSS côté
frontend, Supabase (Postgres + Auth) côté cloud, avec un fonctionnement
offline-first (localStorage + synchronisation automatique).

## Prérequis

- **Node.js ≥ 18.18** (voir `.nvmrc`). Vérifiez avec `node -v`.
- Un compte [Supabase](https://supabase.com) (gratuit) pour le backend.

## Installation

```bash
npm install
```

> Si `npm install` échoue avec une erreur `ERESOLVE` (conflit de versions),
> relancez avec :
> ```bash
> npm install --legacy-peer-deps
> ```
> Voir la section [Dépannage](#dépannage) plus bas pour les autres cas fréquents.

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécutez le contenu de `supabase/schema.sql` (crée les
   tables `transactions`, `budget_lines`, `savings_goals` et leurs règles de
   sécurité RLS).
3. Copiez `.env.example` vers `.env.local` :
   ```bash
   cp .env.example .env.local
   ```
4. Renseignez vos clés (**Project Settings → API** dans Supabase) :
   ```bash
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
   ```

## Lancer le projet en local

```bash
npm run dev
```

Ouvrez l'URL affichée par Vite (par défaut `http://localhost:5173`).

## Scripts disponibles

| Commande          | Description                              |
|--------------------|-------------------------------------------|
| `npm run dev`      | Serveur de développement (hot reload)     |
| `npm run build`    | Build de production dans `dist/`          |
| `npm run preview`  | Prévisualise le build de production       |

## Structure du projet

```
src/
├── pages/          # Dashboard, Transactions, Budget, Goals, Login
├── components/      # UI (shadcn/ui) + composants applicatifs
├── hooks/            # useAuth, useTransactions, useBudget, useSavingsGoals,
│                     # useOfflineSync, useFinancialStats
├── services/
│   ├── storage.js   # Base locale (localStorage), CRUD, versionnement
│   ├── supabase.js  # Client Supabase + CRUD distant
│   └── sync.js       # Push/pull, résolution de conflits
└── lib/              # Utilitaires (catégories budgétaires, export PDF/Excel)
supabase/
└── schema.sql        # Schéma Postgres + RLS à exécuter dans Supabase
```

## Dépannage

**`npm install` échoue avec une erreur `ERESOLVE` / conflit de peer dependencies**
Essayez :
```bash
npm install --legacy-peer-deps
```
Si le problème persiste, supprimez `node_modules` et `package-lock.json` puis
réinstallez :
```bash
rm -rf node_modules package-lock.json
npm install
```

**`npm install` échoue avec une erreur liée à la version de Node**
Ce projet nécessite Node ≥ 18.18. Avec [nvm](https://github.com/nvm-sh/nvm) :
```bash
nvm install
nvm use
```

**L'app se lance mais affiche une page blanche / erreur dans la console**
Vérifiez que `.env.local` existe bien à la racine et contient des valeurs
Supabase valides (pas les valeurs d'exemple de `.env.example`).

**Erreur de connexion à Supabase / "Invalid API key"**
Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` correspondent
bien à votre projet (Project Settings → API), et que le fichier `.env.local`
est à la racine du projet (au même niveau que `package.json`), pas dans `src/`.
