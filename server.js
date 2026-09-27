const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

const mockTranslations = {
  "hello": { "es": "hola", "fr": "bonjour", "de": "hallo", "it": "ciao", "zh": "你好", "ja": "こんにちは" },
  "how are you?": { "es": "¿cómo estás?", "fr": "comment ça va?", "de": "wie geht es dir?", "it": "come stai?", "zh": "你好吗？", "ja": "お元気ですか？" },
  "thank you": { "es": "gracias", "fr": "merci", "de": "danke", "it": "grazie", "zh": "谢谢", "ja": "ありがとう" },
  "goodbye": { "es": "adiós", "fr": "au revoir", "de": "auf wiedersehen", "it": "arrivederci", "zh": "再见", "ja": "さようなら" }
};

function performMockTranslation(text, sourceLang, targetLang) {
  const cleanText = text.trim().toLowerCase();
  if (mockTranslations[cleanText] && mockTranslations[cleanText][targetLang]) {
    return mockTranslations[cleanText][targetLang];
  }
  const languageNames = {
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    zh: "Chinese",
    ja: "Japanese",
    en: "English"
  };
  const targetName = languageNames[targetLang] || targetLang;
  if (targetLang === 'es') {
    return `[Simulated AI Translation to Spanish] ${text} (traducido)`;
  } else if (targetLang === 'fr') {
    return `[Simulated AI Translation to French] ${text} (traduit)`;
  } else if (targetLang === 'de') {
    return `[Simulated AI Translation to German] ${text} (übersetzt)`;
  } else if (targetLang === 'it') {
    return `[Simulated AI Translation to Italian] ${text} (tradotto)`;
  } else if (targetLang === 'zh') {
    return `[Simulated AI Translation to Chinese] ${text} (翻译)`;
  } else if (targetLang === 'ja') {
    return `[Simulated AI Translation to Japanese] ${text} (翻訳済)`;
  }
  return `[Simulated AI Translation to ${targetName}] ${text}`;
}

app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang, apiKey } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for translation.' });
    }
    await new Promise(resolve => setTimeout(resolve, 800));
    const translatedText = performMockTranslation(text, sourceLang, targetLang);
    res.json({
      originalText: text,
      translatedText,
      sourceLang,
      targetLang,
      engine: apiKey ? 'Real AI (Simulated with Key)' : 'Local AI Engine'
    });
  } catch (error) {
    res.status(500).json({ error: 'Translation failed: ' + error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Translator running on port ${PORT}`);
});