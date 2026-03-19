# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes de développement

```bash
npm run dev        # Serveur de développement (port 3000)
npm run build      # Build de production
npm start          # Serveur de production
npm run type-check # Vérification TypeScript (tsc --noEmit)
```

Aucun framework de test ni linter n'est configuré pour ce package.

## Architecture

**Pontis Web** est le frontend d'une plateforme PaaS auto-hébergée (alternative à Netlify/Vercel). Ce dépôt est autonome et se déploie indépendamment des autres services Pontis (`api`, `webhook`, `docs`).

**Stack :** Next.js 15 (App Router) · React 19 · TypeScript strict · Radix UI Themes v3

## Structure & conventions

- **App Router** (`app/`) avec deux route groups principaux : `(auth)` pour les pages publiques, `(dashboard)` pour les pages protégées avec layout sidebar + topbar.
- **Alias de chemin :** `@/*` → racine du projet (`./`).
- **Proxy API :** Next.js redirige `/api/*` vers `INTERNAL_API_URL` (défaut : `http://localhost:3001`) via `next.config.ts`.
- **Thème :** `app/components/ThemeProvider.tsx` expose `useThemeMode()` (modes `light`/`dark`/`system`, persisté dans `localStorage['pontis-theme']`). Un script inline dans `layout.tsx` applique la classe `.dark` avant hydratation pour éviter le flash. `ThemeProvider` encapsule le `<Theme>` Radix (accent `gray`, radius `none`).
- **Langue :** HTML `lang="fr"`, contenu et variables majoritairement en français.
- **Composants :** `'use client'` explicite en haut de chaque fichier client. Pas de Server Components dans les pages interactives.
- **Layout racine** (`app/layout.tsx`) : `AuthProvider > ThemeProvider > {children}`.
- **Layout dashboard** (`app/(dashboard)/layout.tsx`) : `ProjectsProvider > ToastProvider > layout`. Contient inline `Sidebar`, `Topbar`, `ProjectSwitcher` et `ThemeToggle`. `ProjectSwitcher` apparaît dans la topbar uniquement sur les routes `/projects/[id]/*` et permet de changer de projet en conservant l'onglet courant.
- **Route `/projects/[id]`** redirige automatiquement vers `/projects/[id]/settings`.
- **OAuth GitLab** : `/auth/callback` attend la fin du `refreshSession()` puis redirige vers `/dashboard` ou `/login`.

## Middleware (middleware.ts)

Trois rôles dans cet ordre :
1. Proxy `/api/*` → backend `INTERNAL_API_URL`
2. Protection : absence de `refresh_token` sur page protégée → redirection `/login`
3. Redirection : utilisateur connecté sur page publique (login/register) → `/dashboard`

## Contextes (app/context/)

**`AuthContext` (auth.tsx)** — État global d'authentification :
- Stocke `accessToken` (JWT), `userId`, `email`, `name`
- `refreshSession()` appelé au montage pour renouveler le token via `/api/v1/auth/refresh`
- Décode le JWT manuellement (base64 payload) sans dépendance externe

**`ProjectsContext` (projects.tsx)** — CRUD des projets :
- Upload ZIP par chunks de 5 Mo : `init` → N×`chunk` → `finalize` (ou `redeploy`)
- Polling toutes les 2 s après création/redéploiement jusqu'à `status !== 'building'`
- `onProgress` callback utilisé pour afficher les phases (upload, build, SSL)
- Type `Project` : `{ id, name, slug, type?, status, domain, createdAt?, restartedAt? }`

## Composants partagés (app/components/)

- **`ThemeProvider.tsx`** — Gestion du thème (voir Structure & conventions)
- **`Toast.tsx`** — Notifications flottantes (coin bas-droit, auto-dismiss 4 s). Expose `ToastProvider` et `useToast()`. Utilise `@radix-ui/react-toast`. Usage : `const { toast } = useToast()` puis `toast('message')` ou `toast('message', 'error')`.

## Appels API

**Pattern `authFetch`** (défini dans `ProjectsContext`) : wrapper autour de `fetch` qui injecte le header `Authorization: Bearer ${accessToken}`. Sur erreur 401, il appelle `refreshSession()` pour renouveler le token et retente la requête une seule fois. Toujours utiliser `authFetch` (via les fonctions du contexte) pour les appels authentifiés.

Endpoints principaux sous `/api/v1/` :
- Auth : `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/reset-password`, `/auth/gitlab`
- Projets : `/projects` (list — supporte `page`, `limit`, `search`, `sortBy`, `sortOrder`), `/projects/{id}` (get/rename/delete), `/projects/{id}/start|stop|restart`
- Upload : `/projects/upload/init`, `/projects/upload/chunk`, `/projects/upload/finalize`, `/projects/upload/redeploy`
- Slug : `/projects/check-slug?slug=` → `{ available: boolean }`
- Ressources projet : `/projects/{id}/deployments`, `/logs`, `/env`, `/notifications`, `/terminal`
- Debug (dev) : `/projects/{id}/debug/container-inspect|stop|remove|create|start`

## Actions sensibles (restart / delete)

**Redémarrage** (`/projects/{id}/restart`) : recrée le container Docker depuis l'image existante — données non persistées perdues. Un `AlertDialog` de confirmation est affiché, une Toast confirme le succès ou l'échec, et `restartedAt` est mis à jour en base.

**Suppression** (`DELETE /projects/{id}`) : protégée par un `AlertDialog` qui exige que l'utilisateur saisisse le `slug` exact du projet pour valider. Redirige vers `/dashboard` après succès.

## Pages "coming soon"

Plusieurs rubriques de la navigation projet sont des stubs (`comingSoon: true` dans `getProjectNavItems`) — elles affichent l'icône `ClockIcon` et leur page ne contient qu'un squelette vide :
- Déploiements, Logs, Terminal, Variables d'env, Notifications (`/projects/[id]/{deployments,logs,terminal,env,notifications}`)
- Mon profil, Feedback (`/profile`, `/feedback`)

## Déploiement

- **Output Next.js :** `standalone` — le build génère un dossier `.next/standalone` auto-suffisant.
- **Docker :** build multi-stage (deps → builder → runner), utilisateur non-root `nextjs`, port 3000.
- **Production :** `docker-compose.yml` avec Traefik (domaine `pontis.ongoua.pro`, TLS).
- **Variable d'environnement clé :** `INTERNAL_API_URL` pour pointer vers le backend.
