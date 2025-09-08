async function safeFetchText(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.text();
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function loadManifest() {
  const manifestText = await safeFetchText('/data/manifest.json');
  if (!manifestText) {
    return null;
  }
  
  try {
    const manifest = JSON.parse(manifestText);
    if (!manifest.poemTitle || !Array.isArray(manifest.verses)) {
      return null;
    }
    
    for (const verse of manifest.verses) {
      if (!verse.id) {
        return null;
      }
    }
    
    return manifest;
  } catch (error) {
    return null;
  }
}

function displayNameFor(verse, index) {
  return verse.title || verse.number || (index + 1) || verse.id;
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(location.search);
  return urlParams.get(name);
}

// Session visibility and scale management (global, not per-verse)
const sessionVisibility = {
  get() {
    try {
      const stored = sessionStorage.getItem('smriti:visibility');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error reading session storage:', error);
    }
    
    // Default state
    return {
      hindi: false,
      translit: false,
      english: false,
      explanation: false,
      scale: 1.0
    };
  },
  
  set(obj) {
    try {
      console.log('Setting global visibility state:', obj);
      sessionStorage.setItem('smriti:visibility', JSON.stringify(obj));
      // Verify it was written
      const stored = sessionStorage.getItem('smriti:visibility');
      console.log('Verified stored state:', JSON.parse(stored));
    } catch (error) {
      console.warn('Error writing to session storage:', error);
    }
  }
};

// Text scaling functions
function applyTextScale(scale) {
  // Clamp scale between 0.9 and 1.6
  const clampedScale = Math.min(1.6, Math.max(0.9, scale));
  document.documentElement.style.setProperty('--verse-scale', clampedScale);
  return clampedScale;
}

function incrementScale(delta) {
  const visibility = sessionVisibility.get();
  const newScale = applyTextScale(visibility.scale + delta);
  
  // Update stored scale
  visibility.scale = newScale;
  sessionVisibility.set(visibility);
  
  return newScale;
}

// Direct show functions for restoration (don't toggle, just show)
async function showHindi() {
  const verseId = getQueryParam('id');
  if (!verseId) return;
  
  const mainEl = document.getElementById('verse-main');
  let hindiContainer = document.getElementById('hindi-container');
  
  if (hindiContainer) {
    hindiContainer.style.display = 'block';
    return;
  }
  
  // Create and load Hindi content
  hindiContainer = document.createElement('div');
  hindiContainer.id = 'hindi-container';
  hindiContainer.className = 'content-section';
  mainEl.appendChild(hindiContainer);
  
  const hindiText = await safeFetchText(`/data/Verse${verseId}.hindi`);
  if (!hindiText) {
    hindiContainer.innerHTML = '<div class="placeholder">Hindi not available</div>';
    return;
  }
  
  const lines = splitHindi(hindiText);
  renderLines(hindiContainer, lines);
}

async function showTranslit() {
  const verseId = getQueryParam('id');
  if (!verseId) return;
  
  const mainEl = document.getElementById('verse-main');
  let translitContainer = document.getElementById('translit-container');
  
  if (translitContainer) {
    translitContainer.style.display = 'block';
    return;
  }
  
  translitContainer = document.createElement('div');
  translitContainer.id = 'translit-container';
  translitContainer.className = 'content-section';
  mainEl.appendChild(translitContainer);
  
  const translitText = await safeFetchText(`/data/Verse${verseId}.transliterated`);
  if (!translitText) {
    translitContainer.innerHTML = '<div class="placeholder">Transliteration not available</div>';
    return;
  }
  
  const lines = splitTranslit(translitText);
  renderLines(translitContainer, lines);
}

async function showEnglish() {
  const verseId = getQueryParam('id');
  if (!verseId) return;
  
  const mainEl = document.getElementById('verse-main');
  let englishContainer = document.getElementById('english-container');
  
  if (englishContainer) {
    englishContainer.style.display = 'block';
    return;
  }
  
  englishContainer = document.createElement('div');
  englishContainer.id = 'english-container';
  englishContainer.className = 'content-section';
  mainEl.appendChild(englishContainer);
  
  const englishText = await safeFetchText(`/data/Verse${verseId}.english`);
  if (!englishText) {
    englishContainer.innerHTML = '<div class="placeholder">English translation not available</div>';
    return;
  }
  
  englishContainer.innerHTML = '';
  const textElement = document.createElement('div');
  textElement.className = 'english-text';
  textElement.textContent = englishText;
  englishContainer.appendChild(textElement);
}

async function showExplanation() {
  const verseId = getQueryParam('id');
  if (!verseId) return;
  
  const mainEl = document.getElementById('verse-main');
  let explanationContainer = document.getElementById('explanation-container');
  
  if (explanationContainer) {
    explanationContainer.style.display = 'block';
    return;
  }
  
  explanationContainer = document.createElement('div');
  explanationContainer.id = 'explanation-container';
  explanationContainer.className = 'content-section';
  mainEl.appendChild(explanationContainer);
  
  const explanationText = await safeFetchText(`/data/Verse${verseId}.explanation`);
  if (!explanationText) {
    explanationContainer.innerHTML = '<div class="placeholder">Explanation not available for this verse</div>';
    return;
  }
  
  await renderExplanation(explanationContainer, explanationText);
}

function splitHindi(text) {
  if (!text) return [];
  
  // Split on both || and । delimiters, keeping delimiters with preceding text
  const segments = [];
  let current = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    current += char;
    
    // Check for double pipe ||
    if (char === '|' && nextChar === '|') {
      current += nextChar; // Include the second pipe
      segments.push(current.trim());
      current = '';
      i++; // Skip the next character since we processed it
    }
    // Check for Devanagari danda ।
    else if (char === '।') {
      segments.push(current.trim());
      current = '';
    }
  }
  
  // Add any remaining text
  if (current.trim()) {
    segments.push(current.trim());
  }
  
  // Filter out empty segments
  return segments.filter(segment => segment.length > 0);
}

