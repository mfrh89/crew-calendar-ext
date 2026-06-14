# Crew Calendar Extension

Chrome extension (WXT + TypeScript) that overlays personal ICS calendar events as colored dots onto airline crew scheduling tools (Lufthansa CRA).

## Structure

- `entrypoints/background.ts` — alarm-based ICS sync, stores events per month
- `entrypoints/content.ts` — detects canvas day bar, injects strip + banner
- `entrypoints/popup/` — extension popup (sync status)
- `entrypoints/options/` — settings UI (calendar sources, target URL)
- `lib/dom/detector.ts` — canvas pixel analysis for day bar detection + left offset
- `lib/dom/injector.ts` — strip/banner DOM injection
- `lib/dom/observer.ts` — MutationObserver for re-render on DOM changes
- `lib/caldav/parser.ts` — ICS parsing via ical.js
- `lib/storage/` — browser.storage wrappers for events + settings

## Commands

- `npm run dev` — dev mode with hot reload
- `npm run build` — production build to `.output/chrome-mv3/`
- `npm run compile` — typecheck only

## Build & Release

Build output goes to `.output/chrome-mv3/`. ZIP for distribution: `cd .output && zip -r crew-calendar-ext-<version>.zip chrome-mv3/`. Releases via `gh release create`.

## Key Concepts

- Canvas day bar has 32 columns (days of month + overflow into next month)
- Left offset detected by scanning canvas pixels for vertical grid lines
- Offset is cached per canvas dimensions to prevent drift on month switch
- Strip uses CSS grid matching the canvas column layout
- The target crew tool renders everything on a `<canvas>` element — no DOM elements for individual days

## Testing

No automated tests. Manual testing via the real crew tool (requires VPN/access) or the mock page. The mock page does not exercise canvas offset detection.

@~/.claude/design.md
