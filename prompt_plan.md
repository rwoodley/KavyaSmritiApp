# Prompt Plan for Smriti

Below are the sequential prompts (P0 → P12). Each prompt is self‑contained and uses a `text` code fence so you can paste directly into Aider, Cursor, Claude, etc.

---

## P0 — Create repo scaffolding
```text
You are editing a static web project named “Smriti”.

Goal: Create initial scaffolding that exactly matches the file layout below, with minimal working HTML shells, a dark-only theme, and ES module stubs.

Create files/directories:

/index.html
/verse.html
/assets/styles.css
/assets/app.js
/assets/vendor/           (leave empty now)
/assets/fonts/            (leave empty now)
/data/manifest.json

Requirements:
- Both HTML files: semantic HTML5 skeleton, `<meta name="viewport" content="width=device-width, initial-scale=1">`, dark background, sans-serif stack.
- styles.css: define CSS variables including `--verse-scale: 1`; set dark theme colors; create base layout with a main content area; reserve space for a bottom, sticky toolbar on verse page.
- app.js: export two functions `initHome()` and `initVerse()` that currently only `console.log()` which page initialized.
- Wire `index.html` to call `initHome()` and `verse.html` to call `initVerse()` using `<script type="module" src="/assets/app.js"></script>`.
- data/manifest.json: scaffold with
  {
    "poemTitle": "Smriti Poem",
    "verses": [
      { "id": "1", "number": 1 },
      { "id": "2", "number": 2 }
    ]
  }

Acceptance:
- Opening index.html shows a dark page with a visible heading “Smriti” and subheading placeholder.
- Opening verse.html logs “initVerse” in console and shows an empty main area plus an empty sticky toolbar area placeholder at the bottom.
```

---

## P1 — Home page: load manifest & render list
```text
Implement the home page list per spec.

Edits:
- /assets/app.js:
  - Add `async function safeFetchText(url)` that returns string on 200 or null on non-OK.
  - Implement `async function loadManifest()` that fetches `/data/manifest.json`, parses JSON, validates `poemTitle` and `verses` (array of objects with `id`), and returns it.
  - Implement `function displayNameFor(verse, index)` that returns `verse.title || verse.number || (index+1) || verse.id` (in that order; if number is missing, use 1-based index).
  - Implement `async function initHome()`:
      - Load manifest
      - Render the poem title prominently on the page (home shows poem title only, per spec)
      - Render an ordered list of verses; each list item is a link to `verse.html?id={id}` showing only the display name (no preview).

- /index.html:
  - Add containers for title and list (ids: `poem-title`, `verse-list`).

Acceptance:
- Home lists verses in manifest order with correct display names and working links to verse.html?id=...
- If manifest is missing/invalid, show a friendly inline error in the main area.
```

---

## P2 — Verse header, id parsing, prev/next computation
```text
Implement verse header and prev/next model.

Edits:
- /assets/app.js:
  - Add `function getQueryParam(name)` returning string|null from `location.search`.
  - In `async function initVerse()`:
     1) Read `id` via `getQueryParam('id')`; if missing, render an inline error “Verse id missing”.
     2) Load manifest; find verse by id; if not found show “Verse not found”.
     3) Compute `prevId` and `nextId` based on the verse’s index within manifest. No wraparound.
     4) Compute header display: title → number → id.
     5) Render a header area at the top of main: heading includes display name and a small “Home” link back to index.html.
     6) Render disabled/enabled state for Prev/Next buttons in the bottom toolbar (add them to verse.html if not yet present).

- /verse.html:
  - Provide containers:
    <header id="verse-header"></header>
    <main id="verse-main"></main>
    <nav id="toolbar" class="toolbar"></nav>

- /assets/styles.css:
  - Style a sticky `#toolbar` at bottom, mobile-first. Allow horizontal scroll on very small screens.

Acceptance:
- Visiting verse.html?id=1 shows a header with the correct display name and “Home” link. Prev disabled on first, Next enabled unless last; reversed on last.
```

---

## P3 — Toolbar buttons & wiring (no functionality yet)
```text
Add toolbar buttons and event wiring per spec.