function splitTranslit(text) {
  if (!text) return [];
  
  // Split on both || and | delimiters, keeping delimiters with preceding text
  const segments = [];
  let current = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    current += char;
    
    // Check for double pipe || first (stronger break)
    if (char === '|' && nextChar === '|') {
      current += nextChar; // Include the second pipe
      segments.push(current.trim());
      current = '';
      i++; // Skip the next character since we processed it
    }
    // Check for single pipe | (but not part of ||)
    else if (char === '|' && nextChar !== '|') {
      segments.push(current.trim());
      current = '';
    }
  }
  
  // Add any remaining text
  if (current.trim()) {
    segments.push(current.trim());
  }
  
  // Filter out empty segments
  return segments.filter(segment => segment.length > 0);
}

function renderLines(container, lines) {
  container.innerHTML = '';
  
  lines.forEach(line => {
    const lineElement = document.createElement('div');
    lineElement.className = 'line';
    lineElement.textContent = line;
    container.appendChild(lineElement);
  });
}

async function renderExplanation(container, markdown) {
  try {
    console.log('Loading vendor modules...');
    
    // For now, let's bypass the problematic modules and do simple HTML conversion
    console.log('Markdown input:', markdown);
    
    // Simple markdown-to-HTML conversion without external libraries
    // First, split into paragraphs based on double line breaks
    const paragraphs = markdown.split(/\n\s*\n/);
    
    let html = paragraphs.map(paragraph => {
      let para = paragraph.trim();
      if (!para) return '';
      
      // Handle headers
      if (para.match(/^# /)) {
        return para.replace(/^# (.*)/, '<h1>$1</h1>');
      }
      if (para.match(/^## /)) {
        return para.replace(/^## (.*)/, '<h2>$1</h2>');
      }
      if (para.match(/^### /)) {
        return para.replace(/^### (.*)/, '<h3>$1</h3>');
      }
      
      // Handle blockquotes
      if (para.match(/^> /)) {
        return '<blockquote>' + para.replace(/^> (.*)/, '$1') + '</blockquote>';
      }
      
      // Handle lists
      if (para.match(/^- /)) {
        const items = para.split('\n').map(line => {
          if (line.match(/^- /)) {
            return '<li>' + line.replace(/^- (.*)/, '$1') + '</li>';
          }
          return line;
        }).join('\n');
        return '<ul>' + items + '</ul>';
      }
      
      // Handle regular paragraphs with inline formatting
      para = para
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      
      // Convert single line breaks to <br> tags within paragraphs
      para = para.replace(/\n/g, '<br>');
      
      return '<p>' + para + '</p>';
    }).filter(p => p).join('\n\n');
    
    // Basic sanitization - remove script tags and dangerous attributes
    html = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    console.log('Converted HTML:', html);
    
    container.innerHTML = '';
    const section = document.createElement('section');
    section.className = 'explanation';
    section.innerHTML = html;
    container.appendChild(section);
    
    console.log('Explanation rendered successfully');
  } catch (error) {
    console.error('Error rendering explanation:', error);
    container.innerHTML = '<div class="placeholder">Error loading explanation</div>';
  }
}

export async function initHome() {
  console.log('initHome');
  
  const manifest = await loadManifest();
  const poemTitleEl = document.getElementById('poem-title');
  const verseListEl = document.getElementById('verse-list');
  
  if (!manifest) {
    poemTitleEl.innerHTML = '<p style="color: var(--text-secondary);">Unable to load poem manifest. Please check that the data file is available.</p>';
    return;
  }
  
  poemTitleEl.innerHTML = `<h2>${manifest.poemTitle}</h2>`;
  
  verseListEl.innerHTML = manifest.verses
    .map((verse, index) => 
      `<li><a href="verse.html?id=${encodeURIComponent(verse.id)}">${displayNameFor(verse, index)}</a></li>`
    )
    .join('');
}

export async function initVerse() {
  console.log('initVerse');
  
  const verseId = getQueryParam('id');
  const headerEl = document.getElementById('verse-header');
  const mainEl = document.getElementById('verse-main');
  const toolbarEl = document.getElementById('toolbar');
  
  if (!verseId) {
    mainEl.innerHTML = '<p style="color: var(--text-secondary);">Verse id missing</p>';
    return;
  }
  
  const manifest = await loadManifest();
  if (!manifest) {
    mainEl.innerHTML = '<p style="color: var(--text-secondary);">Unable to load poem manifest. Please check that the data file is available.</p>';
    return;
  }
  
  const verseIndex = manifest.verses.findIndex(verse => verse.id === verseId);
  if (verseIndex === -1) {
    mainEl.innerHTML = '<p style="color: var(--text-secondary);">Verse not found</p>';
    return;
  }
  
  const verse = manifest.verses[verseIndex];
  const prevId = verseIndex > 0 ? manifest.verses[verseIndex - 1].id : null;
  const nextId = verseIndex < manifest.verses.length - 1 ? manifest.verses[verseIndex + 1].id : null;
  
  const displayName = verse.title || verse.number || verse.id;
  
  headerEl.innerHTML = `
    <h2>${displayName}</h2>
    <a href="index.html">← Home</a>
  `;
  
  // Update disabled state of navigation buttons
  const prevBtn = toolbarEl.querySelector('[data-action="goPrev"]');
  const nextBtn = toolbarEl.querySelector('[data-action="goNext"]');
  
  if (prevBtn) prevBtn.disabled = !prevId;
  if (nextBtn) nextBtn.disabled = !nextId;
  
  // Add event delegation handler
  toolbarEl.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button || button.disabled) return;
    
    const action = button.dataset.action;
    switch (action) {
      case 'toggleHindi':
        toggleHindi();
        break;
      case 'toggleSpeak':
        toggleSpeak();
        break;
      case 'toggleTranslit':
        toggleTranslit();
        break;
      case 'toggleEnglish':
        toggleEnglish();
        break;
      case 'toggleAll':
        toggleAll();
        break;
      case 'toggleExplanation':
        toggleExplanation();
        break;
      case 'goPrev':
        goPrev(prevId);
        break;
      case 'goNext':
        goNext(nextId);
        break;
      case 'decScale':
        decScale();
        break;
      case 'incScale':
        incScale();
        break;
    }
  });
  
  // Add keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore shortcuts when focus is in inputs or textareas
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }
    
    // Handle keyboard shortcuts
    switch (e.key.toLowerCase()) {
      case 'h':
        e.preventDefault();
        toggleHindi();
        break;
      case 't':
        e.preventDefault();
        toggleTranslit();
        break;
      case 'e':
        e.preventDefault();
        toggleEnglish();
        break;
      case 'x':
        e.preventDefault();
        toggleExplanation();
        break;
      case 'a':
        e.preventDefault();
        toggleAll();
        break;
      case '[':
        e.preventDefault();
        decScale();
        break;
      case ']':
        e.preventDefault();
        incScale();
        break;
      case 'arrowleft':
        if (prevId) {
          e.preventDefault();
          goPrev(prevId);
        }
        break;
      case 'arrowright':
        if (nextId) {
          e.preventDefault();
          goNext(nextId);
        }
        break;
    }
  });
  
  // Restore visibility state and scale from session storage
  const visibility = sessionVisibility.get();
  console.log('Restoring global visibility state for verse', verseId, ':', visibility);
  
  // Apply stored scale
  applyTextScale(visibility.scale);
  console.log('Applied scale:', visibility.scale);
  
  // Restore visible sections by directly showing them (not toggling)
  if (visibility.hindi) {
    console.log('Restoring Hindi visibility');
    await showHindi();
  }
  if (visibility.translit) {
    console.log('Restoring Translit visibility');
    await showTranslit();
  }
  if (visibility.english) {
    console.log('Restoring English visibility');
    await showEnglish();
  }
  if (visibility.explanation) {
    console.log('Restoring Explanation visibility');
    await showExplanation();
  }
}

