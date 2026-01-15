# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A bilingual (Hebrew/English) on-screen keyboard web application built with React, TypeScript, and Vite. Designed for accessibility/specialized input scenarios.

## Development Commands

```bash
npm run dev      # Start dev server with HMR (http://localhost:5173)
npm run build    # TypeScript compilation + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

**Component Structure:**
- `App.tsx` - Main component managing state (lines array, currentLine string)
- `components/Keyboard.tsx` - Stateless keyboard UI with Hebrew/English layouts
- `components/TextDisplay.tsx` - Text rendering with RTL/LTR support
- `config.ts` - Language selection (`'hebrew' | 'english'`) and display settings

**State Flow:**
- State lives in App.tsx, callbacks passed down to Keyboard component
- Keyboard emits character/space/backspace/enter events up to App
- TextDisplay receives lines array and currentLine for rendering

**Key Behaviors:**
- Backspace at line start merges with previous line
- Display shows last N completed lines + current line (configurable via `maxVisibleLines`)
- RTL/LTR direction set via HTML `dir` attribute based on language config

## Build & Deployment

- Vite builds to `dist/` with base path `/keyboard/` for GitHub Pages
- GitHub Actions workflow deploys on push to `main` branch
- No testing framework currently configured
