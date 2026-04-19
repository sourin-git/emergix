# Project Context

Project: EMERGIX

- Monorepo (turbo)
- Existing mobile app: apps/mobile (Expo React Native)
- DO NOT delete or break this mobile app

# Goal

- Create a NEW web app inside: apps/web
- Convert logic from mobile → web
- Keep both apps working

# Rules

- DO NOT modify or delete apps/mobile
- Reuse:
  - store/
  - services/
  - shared-types/
- Web app must be separate

# Web Requirements

- Use Vite + React + TypeScript
- Use react-router-dom for navigation
- Use normal HTML/CSS (no React Native, no Expo)
- App must run with: npm run dev

# Architecture

- apps/mobile → untouched
- apps/web → new web app
- packages → shared logic

# Behavior

- Create files automatically
- Fix errors automatically
- Do not ask unnecessary questions