async function toggleHindi() {
  console.log('toggleHindi');
  
  const verseId = getQueryParam('id');
  if (!verseId) return;
  
  const visibility = sessionVisibility.get();
  const mainEl = document.getElementById('verse-main');
  let hindiContainer = document.getElementById('hindi-container');
  
  // Toggle visibility if container already exists
  if (hindiContainer) {
    const isVisible = hindiContainer.style.display !== 'none';
    console.log('Toggling Hindi: currently visible =', isVisible, ', will be visible =', !isVisible);
    hindiContainer.style.display = isVisible ? 'none' : 'block';
    visibility.hindi = !isVisible;
    console.log('Updated visibility state:', visibility);
    sessionVisibility.set(visibility);
    return;
  }
  
  // Create and add Hindi container
  hindiContainer = document.createElement('div');
  hindiContainer.id = 'hindi-container';
  hindiContainer.className = 'content-section';
  mainEl.appendChild(hindiContainer);
  
  // Show loading message
  hindiContainer.innerHTML = '<p style="color: var(--text-secondary);">Loading Hindi...</p>';
  
  // Lazy-load Hindi content
  const hindiText = await safeFetchText(`/data/Verse${verseId}.hindi`);
  
  if (!hindiText) {
    hindiContainer.innerHTML = '<div class="placeholder">Hindi not available</div>';
    return;
  }
  
  // Split and render Hindi lines
  const lines = splitHindi(hindiText);
  renderLines(hindiContainer, lines);
  
  // Update visibility state
  visibility.hindi = true;
  sessionVisibility.set(visibility);
}

