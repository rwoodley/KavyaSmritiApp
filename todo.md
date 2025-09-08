# Smriti — Project TODO Checklist

Use this as a living checklist while implementing the app. It mirrors the P0–P12 prompt plan and adds acceptance checks.
Mark each item with `[x]` when done. Keep scope tight to the spec (dark-only, static site, no new features).

---

## Pre‑Flight
- [ ] Confirm spec constraints: dark-only, mobile-first, sans-serif, two pages (`index.html`, `verse.html`)
- [ ] Confirm **no build step** and **no service code** (static hosting only)
- [ ] Confirm **one MP3 per verse**, no per-line audio, no wrap for Prev/Next
- [ ] Confirm visibility state is per-session (reset on refresh)
- [ ] Confirm “All” toggle order: **Hindi → Translit → English** (Explanation excluded)
- [ ] Confirm splitters retain delimiters and break **after** them
- [ ] Confirm Explanation renders **Markdown** via snarkdown + **sanitizes via DOMPurify**
- [ ] Confirm **no new features** beyond spec

---

## M0 — Repo & Scaffolding
- [ ] Create repo structure
  - [ ] `/index.html`
  - [ ] `/verse.html`
  - [ ] `/assets/styles.css`
  - [ ] `/assets/app.js`
  - [ ] `/assets/vendor/` (empty)
  - [ ] `/assets/fonts/` (empty)
  - [ ] `/data/manifest.json`
