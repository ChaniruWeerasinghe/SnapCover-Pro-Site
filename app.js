/* 
  SnapCover Pro - Application Engine
  Features: Real-time URL validation, Canvas Image Conversion (PNG/JPG/WebP),
  Custom Toast System, Theme Switcher & Responsive UI.
*/

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUrlValidation();
  initCustomDropdown();
  initGithubDropdown();
  initFormHandler();
});

// State Management
const state = {
  selectedFormat: 'png', // 'png', 'jpg', 'webp'
  currentVideoId: null,
  isProcessing: false
};

/* --- Theme Management --- */
function initTheme() {
  const savedTheme = localStorage.getItem('snapcover_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('snapcover_theme', next);
      updateThemeIcon(next);
      showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} mode`, 'info');
    });
  }
}

function updateThemeIcon(theme) {
  const iconContainer = document.getElementById('themeIcon');
  if (!iconContainer) return;
  
  if (theme === 'light') {
    // Sun Icon
    iconContainer.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
  } else {
    // Moon Icon
    iconContainer.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
  }
}

/* --- YouTube URL Parsing & Validation --- */
const YT_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

function extractVideoId(url) {
  if (!url) return null;
  const match = url.trim().match(YT_REGEX);
  return match && match[1] ? match[1] : null;
}

function initUrlValidation() {
  const input = document.getElementById('urlInput');
  const hint = document.getElementById('validationHint');
  
  if (!input || !hint) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (!val) {
      input.classList.remove('input-warning', 'input-valid');
      hint.className = 'validation-hint';
      hint.innerHTML = '';
      return;
    }

    const videoId = extractVideoId(val);
    if (videoId) {
      input.classList.remove('input-warning');
      input.classList.add('input-valid');
      hint.className = 'validation-hint hint-valid';
      hint.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Valid YouTube link detected! ID: ${videoId}`;
    } else {
      input.classList.remove('input-valid');
      input.classList.add('input-warning');
      hint.className = 'validation-hint hint-warning';
      hint.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Please enter a complete YouTube video URL.`;
    }
  });
}

/* --- Custom Dropdown Logic (No native select) --- */
function initCustomDropdown() {
  const dropdown = document.getElementById('formatDropdown');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.dropdown-trigger');
  const options = dropdown.querySelectorAll('.dropdown-option');
  const selectedText = document.getElementById('selectedFormatText');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.selectedFormat = opt.dataset.value;
      if (selectedText) selectedText.innerText = opt.dataset.value.toUpperCase();
      dropdown.classList.remove('open');
      if (state.currentVideoId) {
        renderQualityCards(state.currentVideoId);
      }
    });
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });
}

/* --- GitHub Dual-Account Dropdown Handler --- */
function initGithubDropdown() {
  const wrapper = document.getElementById('githubDropdownWrapper');
  const btn = document.getElementById('githubBtn');
  if (!wrapper || !btn) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    wrapper.classList.remove('open');
  });
}

/* --- Form Processing --- */
function initFormHandler() {
  const processBtn = document.getElementById('processBtn');
  const input = document.getElementById('urlInput');

  if (processBtn) {
    processBtn.addEventListener('click', handleProcess);
  }

  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleProcess();
      }
    });
  }
}

async function handleProcess() {
  const input = document.getElementById('urlInput');
  const val = input ? input.value.trim() : '';
  const videoId = extractVideoId(val);

  if (!videoId) {
    showToast('Please enter a valid YouTube video link before processing.', 'error');
    return;
  }

  state.currentVideoId = videoId;

  // Show progress animation
  const progressContainer = document.getElementById('progressContainer');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressText = document.getElementById('progressText');
  const resultsSection = document.getElementById('resultsSection');

  progressContainer.classList.add('active');
  resultsSection.classList.remove('active');

  for (let i = 0; i <= 100; i += 20) {
    await new Promise(res => setTimeout(res, 100));
    progressBarFill.style.width = `${i}%`;
    progressText.innerText = `${i}%`;
  }

  setTimeout(() => {
    progressContainer.classList.remove('active');
    
    // Set preview image
    const previewImg = document.getElementById('previewImg');
    previewImg.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    renderQualityCards(videoId);
    resultsSection.classList.add('active');
    showToast('Thumbnails loaded successfully!', 'success');
  }, 250);
}

/* --- Estimated File Size Calculator --- */
function getEstimatedSize(key, format) {
  const f = (format || 'png').toLowerCase();
  const estimates = {
    '8k': { png: '~14.5 MB', jpg: '~4.8 MB', webp: '~2.8 MB' },
    '4k': { png: '~4.5 MB', jpg: '~1.8 MB', webp: '~1.1 MB' },
    'maxresdefault': { png: '~1.8 MB', jpg: '~520 KB', webp: '~340 KB' },
    'sddefault': { png: '~380 KB', jpg: '~110 KB', webp: '~75 KB' },
    'hqdefault': { png: '~210 KB', jpg: '~60 KB', webp: '~40 KB' },
    'mqdefault': { png: '~95 KB', jpg: '~30 KB', webp: '~20 KB' }
  };
  return (estimates[key] && estimates[key][f]) ? estimates[key][f] : '~1.0 MB';
}

/* --- Render Quality Cards & Download Buttons --- */
function renderQualityCards(videoId) {
  const grid = document.getElementById('qualityGrid');
  if (!grid) return;

  grid.innerHTML = '';

  const qualities = [
    { title: 'Ultra HD 8K', specs: '7680 x 4320 • Canvas Super Resolution', key: '8k', sourceKey: 'maxresdefault', width: 7680, height: 4320, isUpscaled: true },
    { title: 'Ultra HD 4K', specs: '3840 x 2160 • High-Res Canvas Asset', key: '4k', sourceKey: 'maxresdefault', width: 3840, height: 2160, isUpscaled: true },
    { title: 'Maximum Resolution (HD)', specs: '1920 x 1080 / 1280 x 720 • Native Original', key: 'maxresdefault', sourceKey: 'maxresdefault', isUpscaled: false },
    { title: 'High Quality', specs: '640 x 480', key: 'sddefault', sourceKey: 'sddefault', isUpscaled: false },
    { title: 'Medium Quality', specs: '480 x 360', key: 'hqdefault', sourceKey: 'hqdefault', isUpscaled: false },
    { title: 'Standard Quality', specs: '320 x 180', key: 'mqdefault', sourceKey: 'mqdefault', isUpscaled: false }
  ];

  qualities.forEach(q => {
    const estimatedSize = getEstimatedSize(q.key, state.selectedFormat);
    const card = document.createElement('div');
    card.className = 'quality-card';
    card.id = `card-${q.key}`;
    card.innerHTML = `
      <div class="quality-info">
        <div class="quality-header-row">
          <div class="quality-title-group">
            <span class="quality-title">${q.title}</span>
            ${q.isUpscaled ? '<span class="tag-upscaled">UPSCALED</span>' : ''}
          </div>
          <span class="size-badge" id="badge-${q.key}">${estimatedSize}</span>
        </div>
        <div class="quality-specs">${q.specs}</div>
      </div>
      <button class="quality-btn" id="btn-${q.key}" data-key="${q.key}">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        <span class="btn-label">Download ${state.selectedFormat.toUpperCase()}</span>
      </button>
    `;

    const btn = card.querySelector('.quality-btn');
    btn.addEventListener('click', () => {
      const imageUrl = `https://img.youtube.com/vi/${videoId}/${q.sourceKey}.jpg`;
      const filename = `SnapCover_${videoId}_${q.key}.${state.selectedFormat}`;
      downloadThumbnail(imageUrl, filename, state.selectedFormat, q.width, q.height, q.key);
    });

    grid.appendChild(card);
  });
}

