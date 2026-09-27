document.addEventListener('DOMContentLoaded', () => {
  const sourceText = document.getElementById('source-text');
  const outputText = document.getElementById('output-text');
  const sourceLang = document.getElementById('source-lang');
  const targetLang = document.getElementById('target-lang');
  const swapLangsBtn = document.getElementById('swap-langs-btn');
  const clearBtn = document.getElementById('clear-btn');
  const charCount = document.getElementById('char-count');
  const ttsBtn = document.getElementById('tts-btn');
  const copyBtn = document.getElementById('copy-btn');
  const speechBtn = document.getElementById('speech-btn');
  const engineBadge = document.getElementById('engine-badge');
  
  const configBtn = document.getElementById('config-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeBtn = document.querySelector('.close-btn');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveSettingsBtn = document.getElementById('save-settings-btn');

  let apiKey = localStorage.getItem('translator_api_key') || '';
  apiKeyInput.value = apiKey;
  updateEngineBadge();

  let history = JSON.parse(localStorage.getItem('translator_history')) || [];
  renderHistory();

  let debounceTimer;
  sourceText.addEventListener('input', () => {
    const text = sourceText.value;
    charCount.textContent = `${text.length} / 5000`;
    
    if (text.trim() === '') {
      clearOutput();
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performTranslation, 600);
  });

  clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    clearOutput();
    charCount.textContent = '0 / 5000';
  });

  function clearOutput() {
    outputText.textContent = 'Translation will appear here...';
    outputText.classList.add('output-placeholder');
    ttsBtn.disabled = true;
    copyBtn.disabled = true;
  }

  swapLangsBtn.addEventListener('click', () => {
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value === 'auto' ? 'en' : targetLang.value;
    targetLang.value = temp === 'auto' ? 'en' : temp;
    
    const tempText = sourceText.value;
    sourceText.value = outputText.classList.contains('output-placeholder') ? '' : outputText.textContent;
    if (sourceText.value) {
      performTranslation();
    } else {
      clearOutput();
    }
  });

  async function performTranslation() {
    const text = sourceText.value.trim();
    if (!text) return;

    outputText.textContent = 'Translating...';
    outputText.classList.remove('output-placeholder');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          sourceLang: sourceLang.value,
          targetLang: targetLang.value,
          apiKey
        })
      });

      if (!response.ok) {
        throw new Error('Translation request failed');
      }

      const data = await response.json();
      outputText.textContent = data.translatedText;
      ttsBtn.disabled = false;
      copyBtn.disabled = false;

      addToHistory(text, data.translatedText, sourceLang.value, targetLang.value);

    } catch (error) {
      outputText.textContent = 'Error: Could not complete translation. Please try again.';
      outputText.classList.add('output-placeholder');
    }
  }

  copyBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (text && !outputText.classList.contains('output-placeholder')) {
      navigator.clipboard.writeText(text).then(() => {
        const originalIcon = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = originalIcon;
        }, 2000);
      });
    }
  });

  ttsBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (text && !outputText.classList.contains('output-placeholder')) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang.value;
      window.speechSynthesis.speak(utterance);
    }
  });

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    speechBtn.addEventListener('click', () => {
      recognition.lang = sourceLang.value === 'auto' ? 'en-US' : sourceLang.value;
      recognition.start();
      speechBtn.style.color = 'red';
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      sourceText.value = transcript;
      charCount.textContent = `${transcript.length} / 5000`;
      performTranslation();
    };

    recognition.onend = () => {
      speechBtn.style.color = '';
    };
  } else {
    speechBtn.style.display = 'none';
  }

  configBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  });

  saveSettingsBtn.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('translator_api_key', apiKey);
    updateEngineBadge();
    settingsModal.style.display = 'none';
  });

  function updateEngineBadge() {
    if (apiKey) {
      engineBadge.textContent = 'Premium AI';
      engineBadge.style.backgroundColor = '#d1fae5';
      engineBadge.style.color = '#065f46';
    } else {
      engineBadge.textContent = 'Local AI';
      engineBadge.style.backgroundColor = '#e0e7ff';
      engineBadge.style.color = '#4f46e5';
    }
  }

  function addToHistory(original, translated, from, to) {
    if (history.length > 0 && history[0].original === original && history[0].to === to) {
      return;
    }
    history.unshift({ original, translated, from, to });
    if (history.length > 5) history.pop();
    localStorage.setItem('translator_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (history.length === 0) {
      historyList.innerHTML = '<p class="no-history">No recent translations yet.</p>';
      return;
    }
    historyList.innerHTML = history.map(item => `
      <div class="history-item">
        <div class="history-content">
          <span class="history-langs">${item.from} <i class="fa-solid fa-arrow-right"></i> ${item.to}</span>
          <div class="history-text"><strong>Original:</strong> ${escapeHtml(item.original)}</div>
          <div class="history-translation"><strong>Translation:</strong> ${escapeHtml(item.translated)}</div>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});