# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smriti** is a static, mobile-first web application for memorizing Sanskrit poetry, specifically the Vinaya Chalisa. It's designed as a single-poem memorization app with no build process or server dependencies.

### Architecture

- **Static site**: No build step, no service worker, everything loads on-demand via `fetch()`
- **Two-page structure**: 
  - `index.html` - Home page with poem verse list
  - `verse.html` - Individual verse detail page with toggleable content
- **Mobile-first, dark-only theme** with sans-serif fonts
- **Session-based state management** using `sessionStorage` for visibility toggles

### Key Components

- **Manifest-driven content**: `/data/manifest.json` defines verse order and metadata
- **Multi-format text support**: Hindi (Devanagari), transliteration, English, and Markdown explanations
- **Audio playback**: Single MP3 per verse with play/pause controls
- **Text parsing**: Special delimiter handling for Hindi (`।`, `||`) and transliteration (`|`, `||`)

## Development Commands

This is a static HTML/CSS/JavaScript project with no build system. Development is done directly on the source files.

### Local Development
```bash
# Serve the project locally (choose one)
python -m http.server 8000
python3 -m http.server 8000

# Or use VS Code Live Server extension
# Or use Node.js http-server: npx http-server -p 8000
```

### Testing
```bash
# No automated tests - manual testing in browser
# Test on multiple devices and screen sizes
# Verify keyboard shortcuts work on desktop
# Test with missing data files for error handling
```

## File Structure

```
/index.html                    # Home page
/verse.html                    # Verse detail page  
/assets/
  ├── app.js                   # Main application logic (ES modules)
  ├── styles.css               # All CSS styling
  ├── fonts/                   # Font files (Noto Sans Devanagari, Gentium Plus, Inter)
  └── vendor/                  # Third-party libraries (snarkdown, dompurify)
/data/
  ├── manifest.json           # Poem metadata and verse list
  ├── Verse{id}.hindi         # Hindi text with । and || delimiters
  ├── Verse{id}.transliterated # Transliteration with | and || delimiters  
  ├── Verse{id}.english       # English translation
  ├── Verse{id}.explanation   # Markdown explanations
  └── Verse{id}.mp3          # Audio files (optional)
```

## Code Architecture

### Core Functions (`/assets/app.js`)

**Data Loading:**
- `safeFetchText(url)` - Safe fetch with null return on error
- `loadManifest()` - Loads and validates manifest.json
- `displayNameFor(verse, index)` - Display name fallback: title → number → index → id

**Text Processing:**
- `splitHindi(text)` - Splits on `।` and `||`, retains delimiters at line end
- `splitTranslit(text)` - Splits on `|` and `||`, handles single/double pipes
- `renderLines(container, lines)` - Renders split text as individual line elements
- `renderExplanation(container, markdown)` - Simple Markdown→HTML conversion with sanitization

**Session Management:**
- `sessionVisibility.get()/set()` - Global visibility state across verses
- `applyTextScale(scale)` - CSS variable-based text scaling (0.9x - 1.6x)

**Page Initialization:**
- `initHome()` - Renders poem title and verse list with navigation links
- `initVerse()` - Handles verse page setup, navigation, toolbar, keyboard shortcuts, and state restoration

### Navigation & State

- **Navigation**: Full page reloads on prev/next (no SPA routing)
- **Visibility persistence**: Session-scoped, reset on full browser refresh  
- **Content order**: Hindi → Transliteration → English (Explanation separate)
- **Audio**: Singleton element, 1.0x playback rate, no loop, graceful error handling

### Content Parsing Rules

**Hindi text** (`Verse{id}.hindi`):
- Split on `।` (Devanagari danda) and `||` (double pipe)
- Break **after** delimiter, retain delimiter at end of line
- Trim whitespace, ignore empty segments

**Transliteration** (`Verse{id}.transliterated`):
- Single `|` = line break
- Double `||` = stronger break  
- Same retention and trimming rules as Hindi

**English** (`Verse{id}.english`):
- No special parsing, rendered as single block

**Explanations** (`Verse{id}.explanation`):
- Markdown format with basic HTML conversion
- Simple sanitization to prevent XSS

## Keyboard Shortcuts (Desktop)

- **H/T/E/X/A** - Toggle Hindi/Transliteration/English/Explanation/All
- **← / →** - Previous/Next verse (if available)
- **[ / ]** - Decrease/Increase text size
- **Space** - Play/Pause audio (not implemented in current version)

## Error Handling

- **Missing manifest**: Friendly message with connection suggestion
- **Invalid verse ID**: "Verse not found" with link to home
- **Missing content files**: Inline "Not available" messages, buttons remain functional
- **Audio errors**: Temporary error message, graceful fallback

## Hosting Requirements

- Static file server (GitHub Pages, Netlify, S3, etc.)
- Correct MIME types for `.mp3` files
- All text files served as `text/plain` or `text/html`
- No server-side processing required

## Development Notes

- **No build process** - edit files directly
- **ES modules** - modern browser support assumed
- **Mobile-first responsive design** with horizontal scrolling toolbar on narrow screens
- **Dark theme only** with WCAG AA contrast compliance
- **Touch-friendly** with 40px+ touch targets
- **Font loading** gracefully falls back to system fonts if custom fonts unavailable

## Testing Checklist

- Verify verse order matches manifest
- Test all toggle combinations and "All" button behavior  
- Confirm text splitting preserves delimiters correctly
- Test navigation disabled states at first/last verse
- Verify session state persistence within same session
- Test error handling with missing files
- Confirm keyboard shortcuts work without interfering with browser navigation
- Test on various mobile devices and screen sizes