// Singleton audio element for the page
let audioElement = null;

function getAudioElement() {
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.preload = 'none';
    audioElement.playsInline = true;
    audioElement.playbackRate = 1.0;
    audioElement.loop = false;
    audioElement.style.display = 'none'; // Hide default controls
    document.body.appendChild(audioElement);
  }
  return audioElement;
}

async function toggleSpeak() {
  console.log('toggleSpeak');
  
  const verseId = getQueryParam('id');
  if (!verseId) return;
  
  const audio = getAudioElement();
  const speakBtn = document.querySelector('[data-action="toggleSpeak"]');
  
  try {
    // If audio is currently playing, pause it
    if (!audio.paused && !audio.ended) {
      audio.pause();
      speakBtn.dataset.playing = 'false';
      speakBtn.textContent = '🔊';
      return;
    }
    
    // Check if we need to load a new audio file
    const expectedSrc = `/data/Verse${verseId}.mp3`;
    if (audio.src !== location.origin + expectedSrc) {
      audio.src = expectedSrc;
    }
    
    // Try to play the audio
    speakBtn.dataset.playing = 'true';
    speakBtn.textContent = '🔊';
    
    await audio.play();
    
    // Set up event listeners for when audio ends
    audio.addEventListener('ended', () => {
      speakBtn.dataset.playing = 'false';
      speakBtn.textContent = '🔊';
    }, { once: true });
    
  } catch (error) {
    console.error('Audio playback error:', error);
    
    // Show error message in main area
    const mainEl = document.getElementById('verse-main');
    let audioErrorEl = document.getElementById('audio-error');
    
    if (!audioErrorEl) {
      audioErrorEl = document.createElement('div');
      audioErrorEl.id = 'audio-error';
      audioErrorEl.className = 'placeholder';
      audioErrorEl.textContent = 'Audio not available for this verse';
      mainEl.appendChild(audioErrorEl);
      
      // Remove error message after 3 seconds
      setTimeout(() => {
        if (audioErrorEl && audioErrorEl.parentNode) {
          audioErrorEl.parentNode.removeChild(audioErrorEl);
        }
      }, 3000);
    }
    
    // Reset button state
    speakBtn.dataset.playing = 'false';
    speakBtn.textContent = '🔊';
  }
}

