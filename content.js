(function () {
  'use strict';

  const pathname = location.pathname.toLowerCase();
  const mdExtensions = ['.md', '.markdown', '.mdown', '.mkd', '.mkdn', '.mdx'];
  if (!mdExtensions.some(ext => pathname.endsWith(ext))) return;

  const body = document.body;
  if (!body) return;

  const pre = body.querySelector('pre');
  const isPlainText =
    (body.childElementCount === 1 && pre) ||
    (body.children.length <= 2 && pre);
  if (!isPlainText) return;

  const rawMarkdown = pre.textContent;
  if (!rawMarkdown || rawMarkdown.trim().length === 0) return;

  const DEFAULT_SETTINGS = {
    theme: 'auto',
    fontSize: 16,
    autoReload: false,
    lineNumbers: true,
  };

  let currentSettings = { ...DEFAULT_SETTINGS };

  function buildPage(settings) {
    if (typeof marked !== 'undefined') {
      marked.setOptions({ gfm: true, breaks: true });
    }

    const htmlContent = typeof marked !== 'undefined'
      ? marked.parse(rawMarkdown)
      : escapeHtml(rawMarkdown);

    document.body.innerHTML = '';
    document.body.className = '';

    const titleMatch = rawMarkdown.match(/^#\s+(.+)$/m);
    const fileName = decodeURIComponent(pathname.split('/').pop());
    document.title = titleMatch ? titleMatch[1].trim() : fileName;

    const wrapper = document.createElement('div');
    wrapper.id = 'md-viewer-root';
    wrapper.className = 'md-viewer';

    const toolbar = document.createElement('div');
    toolbar.className = 'md-toolbar';
    toolbar.innerHTML = `
      <div class="md-toolbar-left">
        <span class="md-toolbar-icon">M↓</span>
        <span class="md-toolbar-filename">${escapeHtml(fileName)}</span>
      </div>
      <div class="md-toolbar-right">
        <button id="md-toggle-raw" class="md-toolbar-btn" title="Raw view">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L1 8l3 4M12 4l3 4-3 4M10 2L6 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button id="md-copy-html" class="md-toolbar-btn" title="Copy HTML">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;

    const content = document.createElement('article');
    content.className = 'md-content markdown-body';
    content.innerHTML = htmlContent;

    wrapper.appendChild(toolbar);
    wrapper.appendChild(content);
    document.body.appendChild(wrapper);

    applyTheme(settings.theme);
    content.style.fontSize = settings.fontSize + 'px';

    if (settings.lineNumbers) {
      document.body.classList.add('md-line-numbers');
    }

    if (typeof Prism !== 'undefined') {
      content.querySelectorAll('pre code').forEach(block => {
        if (!Array.from(block.classList).some(c => c.startsWith('language-'))) {
          block.classList.add('language-text');
        }
      });
      Prism.highlightAllUnder(content);
    }

    if (settings.lineNumbers) {
      content.querySelectorAll('pre code').forEach(addLineNumbers);
    }

    const toggleBtn = document.getElementById('md-toggle-raw');
    let showingRaw = false;

    toggleBtn.addEventListener('click', () => {
      showingRaw = !showingRaw;
      if (showingRaw) {
        content.innerHTML = `<pre class="md-raw-view"><code>${escapeHtml(rawMarkdown)}</code></pre>`;
        toggleBtn.classList.add('active');
      } else {
        content.innerHTML = htmlContent;
        if (typeof Prism !== 'undefined') Prism.highlightAllUnder(content);
        if (settings.lineNumbers) {
          content.querySelectorAll('pre code').forEach(addLineNumbers);
        }
        toggleBtn.classList.remove('active');
      }
    });

    const copyBtn = document.getElementById('md-copy-html');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(htmlContent).then(() => {
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 1500);
      });
    });

    content.querySelectorAll('a').forEach(a => {
      if (a.hostname !== location.hostname) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    content.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.setAttribute('disabled', 'disabled');
    });

    if (settings.autoReload) {
      startAutoReload();
    } else {
      stopAutoReload();
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function applyTheme(theme) {
    document.body.classList.remove('md-theme-light', 'md-theme-dark');
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(prefersDark ? 'md-theme-dark' : 'md-theme-light');
    } else {
      document.body.classList.add(`md-theme-${theme}`);
    }
  }

  function addLineNumbers(codeBlock) {
    const lines = codeBlock.innerHTML.split('\n');
    if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
      lines.pop();
    }
    codeBlock.innerHTML = lines.map((line, i) =>
      `<span class="line-number" data-line="${i + 1}"></span>${line}`
    ).join('\n');
  }

  let autoReloadInterval = null;
  let lastContent = rawMarkdown;
  const url = location.href;

  function startAutoReload() {
    if (autoReloadInterval) return;
    if (!url.startsWith('file://')) return;

    autoReloadInterval = setInterval(() => {
      fetch(url)
        .then(res => res.text())
        .then(text => {
          if (text !== lastContent) {
            lastContent = text;
            location.reload();
          }
        })
        .catch(() => {});
    }, 1500);
  }

  function stopAutoReload() {
    if (autoReloadInterval) {
      clearInterval(autoReloadInterval);
      autoReloadInterval = null;
    }
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
      currentSettings = { ...DEFAULT_SETTINGS, ...settings };
      buildPage(currentSettings);
    });
  } else {
    buildPage(currentSettings);
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'updateSettings') {
        currentSettings = { ...DEFAULT_SETTINGS, ...message.settings };
        buildPage(currentSettings);
        sendResponse({ ok: true });
      }
    });
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.autoReload) {
        if (changes.autoReload.newValue) {
          startAutoReload();
        } else {
          stopAutoReload();
        }
      }
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentSettings.theme === 'auto') {
      applyTheme('auto');
    }
  });
})();
