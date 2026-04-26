# OraculumAI 🔮

OraculumAI è un bot Discord avanzato che integra l'intelligenza artificiale di **Cloudflare Workers AI** (utilizzando il modello Llama 3) per interagire con gli utenti. Programmato da **lexproj** con il supporto di **metaAI**, l'Oracolo risponde con una personalità saggia, umana e un pizzico di ironia.

## 🚀 Caratteristiche
- **Integrazione Cloudflare AI**: Utilizza `@cf/meta/llama-3-8b-instruct` per risposte rapide e intelligenti.
- **Comandi Slash**: Supporto per il comando `/ask` per interrogazioni dirette.
- **Interazione Naturale**: Risponde automaticamente quando viene menzionato nei canali testuali.
- **Personalità Unica**: Risposte concise, ironiche e in lingua italiana.

## 🛠️ Requisiti
- Node.js >= 20.18.1
- Un account Cloudflare con API Token e Account ID.
- Un'applicazione Discord registrata sul portale Developer.

## 📦 Installazione

1. Clona il repository e installa le dipendenze:
   ```bash
   npm install
   ```

2. Configura le variabili d'ambiente creando un file `.env` nella root del progetto:
   ```env
   DISCORD_TOKEN=il_tuo_token
   DISCORD_APPLICATION_ID=id_applicazione
   DISCORD_GUILD_ID=id_server (opzionale per registrazione rapida)
   CLOUDFLARE_ACCOUNT_ID=tuo_id_account
   CLOUDFLARE_API_TOKEN=tuo_api_token
   ```

3. Registra i comandi slash:
   ```bash
   npm run register
   ```

4. Avvia il bot:
   ```bash
   npm start
   ```

## ✒️ Autore
Sviluppato da **lexproj**.