async function toggleTranslit() {
  console.log('toggleTranslit');
  
  const verseId = getQueryParam('id');
  if (!verseId) return;
  
  const visibility = sessionVisibility.get();
  const mainEl = document.getElementById('verse-main');
  let translitContainer = document.getElementById('translit-container');
  
  // Toggle visibility if container already exists
  if (translitContainer) {
    const isVisible = translitContainer.style.display !== 'none';
    translitContainer.style.display = isVisible ? 'none' : 'block';
    visibility.translit = !isVisible;
    sessionVisibility.set(visibility);
    return;
  }
  
  // Create and add transliteration container
  translitContainer = document.createElement('div');
  translitContainer.id = 'translit-container';
  translitContainer.className = 'content-section';
  mainEl.appendChild(translitContainer);
  
  // Show loading message
  translitContainer.innerHTML = '<p style="color: var(--text-secondary);">Loading transliteration...</p>';
  
  // Lazy-load transliteration content
  const translitText = await safeFetchText(`/data/Verse${verseId}.transliterated`);
  
  if (!translitText) {
    translitContainer.innerHTML = '<div class="placeholder">Transliteration not available</div>';
    return;
  }
  
  // Split and render transliteration lines
  const lines = splitTranslit(translitText);
  renderLines(translitContainer, lines);
  
  // Update visibility state
  visibility.translit = true;
  sessionVisibility.set(visibility);
}

async function toggleEnglish() {
  console.log('toggleEnglish');
  
  const verseId = getQueryParam('id');
  if (!verseId) return;
  
  const visibility = sessionVisibility.get();
  const mainEl = document.getElementById('verse-main');
  let englishContainer = document.getElementById('english-container');
  
  // Toggle visibility if container already exists
  if (englishContainer) {
    const isVisible = englishContainer.style.display !== 'none';
    englishContainer.style.display = isVisible ? 'none' : 'block';
    visibility.english = !isVisible;
    sessionVisibility.set(visibility);
    return;
  }
  
  // Create and add English container
  englishContainer = document.createElement('div');
  englishContainer.id = 'english-container';
  englishContainer.className = 'content-section';
  mainEl.appendChild(englishContainer);
  
  // Show loading message
  englishContainer.innerHTML = '<p style="color: var(--text-secondary);">Loading English translation...</p>';
  
  // Lazy-load English content
  const englishText = await safeFetchText(`/data/Verse${verseId}.english`);
  
  if (!englishText) {
    englishContainer.innerHTML = '<div class="placeholder">English translation not available</div>';
    return;
  }
  
  // Render English as single text block
  englishContainer.innerHTML = '';
  const textElement = document.createElement('div');
  textElement.className = 'english-text';
  textElement.textContent = englishText;
  englishContainer.appendChild(textElement);
  
  // Update visibility state
  visibility.english = true;
  sessionVisibility.set(visibility);
}

