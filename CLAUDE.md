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

- **App Router** (`app/`) avec route groups : `(auth)` regroupe les pages d'authentification sans affecter les URLs.
- **Alias de chemin :** `@/*` → racine du projet (`./`).
- **Proxy API :** Next.js redirige `/api/*` vers `INTERNAL_API_URL` (défaut : `http://localhost:3001`) via `next.config.ts`.
- **Thème :** Radix UI `<Theme>` avec accent `gray`, radius `none`, mode sombre automatique (détection système via script inline dans `layout.tsx`).
- **Langue :** HTML `lang="fr"`, contenu majoritairement en français.

## Déploiement

- **Output Next.js :** `standalone` — le build génère un dossier `.next/standalone` auto-suffisant.
- **Docker :** build multi-stage (deps → builder → runner), utilisateur non-root `nextjs`, port 3000.
- **Production :** `docker-compose.yml` avec Traefik (domaine `pontis.ongoua.pro`, TLS).
- **Variable d'environnement clé :** `INTERNAL_API_URL` pour pointer vers le backend.