Edits:
- /verse.html: Render a single-row toolbar with buttons in this exact order:
  [Hindi] [Speak] [Translit] [English] [All] [Explanation] [Prev] [Next] [A−] [A+]
  - Each button has: a `data-action` attribute, a short text label, `aria-label`, and `title`.
  - The toolbar must be horizontally scrollable when space is tight.

- /assets/app.js:
  - In `initVerse()`, select the toolbar and add a single click handler (event delegation) that switches on `e.target.closest('button')?.dataset.action`.
  - Implement empty handlers for actions:
    toggleHindi, toggleSpeak, toggleTranslit, toggleEnglish, toggleAll, toggleExplanation, goPrev, goNext, decScale, incScale.
  - Implement goPrev/goNext to navigate to `verse.html?id=...` and guard when id is missing/disabled.

Acceptance:
- Buttons exist, have tooltips, and clicking them logs which action fired. Prev/Next navigate and honor disabled state.
```

---

## P4 — Splitters + Hindi loader
```text
Implement deterministic splitters and Hindi toggle.

Edits:
- /assets/app.js:
  - `function splitHindi(text)`:
      - Handle `||` (double pipe) and `।` (Devanagari danda) as delimiters.
      - Split respecting both; keep the delimiter appended to the line it terminates (break AFTER).
      - Trim leading/trailing whitespace around segments; ignore empty trailing piece.
  - `function renderLines(container, lines)`:
      - Clear container; for each line create a block element (e.g., <div class="line">) with `textContent` set (never innerHTML).
  - Add a Hindi container into `#verse-main` on first toggle; lazy-load `/data/Verse{id}.hindi` with `safeFetchText`.
      - On success: split with `splitHindi` then `renderLines`.
      - On 404/null: show inline “Hindi not available for this verse”.

- /assets/styles.css:
  - Provide basic `.line` styling and spacing.

Acceptance:
- Toggling Hindi for a verse with an existing file renders line-by-line with delimiters retained at end. Missing file shows a friendly inline message.
```

---

## P5 — Translit + English toggles
```text
Add transliteration and English toggles.

Edits:
- /assets/app.js:
  - `function splitTranslit(text)`:
      - Treat single `|` as a line break and `||` as a stronger break. Retain the delimiter characters on the line where they appear.
      - Implement robust splitting that preserves `||` distinct from `|`.
  - Add transliteration container; on first toggle, fetch `/data/Verse{id}.transliterated`, split, and render with `renderLines`. If missing, show inline “Transliteration not available for this verse”.
  - Add English container; on first toggle, fetch `/data/Verse{id}.english` and render as a single text block (no special splitting). If missing, inline message.

Acceptance:
- Toggling Translit/English works independently and handles not-available cases.
```

---

## P6 — “All” master toggle (order: Hindi → Translit → English)
```text
Implement the All toggle.

Edits:
- /assets/app.js:
  - `toggleAll()` should invoke the three individual toggles such that the visible order in the main content is Hindi, then Translit, then English.
  - If a block is missing, show a small placeholder (e.g., “Transliteration not available”).

- /assets/styles.css:
  - Ensure consistent spacing between sections and unobtrusive placeholder styling.

Acceptance:
- Clicking All shows available sections in the stated order and placeholders for missing ones. Clicking again hides them (consistent with other toggles).
```

---

## P7 — Explanation (Markdown via snarkdown → DOMPurify)
```text
Add safe Markdown rendering for Explanation (NOT included in “All”).

Edits:
- Add the following vendor files under /assets/vendor/:
  - snarkdown.min.js  (ES module default export `snarkdown`)
  - dompurify.min.js  (ES module default export `DOMPurify` or a named export; if needed, wrap to provide a default)
  (If the vendor files are plain UMD, create tiny ES module wrappers in the same folder that export the default.)

- /assets/app.js:
  - `async function renderExplanation(container, markdown)`:
      - Import the vendor modules dynamically with `await import('/assets/vendor/snarkdown.min.js')` and `await import('/assets/vendor/dompurify.min.js')`.
      - Convert markdown → HTML via snarkdown; sanitize with DOMPurify; insert as a `<section class="explanation">` (use `innerHTML` ONLY on the sanitized string).
  - Explanation toggle: on first show, fetch `/data/Verse{id}.explanation` and render; on missing, inline message “Explanation not available for this verse”.

