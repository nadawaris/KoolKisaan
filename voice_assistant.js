/**
 * KoolKisaan Voice AI & Multilingual Speech Engine
 * Supports Web Speech Recognition (STT) and Speech Synthesis (TTS)
 * Supports Hindi, Punjabi, Marathi, Telugu, Bengali, Gujarati, and Indian English.
 */

class VoiceEngine {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis || null;
        this.isListening = false;
        this.selectedLanguage = 'hi-IN'; // Default to Hindi
        this.onResultCallback = null;
        this.onStateChangeCallback = null;
        this.audioContext = null;
        this.analyser = null;
        this.animFrameId = null;

        this.languageConfig = {
            'hi-IN': { name: 'Hindi (हिंदी)', voiceLang: 'hi-IN', defaultPlaceholder: 'बोलिए, हम आपकी कृषि समस्या सुन रहे हैं...' },
            'en-IN': { name: 'English (Indian)', voiceLang: 'en-IN', defaultPlaceholder: 'Speak now, asking your farming question...' },
            'pa-IN': { name: 'Punjabi (ਪੰਜਾਬੀ)', voiceLang: 'pa-IN', defaultPlaceholder: 'ਬੋਲੋ ਜੀ, ਆਪਣੀ ਖੇਤੀ ਦੀ ਸਮੱਸਿਆ ਦੱਸੋ...' },
            'mr-IN': { name: 'Marathi (मराठी)', voiceLang: 'mr-IN', defaultPlaceholder: 'बोला, तुमची शेतीची समस्या विचारा...' },
            'te-IN': { name: 'Telugu (తెలుగు)', voiceLang: 'te-IN', defaultPlaceholder: 'మాట్లాడండి, మీ వ్యవసాయ ప్రశ్న అడగండి...' },
            'bn-IN': { name: 'Bengali (বাংলা)', voiceLang: 'bn-IN', defaultPlaceholder: 'বলুন, আপনার কৃষির সমস্যা জানান...' },
            'gu-IN': { name: 'Gujarati (ગુજરાતી)', voiceLang: 'gu-IN', defaultPlaceholder: 'બોલો, તમારી ખેતીની સમસ્યા જણાવો...' }
        };

        this.initRecognition();
    }

    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = this.selectedLanguage;

            this.recognition.onstart = () => {
                this.isListening = true;
                if (this.onStateChangeCallback) this.onStateChangeCallback(true);
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                const transcript = finalTranscript || interimTranscript;
                if (this.onResultCallback && transcript) {
                    this.onResultCallback(transcript, Boolean(finalTranscript));
                }
            };

            this.recognition.onerror = (event) => {
                console.warn('Speech recognition warning/error:', event.error);
                this.stopListening();
            };

            this.recognition.onend = () => {
                this.stopListening();
            };
        } else {
            console.warn('Web Speech API is not supported in this browser. Fallback input will be used.');
        }
    }

    setLanguage(langCode) {
        if (this.languageConfig[langCode]) {
            this.selectedLanguage = langCode;
            if (this.recognition) {
                this.recognition.lang = langCode;
            }
        }
    }

    startListening(onResult, onStateChange) {
        if (!this.recognition) {
            alert('Voice input is not supported on this browser. Please type your query in the search box.');
            return false;
        }

        this.onResultCallback = onResult;
        this.onStateChangeCallback = onStateChange;

        try {
            if (this.isListening) {
                this.recognition.stop();
            }
            this.recognition.lang = this.selectedLanguage;
            this.recognition.start();
            return true;
        } catch (e) {
            console.error('Error starting speech recognition:', e);
            return false;
        }
    }

    stopListening() {
        this.isListening = false;
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback(false);
        }
    }

    speak(text, onEnd) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Cancel existing audio
        this.synthesis.cancel();

        // Clean markdown or technical characters for pleasant speech
        const cleanText = text
            .replace(/[#*_`]/g, '')
            .replace(/\b₹\b/g, 'Rupees ')
            .replace(/°C/g, ' degree Celsius ')
            .replace(/%/g, ' percent ')
            .replace(/\n+/g, '. ');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = this.selectedLanguage;
        utterance.rate = 0.95; // Slightly slower for clarity
        utterance.pitch = 1.0;

        // Try to select the most natural sounding voice for the language
        const voices = this.synthesis.getVoices();
        const matchedVoice = voices.find(v => v.lang.startsWith(this.selectedLanguage.split('-')[0]) || v.lang === this.selectedLanguage);
        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }

        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
        }

        this.synthesis.speak(utterance);
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }
}

// Global instance
window.agriVoice = new VoiceEngine();
