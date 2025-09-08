# Smriti — One-Poem Memorization Web App (No Server)

## 1) Scope & Goals
- **Single poem** only.
- **Static site** (no build step, no service worker). Everything loads **on-demand** via `fetch()`.
- **Mobile-first**, **dark-only** theme; **sans-serif** fonts (bundled).
- Two pages: `index.html` (home list) and `verse.html` (shared detail page).

## 2) Directory Layout
```
/index.html
/verse.html
/assets/styles.css
/assets/app.js
/assets/fonts/            (Noto Sans Devanagari, Gentium Plus, Inter)
/assets/lib/             (snarkdown.min.js, dompurify.min.js)   // Markdown explanation
/data/manifest.json
/data/Verse{id}.hindi
/data/Verse{id}.transliterated
/data/Verse{id}.english
/data/Verse{id}.explanation
/data/Verse{id}.mp3
```
- `{id}` = **URL-safe slug** (letters/digits/hyphen/underscore). Case-sensitive; used in filenames and query string.

## 3) Data Contract

### `/data/manifest.json` — single source of truth for order
```json
{
  "verses": [
    { "id": "001", "number": 1, "title": "Optional display title" },
    { "id": "002", "number": 2 }
  ]
}
```
- Order of `verses[]` defines:
  - Home list order.
  - Prev/Next order on verse page.
- `number` is **display-only** (if missing, display the 1-based position).
- On the verse page header, show `title` if present, else `number`, else `id`.

### Verse files (UTF-8 text unless `.mp3`)
- `Verse{id}.hindi` — plain text. **Lines split on** `।` **or** `||`. Break **after** delimiter; **retain** delimiter at end of line.
- `Verse{id}.transliterated` — plain text. **Lines split on** `|` **or** `||`. Treat **single `|` as a line break**, retain delimiter.
- `Verse{id}.english` — plain text. Free-wrapped by CSS; no special splitting.
- `Verse{id}.explanation` — **Markdown**; render safely (parser + sanitizer).
- `Verse{id}.mp3` — **single audio per verse**, whole-verse play/pause (no per-line playback).

## 4) Navigation Flows

### Home (`index.html`)
- **App Name:** *Smriti* (UI branding).
- **Poem title:** **hard-coded** on the home page (not in manifest).
- On load: fetch `/data/manifest.json`. Render a simple list:
  - Each item shows **number/title** only (no preview).
  - Each item links to `verse.html?id={id}`.

### Verse (`verse.html`)
- **Query param:** `id` required.
- On load:
  1. Fetch `/data/manifest.json` to validate `id`, compute Prev/Next, and resolve display header (title → number → id).
  2. Render **header** with the verse display name; **header links back to Home**.
