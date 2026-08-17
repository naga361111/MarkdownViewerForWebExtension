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

  // YAML front matter (Jekyll/Hugo/Obsidian) is metadata, not content. Left in, marked
  // renders it as an <hr> plus a bogus heading, which also lands in the TOC.
  // Raw view and auto-reload keep using rawMarkdown — they need the untouched file.
  const FRONT_MATTER = /^\uFEFF?---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;
  const markdownBody = rawMarkdown.replace(FRONT_MATTER, '');

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
      ? marked.parse(markdownBody)
      : escapeHtml(markdownBody);

    document.body.innerHTML = '';
    document.body.className = '';

    const titleMatch = markdownBody.match(/^#\s+(.+)$/m);
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
        <button id="md-toggle-toc" class="md-toolbar-btn" title="Table of contents">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h9M2 12h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
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

    // These two rewrite the document itself, so they run once and land in the
    // snapshot below. Everything re-applied per render lives in enhanceContent.
    transformAlerts(content);
    const toc = buildToc(content);
    const renderedHtml = content.innerHTML;

    wrapper.appendChild(toolbar);
    if (toc) wrapper.appendChild(toc);
    wrapper.appendChild(content);
    document.body.appendChild(wrapper);

    applyTheme(settings.theme);
    content.style.fontSize = settings.fontSize + 'px';

    if (settings.lineNumbers) {
      document.body.classList.add('md-line-numbers');
    }

    enhanceContent(content, settings);

    const tocBtn = document.getElementById('md-toggle-toc');
    if (toc) {
      tocBtn.addEventListener('click', () => {
        const open = wrapper.classList.toggle('md-toc-open');
        tocBtn.classList.toggle('active', open);
      });
    } else {
      tocBtn.remove();
    }

    const toggleBtn = document.getElementById('md-toggle-raw');
    let showingRaw = false;

    toggleBtn.addEventListener('click', () => {
      showingRaw = !showingRaw;
      if (showingRaw) {
        content.innerHTML = `<pre class="md-raw-view"><code>${escapeHtml(rawMarkdown)}</code></pre>`;
        toggleBtn.classList.add('active');
        // Headings are gone in raw view, so the TOC links have nothing to hit.
        wrapper.classList.remove('md-toc-open');
        tocBtn?.classList.remove('active');
      } else {
        content.innerHTML = renderedHtml;
        enhanceContent(content, settings);
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

    if (settings.autoReload) {
      startAutoReload();
    } else {
      stopAutoReload();
    }
  }

  // Re-applied after every render, including the raw-view round trip.
  function enhanceContent(content, settings) {
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

    addCopyButtons(content);

    content.querySelectorAll('a').forEach(a => {
      if (a.hostname !== location.hostname) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    content.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.setAttribute('disabled', 'disabled');
    });
  }

  function addCopyButtons(content) {
    content.querySelectorAll('pre').forEach(pre => {
      if (pre.classList.contains('md-raw-view')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'md-code-copy';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');

      btn.addEventListener('click', () => {
        // Line numbers render via CSS ::before, so textContent is just the code.
        const code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.textContent).then(() => {
          btn.textContent = 'Copied';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 1500);
        });
      });

      // The button sits outside <pre> so it stays put while long lines scroll.
      const wrap = document.createElement('div');
      wrap.className = 'md-code-wrap';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      wrap.appendChild(btn);
    });
  }

  // GitHub alert callouts: "> [!NOTE]" and friends. marked has no notion of
  // these, so it leaves the marker as literal text in the blockquote.
  const ALERTS = {
    note:      { label: 'Note',      icon: '<path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 7.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zM8 4.5a.9.9 0 100 1.8.9.9 0 000-1.8z"/>' },
    tip:       { label: 'Tip',       icon: '<path d="M8 1.5a4.5 4.5 0 00-2.6 8.17c.3.22.48.56.48.93v.4h4.24v-.4c0-.37.18-.71.48-.93A4.5 4.5 0 008 1.5zM6.3 13.1h3.4a.75.75 0 010 1.5H6.3a.75.75 0 010-1.5z"/>' },
    important: { label: 'Important', icon: '<path d="M2.5 2.75c0-.14.11-.25.25-.25h10.5c.14 0 .25.11.25.25v7.5c0 .14-.11.25-.25.25H5.5L2.5 13.5V2.75zM7.25 4.5v3.25a.75.75 0 001.5 0V4.5a.75.75 0 00-1.5 0zM8 10.25a.9.9 0 100-1.8.9.9 0 000 1.8z"/>' },
    warning:   { label: 'Warning',   icon: '<path d="M7.06 2.2a1.1 1.1 0 011.88 0l5.2 9.1c.42.73-.11 1.65-.94 1.65H2.8c-.83 0-1.36-.92-.94-1.65l5.2-9.1zM7.25 5.75V9a.75.75 0 001.5 0V5.75a.75.75 0 00-1.5 0zM8 11.5a.9.9 0 100-1.8.9.9 0 000 1.8z"/>' },
    caution:   { label: 'Caution',   icon: '<path d="M5.16 1.5h5.68l4.16 4.16v5.68l-4.16 4.16H5.16L1 11.34V5.66L5.16 1.5zM7.25 5v3.5a.75.75 0 001.5 0V5a.75.75 0 00-1.5 0zM8 11.75a.9.9 0 100-1.8.9.9 0 000 1.8z"/>' },
  };

  function transformAlerts(content) {
    content.querySelectorAll('blockquote').forEach(quote => {
      const para = quote.querySelector('p');
      const marker = para && para.firstChild;
      if (!marker || marker.nodeType !== Node.TEXT_NODE) return;

      const match = marker.textContent.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*/i);
      if (!match) return;
      const type = match[1].toLowerCase();

      // Drop the marker, plus the <br> that `breaks: true` put after it.
      marker.textContent = marker.textContent.slice(match[0].length);
      if (!marker.textContent) marker.remove();
      if (para.firstChild && para.firstChild.nodeName === 'BR') para.firstChild.remove();
      if (!para.textContent.trim() && !para.firstElementChild) para.remove();

      quote.classList.add('md-alert', `md-alert-${type}`);

      const title = document.createElement('p');
      title.className = 'md-alert-title';
      title.innerHTML =
        `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">${ALERTS[type].icon}</svg>` +
        `<span></span>`;
      title.querySelector('span').textContent = ALERTS[type].label;
      quote.prepend(title);
    });
  }

  function slugify(text, used) {
    const base = text.trim().toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')   // drop emoji/punctuation
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section';
    let slug = base;
    for (let i = 1; used.has(slug); i++) slug = `${base}-${i}`;
    used.add(slug);
    return slug;
  }

  function buildToc(content) {
    const headings = content.querySelectorAll('h1, h2, h3, h4');
    if (headings.length < 2) return null;

    const used = new Set();
    const list = document.createElement('ul');
    list.className = 'md-toc-list';

    headings.forEach(h => {
      if (h.id) used.add(h.id);
      else h.id = slugify(h.textContent, used);

      const link = document.createElement('a');
      link.href = `#${h.id}`;
      link.textContent = h.textContent;

      const item = document.createElement('li');
      item.className = `md-toc-item md-toc-h${h.tagName[1]}`;
      item.appendChild(link);
      list.appendChild(item);
    });

    const nav = document.createElement('nav');
    nav.className = 'md-toc';
    nav.setAttribute('aria-label', 'Table of contents');

    const title = document.createElement('div');
    title.className = 'md-toc-title';
    title.textContent = 'Contents';

    nav.appendChild(title);
    nav.appendChild(list);
    return nav;
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