Acceptance:
- Explanation renders with sanitized HTML; it is NOT toggled by “All”.
```

---

## P8 — Speak (audio play/pause)
```text
Implement audio playback.

Edits:
- /assets/app.js:
  - On first Speak toggle, create a singleton <audio> element for the page and set `src` to `/data/Verse{id}.mp3`; set `preload="none"`, `playsInline`, `rate=1.0`, and `loop=false`.
  - Toggle play/pause via the Speak button; update button state (e.g., `data-playing="true"`).
  - Handle error events: show inline “Audio not available for this verse”.

- /assets/styles.css:
  - Hide the default audio controls (we only have a button).

Acceptance:
- Speak toggles audio reliably; if MP3 missing, shows inline message and doesn’t crash.
```

---

## P9 — Session visibility + text scaling (A− / A+)
```text
Persist visibility and implement clamped text scaling.

Edits:
- /assets/app.js:
  - `sessionVisibility.get()` returns an object like `{ hindi: bool, translit: bool, english: bool, explanation: bool, scale: number }` restored from sessionStorage key `smriti:visibility:{id}`.
  - `sessionVisibility.set(obj)` writes it back after any change.
  - When `initVerse()` runs, restore and apply:
     - For each true section, show that section.
     - Apply text scale via `document.documentElement.style.setProperty('--verse-scale', scale)`.
  - Implement `applyTextScale(scale)` and `incrementScale(delta)` with clamp to [0.9, 1.6].

- /assets/styles.css:
  - Use `--verse-scale` to scale **all verse content** (Hindi, Translit, English, Explanation) with a single transform or font-size multiplier.

Acceptance:
- Toggling visibility and scale persists across navigation within the same session; a full refresh resets to defaults per spec.
```

---

## P10 — Fonts + mobile polish
```text
Add font-face declarations and polish toolbar for very small screens.

Edits:
- /assets/styles.css:
  - Add @font-face declarations for:
     - Noto Sans Devanagari (primary for Hindi)
     - Gentium Plus (fallback for translit/Latin with good diacritics)
     - Inter (UI)
    (You may reference `/assets/fonts/...` but if files aren’t present, the stack should safely fall back to system fonts.)
  - Apply font stacks:
     - Hindi blocks: `font-family: "Noto Sans Devanagari", "Nirmala UI", system-ui, sans-serif;`
     - Latin/translit/UI: `font-family: Inter, "Gentium Plus", system-ui, sans-serif;`
  - Ensure toolbar is sticky and horizontally scrollable on narrow screens (use `overflow-x:auto; white-space:nowrap;` and compact padding).

Acceptance:
- Pages remain readable on a small phone; toolbar can scroll horizontally if necessary; no layout shifts when toggling sections.
```

---

## P11 — Keyboard shortcuts (desktop only)
```text
Add unobtrusive keyboard shortcuts.

Edits:
- /assets/app.js:
  - In `initVerse()`, add `keydown` listener on `window`.
  - Ignore events when focus is inside inputs/textareas (we have none, but code defensively).
  - Map:
     H → toggleHindi
     T → toggleTranslit
     E → toggleEnglish
     X → toggleExplanation
     A → toggleAll
     [ → decScale
     ] → incScale
     ArrowLeft → goPrev (if enabled)
     ArrowRight → goNext (if enabled)

Acceptance:
- Shortcuts work, do not interfere with navigation, and reflect disabled state for Prev/Next.
```

---

## P12 — Final QA sweep (fixes only)
```text
QA fixes only — do not add features.

Actions:
- Verify:
  - Home renders manifest list in order; verse header uses (title → number → id).
  - All toggle order: Hindi → Translit → English.
  - Missing files show inline “not available” and placeholders in All.
  - Speak works; handles missing MP3.
  - Prev/Next disabled at ends; full page reload; visibility restored from sessionStorage.
  - Splitters retain delimiters and break after them as specified.
  - Text scale clamps; applies uniformly to all content blocks.
  - Dark theme contrast + font rendering is legible on small devices.
  - Keyboard shortcuts OK and non-conflicting.

- Address any found issues with minimal, targeted edits only.

Acceptance:
- All checklist items pass manually.
```