- **Initial state:** **no verse text visible** (only header). Content is shown via toggles.
- **Sticky bottom toolbar (compact icons + short labels)**, single row (horizontally scrollable on very small screens):
  - **Hindi**, **Speak**, **Translit**, **English**, **All**, **Explanation**, **Prev**, **Next**, **A−**, **A+`**
  - All buttons have `aria-label` and tooltips.
  - **Prev/Next disabled** at the ends (no wrap).
- **Visibility carry-over between verses** within the **same session** only (`sessionStorage`). On full refresh, reset to defaults.
- **Navigation is full page reload** (Prev/Next updates `?id=` and reloads). Audio stops on navigation. Toggles rehydrated from session.

## 5) Button Behavior

### Hindi (toggle)
- On first show: `fetch('/data/Verse{id}.hindi')`, **split** on `।` or `||`, **retain delimiter**, render each line in its own block.
- Missing file → inline message: “**Hindi not available for this verse**.”

### Translit (toggle)
- On first show: `fetch('/data/Verse{id}.transliterated')`, **split** on `|` or `||` (single `|` is a line break), **retain delimiter**, one line per block.
- Missing file → “**Transliteration not available for this verse**.”

### English (toggle)
- On first show: `fetch('/data/Verse{id}.english')`, render as a single block with normal wrapping.
- Missing file → “**English not available for this verse**.”

### Explanation (toggle; **not** part of “All”)
- On first show: `fetch('/data/Verse{id}.explanation')`, render as Markdown via **snarkdown → DOMPurify** into a styled `<section>`.
- Missing file → “**Explanation not available for this verse**.”

### All (master toggle for three verse blocks)
- Toggles **Hindi + Translit + English** together.
- If any are missing, show available ones and an unobtrusive **placeholder** (e.g., “Transliteration not available”).

### Speak (play/pause)
- Minimal control: toggle button that plays/pauses `/data/Verse{id}.mp3` at **1.0×**, **no loop**, **no seek bar**.
- On error/missing: “**Audio not available for this verse**.”

### A− / A+ (text size; session-only)
- Adjust CSS variable (e.g., `--verse-scale`) that scales **all verse content** (Hindi, Translit, English, Explanation).
- Clamp range (e.g., **0.9× → 1.6×**).

## 6) Parsing Rules (deterministic)

**Hindi**
- Split on `||` **and** `।`.
- Treat as **line terminators**; **retain** the delimiter at end of line.
- Trim whitespace around segments; drop empty trailing line if file ends with a delimiter.

**Transliteration**
- Split on `||` **and** `|` (single `|` = line break).
- Same rules as Hindi for retention/whitespace.

**English**
- No special parsing; display raw text; preserve existing line breaks.

## 7) Error Handling (user-visible)
- **Manifest load failure:** centered message “Could not load poem. Check your connection or hosting path.”
- **Invalid `id`:** show “Verse not found.” and a link back to Home.
- **Missing per-section files:** keep buttons active; on toggle, render a small inline “Not available…” message in that section.
- **Audio error:** message near Speak; page continues to function.

## 8) Accessibility
- All toolbar buttons are keyboard-focusable, have `aria-label`s, and show a visible focus ring.
- Landmarks: `<header>` (verse title), `<main>` (content blocks), `<nav>` (toolbar).
- **Keyboard shortcuts** (desktop; optional but included):
  - **Space** = play/pause
  - **← / →** = prev / next
  - **H / T / E** = toggle Hindi / Translit / English
  - **A** = toggle All
  - **- / =** (or `_ / +`) = text size down / up
- Ensure sufficient contrast in dark theme.

## 9) Styling Guidelines (dark-only)
- **Fonts**:
  - Hindi: **Noto Sans Devanagari**
  - Transliteration (diacritics): **Gentium Plus**
  - UI/English: **Inter**
- **Typography (mobile-first, adjustable via `--verse-scale`)**:
  - Hindi ~**1.25rem**, Transliteration ~**1.15rem**, English ~**1rem**
- **Layout**:
  - Header at top with verse display name (tappable back to Home).
  - Content blocks stacked in order: **Hindi → Transliteration → English**.
  - Sticky **bottom toolbar**, single row; horizontally scrollable on narrow devices.
  - Touch targets ≥ **40px** height; generous spacing.

## 10) Hosting Assumptions
- Serve via a static server (e.g., GitHub Pages, Netlify, S3, or local `python -m http.server` / VS Code Live Server).
- Ensure correct MIME for `.mp3`; text files can be served as `text/plain`.

## 11) Implementation Notes (vanilla ES modules)

**`/assets/app.js`**
- `loadManifest(): Promise<Manifest>`
- `getVerseList(m): VerseMeta[]` → `{ id, displayNumber, title? }`
- `findIndexById(m, id): number`
- `splitHindi(text): string[]`  // per rules
- `splitTranslit(text): string[]`
- `renderLines(container, lines: string[])`
- `renderEnglish(container, text: string)`
- `renderExplanation(container, markdown: string)` → snarkdown → DOMPurify
- `sessionVisibility`: `get()`, `set()` (Hindi/Translit/English/Explanation)
- `applyTextScale(scale)`, `incrementScale(delta)` (clamped)
- `initHome()` → load manifest, render list, link to `verse.html?id={id}`
- `initVerse()` → read `id`, load manifest, set header, wire toolbar, lazy-load sections/audio on demand, restore visibility from `sessionStorage`

**`index.html`**
- Hard-code poem title.
- Import `app.js` as an ES module and call `initHome()`.

**`verse.html`**
- Import `snarkdown.min.js`, `dompurify.min.js`, and `app.js` as ES modules; call `initVerse()`.

## 12) Testing Checklist
- [ ] Home loads manifest, shows ordered list with correct links.
- [ ] Verse with all files: toggles work; **All** toggles the three blocks; order is **Hindi → Translit → English**.
- [ ] Missing file(s): clicking shows “Not available…” inline; **All** shows placeholders for missing.
- [ ] Speak: plays/pauses; handles missing MP3 gracefully.
- [ ] Prev/Next: disabled correctly at first/last; full page reload occurs; visibility restored from session.
- [ ] Line splitting honors `।` / `||` (Hindi) and `|` / `||` (Translit); delimiters retained at end of lines.
- [ ] Text size controls scale content and clamp properly; toolbar remains usable on small screens.
- [ ] Dark theme contrast and font rendering (Noto Sans Devanagari, Gentium Plus) look good on small devices.
- [ ] Keyboard shortcuts work on desktop and don’t interfere with navigation.

---

**End of Spec — Smriti**