- [ ] Add HTML5 skeletons to both pages
  - [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`
  - [ ] Dark background & sans-serif stack
- [ ] `styles.css`
  - [ ] Define CSS variables including `--verse-scale: 1`
  - [ ] Base layout with `main` content area
  - [ ] Reserve space for bottom sticky toolbar on verse page
- [ ] `app.js`
  - [ ] Export `initHome()` and `initVerse()` (log-only placeholders)
  - [ ] Wire pages with `<script type="module" src="/assets/app.js">`
- [ ] `manifest.json` scaffold with initial poem and verses
- [ ] **Acceptance**
  - [ ] `index.html` opens with dark page and visible “Smriti” heading
  - [ ] `verse.html` logs `initVerse` and shows empty main + toolbar area

---

## M1 — Home page: load manifest & render list
- [ ] Implement `safeFetchText(url)` (returns string or null)
- [ ] Implement `loadManifest()` (fetch, parse, validate shape `{ poemTitle, verses[] }`)
- [ ] Implement `displayNameFor(verse, index)` → title → number → 1-based index → id
- [ ] `initHome()`
  - [ ] Render poem title prominently (home shows **only** poem title)
  - [ ] Render ordered list of verses
  - [ ] Each item links to `verse.html?id={id}`
- [ ] **Acceptance**
  - [ ] Verses appear in manifest order with correct display names
  - [ ] Friendly inline error if manifest missing/invalid

---

## M2 — Verse header, id parsing, prev/next
- [ ] `getQueryParam(name)` helper
- [ ] `initVerse()`
  - [ ] Read `id` or show “Verse id missing”
  - [ ] Load manifest; find verse by `id` or “Verse not found”
  - [ ] Compute `prevId`/`nextId` (no wraparound)
  - [ ] Header display fallback rule: title → number → id
  - [ ] Render header with small “Home” link
  - [ ] Render Prev/Next buttons with disabled state at ends
- [ ] **Acceptance**
  - [ ] Header shows correct display name
  - [ ] Prev disabled for first; Next disabled for last

---

## M3 — Toolbar buttons & wiring
- [ ] `verse.html` toolbar with buttons (exact order):
  - [ ] Hindi
  - [ ] Speak
  - [ ] Translit
  - [ ] English
  - [ ] All
  - [ ] Explanation
  - [ ] Prev
  - [ ] Next
  - [ ] A−
  - [ ] A+
- [ ] Add `data-action`, `aria-label`, and `title` on each button
- [ ] Event delegation in `initVerse()` for toolbar clicks
- [ ] Implement empty handlers:
  - [ ] `toggleHindi`, `toggleSpeak`, `toggleTranslit`, `toggleEnglish`, `toggleAll`, `toggleExplanation`, `goPrev`, `goNext`, `decScale`, `incScale`
- [ ] Implement navigation for Prev/Next (guard if at ends)
- [ ] **Acceptance**
  - [ ] Buttons log actions
  - [ ] Prev/Next navigate when enabled

---

## M4 — Splitters + Hindi toggle
- [ ] Implement `splitHindi(text)`
  - [ ] Handle `||` and `।` delimiters
  - [ ] Retain delimiters on the ending line
  - [ ] Break **after** delimiters
  - [ ] Trim surrounding whitespace; ignore empty trailing segment
- [ ] Implement `renderLines(container, lines)` (textContent only)
- [ ] On first Hindi toggle:
  - [ ] Create Hindi container in `#verse-main`
  - [ ] Fetch `/data/Verse{id}.hindi` via `safeFetchText`
  - [ ] Split + render or show “Hindi not available…”
- [ ] **Acceptance**
  - [ ] Lines render with delimiters retained at end
  - [ ] Friendly message when file missing

---

## M5 — Translit + English toggles
- [ ] Implement `splitTranslit(text)`
  - [ ] Single `|` = line break
  - [ ] Double `||` = stronger break
  - [ ] Retain delimiter characters on the same line
- [ ] On first Translit toggle:
  - [ ] Create container
  - [ ] Fetch `/data/Verse{id}.transliterated`
  - [ ] Split + render or show “Transliteration not available…”
- [ ] On first English toggle:
  - [ ] Create container
  - [ ] Fetch `/data/Verse{id}.english`
  - [ ] Render as a single block (no special splitting) or show “English not available…”
- [ ] **Acceptance**
  - [ ] Independent toggles work; missing files handled gracefully

---

## M6 — “All” master toggle
- [ ] `toggleAll()` shows/hides in order: **Hindi → Translit → English**
- [ ] Placeholders appear for missing blocks (e.g., “Transliteration not available”)
- [ ] **Acceptance**
  - [ ] All shows available sections and placeholders; second click hides them

---

## M7 — Explanation (Markdown via snarkdown → DOMPurify)
- [ ] Vendor files into `/assets/vendor/`
  - [ ] `snarkdown.min.js`
  - [ ] `dompurify.min.js`
  - [ ] (If UMD, add tiny ES module wrappers)
- [ ] Implement `renderExplanation(container, markdown)`
  - [ ] Dynamic import modules
  - [ ] Markdown → HTML (snarkdown)
  - [ ] Sanitize (DOMPurify)
  - [ ] Insert as `<section class="explanation">` (use sanitized string only)
- [ ] Explanation toggle:
  - [ ] Fetch `/data/Verse{id}.explanation`
  - [ ] Render or show “Explanation not available…”
- [ ] **Acceptance**
  - [ ] Explanation renders safely; **not** included in “All”

---

## M8 — Speak (audio)
- [ ] On first Speak toggle:
  - [ ] Create singleton `<audio>` element
  - [ ] `src=/data/Verse{id}.mp3`, `preload="none"`, `playsInline`, no loop
  - [ ] Toggle play/pause; reflect playing state on button
  - [ ] Handle error → “Audio not available…”
- [ ] Hide default audio controls in CSS
- [ ] **Acceptance**
  - [ ] Robust play/pause; missing MP3 handled gracefully

---

## M9 — Session visibility + text scaling
- [ ] `sessionVisibility.get()/set()` using `sessionStorage` key `smriti:visibility:{id}`
  - [ ] Tracks: `{ hindi, translit, english, explanation, scale }`
- [ ] On init:
  - [ ] Restore visibility for each section
  - [ ] Apply scale with `--verse-scale`
- [ ] Implement `applyTextScale(scale)` + `incrementScale(delta)` with clamp [0.9, 1.6]
- [ ] **Acceptance**
  - [ ] Visibility + scale persist within session; full refresh resets

---

## M10 — Fonts + mobile polish
- [ ] `@font-face` declarations (allow fallback if files absent)
  - [ ] Noto Sans Devanagari
  - [ ] Gentium Plus
  - [ ] Inter
- [ ] Font stacks
  - [ ] Hindi blocks → `"Noto Sans Devanagari", "Nirmala UI", system-ui, sans-serif`
  - [ ] Latin/translit/UI → `Inter, "Gentium Plus", system-ui, sans-serif`
- [ ] Toolbar
  - [ ] Sticky bottom
  - [ ] `overflow-x: auto; white-space: nowrap;`
  - [ ] Compact padding for narrow screens
- [ ] **Acceptance**
  - [ ] Readable on small phones; toolbar scrolls horizontally if needed
  - [ ] No layout shifts when toggling

---

## M11 — Keyboard shortcuts (desktop)
- [ ] Add `keydown` on `window` (ignore if focus in inputs/textarea)
- [ ] Map keys:
  - [ ] H → toggleHindi
  - [ ] T → toggleTranslit
  - [ ] E → toggleEnglish
  - [ ] X → toggleExplanation
  - [ ] A → toggleAll
  - [ ] `[` → decScale
  - [ ] `]` → incScale
  - [ ] ArrowLeft → goPrev (if enabled)
  - [ ] ArrowRight → goNext (if enabled)
- [ ] **Acceptance**
  - [ ] Shortcuts work; do not interfere with navigation; respect disabled state

---

## M12 — Final QA Sweep (fixes only)
- [ ] Run full checklist:
  - [ ] Home renders in order; header uses title → number → id
  - [ ] All order: Hindi → Translit → English
  - [ ] Missing files show inline “not available” + placeholders in All
  - [ ] Speak plays/pauses; handles missing MP3
  - [ ] Prev/Next disabled correctly at ends
  - [ ] Visibility restored from session storage on same session
  - [ ] Splitters retain delimiters and break after them
  - [ ] Text scale clamps; applies uniformly
  - [ ] Dark theme contrast OK; fonts legible on small devices
  - [ ] Keyboard shortcuts OK; non-conflicting
- [ ] Fix issues with minimal, targeted changes only

---

## Data Prep (sample content for testing)
- [ ] `/data/manifest.json` with realistic titles/numbers/ids
- [ ] `Verse{id}.hindi` (with `।` and/or `||` delimiters)
- [ ] `Verse{id}.transliterated` (with `|` and `||`)
- [ ] `Verse{id}.english` (plain block)
- [ ] `Verse{id}.explanation` (Markdown)
- [ ] `Verse{id}.mp3` (optional, for at least one id)

---

## Accessibility & Usability
- [ ] Buttons have `aria-label` and `title`
- [ ] Focus outline visible; toolbar reachable via keyboard
- [ ] Touch targets large enough on small screens
- [ ] Color contrast meets WCAG AA in dark mode
- [ ] Header shows Home link back to index

---

## Definition of Done
- [ ] All acceptance boxes checked for P0–P12
- [ ] No console errors in modern browsers
- [ ] No orphaned code; all features wired and reachable
- [ ] Spec constraints re-verified (top of this file)
- [ ] Ready to host on a static server (e.g., GitHub Pages, Netlify, S3)
