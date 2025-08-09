# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cinny is a Matrix client built with React/TypeScript focusing on simplicity, elegance, and security. It's a modern instant messaging application with a clean interface.

## Development Commands

### Core Commands
- `yarn start` or `npm start` - Start development server (runs on port 8080)
- `yarn build` or `npm run build` - Build production app to `dist/` directory
- `yarn lint` or `npm run lint` - Run ESLint and Prettier checks
- `yarn typecheck` or `npm run typecheck` - Run TypeScript type checking

### Linting Commands
- `yarn check:eslint` - Run ESLint only
- `yarn check:prettier` - Check Prettier formatting
- `yarn fix:prettier` - Auto-fix Prettier formatting

### Installation
- Use `npm ci` for clean installs (recommended for development)
- Node.js 16+ required (Iron LTS v20 recommended)

## Architecture Overview

### State Management
- **Jotai**: Primary state management library for reactive atoms
- **Matrix JS SDK**: Core Matrix protocol handling
- **React Query**: Server state management and caching
- State organized in `src/app/state/` with hooks in `src/app/state/hooks/`

### Key Directories Structure
- `src/app/` - Main application logic
  - `atoms/` - Reusable UI components (Avatar, Button, Input, etc.)
  - `components/` - Complex business components  
  - `features/` - Feature-specific modules (room, lobby, settings, etc.)
  - `hooks/` - Custom React hooks for business logic
  - `pages/` - Route-level components and routing logic
  - `state/` - Global state management with Jotai atoms
- `src/client/` - Matrix client initialization and management
- `public/` - Static assets (icons, sounds, locales)

### Matrix Client Architecture
- Matrix client initialization in `src/client/initMatrix.ts`
- Uses IndexedDB for persistent storage (sync store + crypto store)
- Rust crypto implementation for end-to-end encryption
- Session management with baseUrl, accessToken, userId, deviceId

### UI Architecture
- **Vanilla Extract**: CSS-in-TS styling system (`.css.ts` files)
- **React Router**: Client-side routing
- **Folds**: UI component library foundation
- Design system based on atoms → molecules → organisms pattern

### Key Features Architecture
- **Room Management**: Real-time messaging with Matrix rooms
- **Authentication**: Multiple auth flows (password, SSO, email, etc.)
- **Encryption**: End-to-end encryption with cross-signing
- **Media**: Image/video/file handling with thumbnails
- **Themes**: Dark/light mode support
- **PWA**: Service worker for offline capabilities

## Configuration

### Build Configuration
- `build.config.ts` - Build-time configuration (base path for subdirectory deployment)
- `config.json` - Runtime configuration (default homeservers, explore pages)
- `vite.config.js` - Vite bundler configuration

### Important Build Notes
- Uses Vite as bundler with React plugin
- WASM support for Matrix SDK crypto
- PWA service worker in `src/sw.ts`
- Static file copying for Matrix SDK dependencies

### TypeScript Configuration
- ES2016 target with ES2020 modules
- Strict mode enabled
- React JSX support
- DOM and ES2016 lib support

## Testing & Code Quality
- ESLint with Airbnb config + TypeScript rules
- Prettier for code formatting
- No explicit test framework detected - verify before writing tests

## Matrix Integration Notes
- Uses matrix-js-sdk v37.5.0
- Supports lazy loading of room members
- IndexedDB storage for offline support
- Crypto callbacks for secret storage
- Verification methods: m.sas.v1