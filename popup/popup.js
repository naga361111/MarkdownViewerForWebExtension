const DEFAULT_SETTINGS = {
  theme: 'auto',
  fontSize: 16,
  autoReload: false,
  lineNumbers: true
};

const themeRadios = document.querySelectorAll('input[name="theme"]');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const autoReloadCheckbox = document.getElementById('autoReload');
const lineNumbersCheckbox = document.getElementById('lineNumbers');

function updateSliderProgress(slider) {
  const min = Number(slider.min) || 12;
  const max = Number(slider.max) || 20;
  const pct = ((Number(slider.value) - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-muted) ${pct}%, var(--bg-muted) 100%)`;
}

function getCurrentSettings() {
  return {
    theme: document.querySelector('input[name="theme"]:checked')?.value ?? DEFAULT_SETTINGS.theme,
    fontSize: parseInt(fontSizeSlider.value, 10) || DEFAULT_SETTINGS.fontSize,
    autoReload: autoReloadCheckbox.checked,
    lineNumbers: lineNumbersCheckbox.checked
  };
}

function applySettingsToUI(settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings };

  const radio = document.querySelector(`input[name="theme"][value="${s.theme}"]`);
  if (radio) radio.checked = true;

  fontSizeSlider.value = s.fontSize;
  fontSizeDisplay.textContent = `${s.fontSize}px`;
  updateSliderProgress(fontSizeSlider);

  autoReloadCheckbox.checked = s.autoReload;
  lineNumbersCheckbox.checked = s.lineNumbers;
}

function notifyActiveTab(settings) {
  if (typeof chrome === 'undefined' || !chrome.tabs) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'updateSettings', settings }, () => {
      void chrome.runtime?.lastError;
    });
  });
}

function saveAndBroadcast() {
  const settings = getCurrentSettings();
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime?.lastError) {
        console.error('Failed to save settings:', chrome.runtime.lastError);
      }
      notifyActiveTab(settings);
    });
  } else {
    notifyActiveTab(settings);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      applySettingsToUI(chrome.runtime?.lastError ? DEFAULT_SETTINGS : items);
    });
  } else {
    applySettingsToUI(DEFAULT_SETTINGS);
  }

  themeRadios.forEach(r => r.addEventListener('change', saveAndBroadcast));

  fontSizeSlider.addEventListener('input', () => {
    fontSizeDisplay.textContent = `${fontSizeSlider.value}px`;
    updateSliderProgress(fontSizeSlider);
    saveAndBroadcast();
  });

  autoReloadCheckbox.addEventListener('change', saveAndBroadcast);
  lineNumbersCheckbox.addEventListener('change', saveAndBroadcast);
});
