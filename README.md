# Markdown Viewer

[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Version](https://img.shields.io/badge/version-1.0.1-emerald.svg)](manifest.json)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

A lightweight, distraction-free browser extension (Manifest V3) that renders local and remote Markdown files into beautifully formatted, readable editorial documents right inside your browser.

---

## ✨ Features

- 📖 **Clean Editorial Typography**
  - Carefully tuned typography designed for comfortable long-form reading and technical documentation.
  - Warm, eye-friendly **Light theme** and deep **Dark theme**, with automatic switching based on system preferences (`prefers-color-scheme`).

- 📊 **Mermaid Diagrams On-Demand**
  - Seamlessly renders Mermaid code fences (`flowchart`, `sequenceDiagram`, `classDiagram`, `stateDiagram`, etc.) into responsive vector SVGs.
  - **Dynamic Lazy Loading**: Mermaid library is only loaded when diagrams are present, ensuring zero memory and performance overhead for plain documents.

- 📑 **Interactive Table of Contents (TOC)**
  - Floating, collapsible navigation drawer.
  - Dynamic **scrollspy** that highlights the active section in real-time as you scroll.
  - Smooth anchor link scrolling.

- 💻 **Syntax Highlighting & Code Blocks**
  - High-performance syntax highlighting powered by Prism.js.
  - Automatic language badge tags.
  - One-click **Copy Code** button that copies clean code without line numbers.
  - Toggleable line numbers.

- 🔔 **GitHub-Style Alert Callouts**
  - Native rendering of GitHub markdown callouts: `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, and `[!CAUTION]` with distinct icons and themed borders.

- 🔄 **Live Local Auto-Reload**
  - Automatically detects changes to local `file://` documents and refreshes the preview in real-time—perfect for live editing with your favorite text editor (VS Code, Neovim, Obsidian, etc.).

- 🧰 **Sticky Header Toolbar**
  - **File Title & Name**: Displays document heading and filename.
  - **TOC Toggle**: Easily open and close the outline sidebar.
  - **Raw View Toggle (`</>`)**: Switch between rendered HTML and untouched raw Markdown source instantly.
  - **Copy HTML**: Copy the rendered HTML markup to clipboard with a single click.

- ⚙️ **Real-Time Settings Popup**
  - Adjust font size dynamically from `12px` to `20px`.
  - Switch themes (`Auto`, `Light`, `Dark`) on the fly.
  - Toggle line numbers and auto-reload per user preference.
  - Settings persist across browser sessions via `chrome.storage.sync`.

- 🧹 **Front Matter Sanitization**
  - Cleanly strips YAML front matter (`--- ... ---`) from the rendered view while preserving it in raw view and auto-reload checks.

- 🖼️ **Image Captions & Custom Checkboxes**
  - Automatically wraps images with `alt` text in `<figure>` and `<figcaption>`.
  - Clean, read-only custom styled task checkboxes.

---

## 📂 Supported Extensions

Markdown Viewer automatically activates on any URL ending with:
- `.md`
- `.markdown`
- `.mdown`
- `.mkd`
- `.mkdn`
- `.mdx`

---

## 🚀 Installation

### Chromium-based Browsers (Chrome, Edge, Brave, Opera, Vivaldi)

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/naga361111/MarkdownViewerForWebExtension.git
   ```

2. Open the extensions management page in your browser:
   - **Chrome**: `chrome://extensions`
   - **Edge**: `edge://extensions`
   - **Brave**: `brave://extensions`

3. Turn on **Developer mode** (toggle located in the top-right corner).

4. Click **Load unpacked** and select the folder where this repository was cloned (`MarkdownViewer`).

5. ⚠️ **Enable Local File Access (Crucial for `file://` URLs)**:
   - On the **Markdown Viewer** card, click **Details**.
   - Scroll down and toggle ON **"Allow access to file URLs"** (*파일 URL에 대한 액세스 허용*).

---

## 💡 How to Use

1. **Open any local Markdown file**:
   - Drag and drop a `.md` file directly into your browser, or open a URL like:
     ```
     file:///path/to/your-document.md
     ```
2. **Open any web Markdown file**:
   - Navigate to raw markdown files hosted online (e.g., raw GitHub content, Gists, or documentation files).
3. **Customize your view**:
   - Click the **Markdown Viewer** extension icon in your browser toolbar to change theme, adjust font size, or enable auto-reload.
4. **Test with the included sample**:
   - Open [`test/sample.md`](test/sample.md) to inspect all supported formatting features, tables, alerts, code blocks, and Mermaid diagrams.

---

## 📁 Project Structure

```
MarkdownViewer/
├── manifest.json         # Extension Manifest V3 configuration
├── content.js            # Main content script (parsing, TOC, alerts, toolbar, auto-reload)
├── popup/
│   ├── popup.html        # Settings popup interface
│   ├── popup.css         # Popup styles (segmented controls, sliders, toggles)
│   └── popup.js          # Popup settings handler & chrome.storage synchronization
├── styles/
│   └── markdown.css      # Editorial theme stylesheets (CSS variables, typography, layout)
├── lib/
│   ├── marked.min.js     # Markdown parser
│   ├── mermaid.mjs       # Mermaid diagram renderer (lazy-loaded ES module)
│   ├── prism-bundle.js   # Prism syntax highlighter
│   └── prism.css         # Prism base styles
├── icons/
│   └── icon128.png       # Extension icon
└── test/
    ├── sample.md         # Comprehensive test document
    └── banner.jpg        # Sample asset for image tests
```

---

## 🔒 Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Persists user preferences (theme, font size, line numbers, auto-reload) via `chrome.storage.sync`. |
| `activeTab` | Sends instant setting updates to the currently viewed Markdown document. |

---

## 🛠️ Built With

- [Marked](https://marked.js.org/) — High-speed GFM Markdown parser
- [Prism](https://prismjs.com/) — Lightweight syntax highlighter
- [Mermaid](https://mermaid.js.org/) — Diagramming and charting tool
- Vanilla JavaScript & CSS Variables — No heavy bundlers or dependencies required

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
