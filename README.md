# OraculumAI 🔮

OraculumAI è un bot Discord avanzato che integra l'intelligenza artificiale di **Cloudflare Workers AI** (utilizzando il modello Llama 3) per interagire con gli utenti. Programmato da **lexproj** con il supporto di **metaAI**, l'Oracolo risponde con una personalità saggia, umana e un pizzico di ironia.

## 🚀 Caratteristiche
- **Integrazione Cloudflare AI**: Utilizza `@cf/meta/llama-3-8b-instruct` per risposte rapide e intelligenti.
- **Comandi Slash**: Supporto per il comando `/ask` per interrogazioni dirette.
- **Modalità Vocale (STT/TTS)**: L'Oracolo può entrare nei canali vocali, ascoltare gli utenti (tramite Vosk locale per la privacy) e rispondere a voce (tramite Google TTS).
- **Interazione Naturale**: Risponde automaticamente quando viene menzionato nei canali testuali.
- **Personalità Unica**: Risposte concise, ironiche e in lingua italiana.

## ✒️ Autore
Sviluppato da **lexproj**.

## 🛠️ Requisiti Vocali
Per abilitare le funzioni vocali, scaricare il modello Vosk italiano e inserirlo nella cartella `./model`.
```bash
wget https://alphacephei.com/vosk/models/vosk-model-small-it-0.22.zip
unzip vosk-model-small-it-0.22.zip && mv vosk-model-small-it-0.22 model
```