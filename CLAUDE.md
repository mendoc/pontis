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
- **Thème :** Radix UI `<Theme>` avec accent `gray`, radius `none`, mode sombre automatique (détection système via script inline dans `layout.tsx`).
- **Langue :** HTML `lang="fr"`, contenu et variables majoritairement en français.
- **Composants :** `'use client'` explicite en haut de chaque fichier client. Pas de Server Components dans les pages interactives.

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

## Appels API

Tous les appels fetch utilisent le header `Authorization: Bearer ${accessToken}`. Endpoints principaux sous `/api/v1/` :
- Auth : `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/reset-password`, `/auth/gitlab`
- Projets : `/projects` (list/create), `/projects/{id}` (get/rename/delete), `/projects/{id}/start|stop|restart`
- Upload : `/projects/upload/init`, `/upload/chunk`, `/upload/finalize`, `/upload/redeploy`
- Ressources projet : `/projects/{id}/deployments`, `/logs`, `/env`, `/notifications`, `/terminal`

## Déploiement

- **Output Next.js :** `standalone` — le build génère un dossier `.next/standalone` auto-suffisant.
- **Docker :** build multi-stage (deps → builder → runner), utilisateur non-root `nextjs`, port 3000.
- **Production :** `docker-compose.yml` avec Traefik (domaine `pontis.ongoua.pro`, TLS).
- **Variable d'environnement clé :** `INTERNAL_API_URL` pour pointer vers le backend.
