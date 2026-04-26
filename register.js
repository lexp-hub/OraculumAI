const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

if (!token || !applicationId) {
  console.error('Errore: DISCORD_TOKEN e DISCORD_APPLICATION_ID sono richiesti.');
  process.exit(1);
}

async function registerCommands() {
  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;
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
  console.log('Risposta registrazione:', data);
}

registerCommands();