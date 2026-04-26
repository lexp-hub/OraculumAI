import { Client, GatewayIntentBits, Events } from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const { DISCORD_TOKEN, DISCORD_APPLICATION_ID, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;

if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID || !CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('❌ Errore: Configurazione incompleta nel file .env. Verifica TOKEN, APP_ID e chiavi Cloudflare.');
  process.exit(1);
}

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Oracolo Online! Autenticato come ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  const mentionRegex = new RegExp(`<@!?${client.user.id}>`, 'g');
  const prompt = message.content.replace(mentionRegex, '').trim();

  if (!prompt) {
    return message.reply("Dimmi pure, come posso aiutarti?");
  }

  await message.channel.sendTyping();

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Sei OraculumAI, un assistente utile e saggio. Rispondi in modo conciso in italiano.' },
            { role: 'user', content: prompt }
          ]
        }),
      }
    );

    if (!response.ok) throw new Error(`Cloudflare API Error: ${response.statusText}`);

    const result = await response.json();
    const reply = result?.result?.response;

    if (!reply) throw new Error("Risposta vuota dall'IA");

    let content = `<@${message.author.id}>, ${reply}`;
    if (content.length > 2000) content = content.substring(0, 1997) + '...';

    await message.reply(content);
  } catch (err) {
    console.error('❌ Errore:', err);
    await message.reply("Scusa, l'Oracolo è stanco. Riprova più tardi.");
  }
});

client.login(DISCORD_TOKEN);