async function toggleAll() {
  console.log('toggleAll');
  
  const mainEl = document.getElementById('verse-main');
  const hindiContainer = document.getElementById('hindi-container');
  const translitContainer = document.getElementById('translit-container');
  const englishContainer = document.getElementById('english-container');
  
  // Check if all sections are currently visible
  const allVisible = hindiContainer && hindiContainer.style.display !== 'none' &&
                     translitContainer && translitContainer.style.display !== 'none' &&
                     englishContainer && englishContainer.style.display !== 'none';
  
  if (allVisible) {
    // Hide all sections
    if (hindiContainer) hindiContainer.style.display = 'none';
    if (translitContainer) translitContainer.style.display = 'none';
    if (englishContainer) englishContainer.style.display = 'none';
    return;
  }
  
  // Show all sections in order: Hindi, Translit, English
  await toggleHindi();
  await toggleTranslit();
  await toggleEnglish();
  
  // Ensure proper order by re-ordering containers
  const containers = [
    document.getElementById('hindi-container'),
    document.getElementById('translit-container'),
    document.getElementById('english-container')
  ].filter(container => container);
  
  containers.forEach(container => {
    mainEl.appendChild(container);
    container.style.display = 'block';
  });
}

async function toggleExplanation() {
  console.log('toggleExplanation started');
  
  const verseId = getQueryParam('id');
  console.log('Verse ID:', verseId);
  if (!verseId) return;
  
  const visibility = sessionVisibility.get();
  const mainEl = document.getElementById('verse-main');
  let explanationContainer = document.getElementById('explanation-container');
  
  // Toggle visibility if container already exists
  if (explanationContainer) {
    const isVisible = explanationContainer.style.display !== 'none';
    explanationContainer.style.display = isVisible ? 'none' : 'block';
    visibility.explanation = !isVisible;
    sessionVisibility.set(visibility);
    return;
  }
  
  // Create and add explanation container
  explanationContainer = document.createElement('div');
  explanationContainer.id = 'explanation-container';
  explanationContainer.className = 'content-section';
  mainEl.appendChild(explanationContainer);
  
  // Show loading message
  explanationContainer.innerHTML = '<p style="color: var(--text-secondary);">Loading explanation...</p>';
  
  try {
    // Lazy-load explanation content
    console.log(`Fetching: /data/Verse${verseId}.explanation`);
    const explanationText = await safeFetchText(`/data/Verse${verseId}.explanation`);
    console.log('Explanation text:', explanationText);
    
    if (!explanationText) {
      explanationContainer.innerHTML = '<div class="placeholder">Explanation not available for this verse</div>';
      return;
    }
    
    // Render explanation as Markdown
    console.log('Rendering explanation...');
    await renderExplanation(explanationContainer, explanationText);
    
    // Update visibility state
    visibility.explanation = true;
    sessionVisibility.set(visibility);
  } catch (error) {
    console.error('Error in toggleExplanation:', error);
    explanationContainer.innerHTML = '<div class="placeholder">Error loading explanation</div>';
  }
}

function goPrev(prevId) {
  if (prevId) {
    location.href = `verse.html?id=${encodeURIComponent(prevId)}`;
  }
}

function goNext(nextId) {
  if (nextId) {
    location.href = `verse.html?id=${encodeURIComponent(nextId)}`;
  }
}

function decScale() {
  console.log('decScale');
  incrementScale(-0.1);
}

function incScale() {
  console.log('incScale');
  incrementScale(0.1);
}