/* --- Canvas Conversion & Direct Download Logic --- */
async function downloadThumbnail(url, filename, format, targetWidth, targetHeight, cardKey) {
  const btn = document.getElementById(`btn-${cardKey}`);
  const btnLabel = btn ? btn.querySelector('.btn-label') : null;
  const originalBtnText = btnLabel ? btnLabel.innerText : '';

  if (btnLabel) btnLabel.innerText = 'Converting...';

  try {
    // Create offscreen image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // We append a timestamp to bypass standard browser cached non-CORS response
    const cacheBustUrl = `${url}?nocache=${Date.now()}`;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = cacheBustUrl;
    });

    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    const targetW = targetWidth || (img.naturalWidth || img.width);
    const targetH = targetHeight || (img.naturalHeight || img.height);
    
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Determine target MIME type
    let mimeType = 'image/jpeg';
    if (format === 'png') mimeType = 'image/png';
    if (format === 'webp') mimeType = 'image/webp';

    // Convert canvas to Blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas conversion failed');
      }

      // Calculate real MB / KB file size
      const bytes = blob.size;
      let realSizeStr = '';
      if (bytes >= 1024 * 1024) {
        realSizeStr = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
      } else {
        realSizeStr = (bytes / 1024).toFixed(0) + ' KB';
      }

      // Update badge with Real Size indicator
      const badge = document.getElementById(`badge-${cardKey}`);
      if (badge) {
        badge.innerText = `${realSizeStr}`;
        badge.classList.add('real-size');
      }

      if (btnLabel) btnLabel.innerText = `Downloaded (${realSizeStr})`;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        if (btnLabel) btnLabel.innerText = originalBtnText;
      }, 2500);

    }, mimeType, 0.95);

  } catch (err) {
    console.warn('Canvas direct conversion notice:', err);
    if (btnLabel) btnLabel.innerText = originalBtnText;
    window.open(url, '_blank');
  }
}

/* --- Toast Notification System (Disabled) --- */
function showToast() {
  // Toast notifications disabled per user request
}
