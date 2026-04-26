import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !applicationId) {
  console.error('❌ Errore: Variabili di configurazione mancanti.');
  if (!token) {
    console.error('   -> DISCORD_TOKEN non è presente nel file .env');
  }
  if (!applicationId) {
    console.error('   -> DISCORD_APPLICATION_ID non è presente nel file .env');
  }
  console.log('\nAssicurati che il file .env esista nella radice del progetto e contenga i valori corretti.');
  process.exit(1);
}

async function registerCommands() {
  const url = guildId 
    ? `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${applicationId}/commands`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'ask',
      description: 'Fai una domanda a OraculumAI',
      options: [
        { name: 'question', description: 'La tua domanda', type: 3, required: true }
      ],
    }),
  });

  const data = await response.json();
  if (response.ok) {
    console.log('✅ Comando registrato con successo!');
  } else {
    console.error('❌ Errore durante la registrazione:');
    console.error(JSON.stringify(data, null, 2));
  }
}

registerCommands();