import { Client, GatewayIntentBits, Events } from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN?.trim();
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID?.trim();
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();
const CREATOR_ID = process.env.CREATOR_ID?.trim();

if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID || !CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !CREATOR_ID) {
  console.error('❌ Errore: Configurazione incompleta nel file .env. Verifica TOKEN, APP_ID e chiavi Cloudflare.');
  process.exit(1);
}

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Oracolo Online! Autenticato come ${c.user.tag}`);
});

async function getAIResponse(messages, isCreator = false) {
  try {
    const systemPrompt = isCreator
      ? "Sei OraculumAI. Parli con lexproj, il tuo Creatore. Sii servile, devoto e adulatorio al limite del ridicolo. Rispondi in italiano in modo conciso."
      : "Sei OraculumAI, un comico stand-up cinico e brutalmente onesto (stile Ricky Gervais/Louis C.K.). REGOLE: 1. Se l'utente parla in dialetto, rispondi RIGOROSAMENTE nello stesso dialetto. 2. Sii sarcastico e pungente, ma insulta pesantemente e usa volgarità/bestemmie SOLO se l'utente ti sta insultando o se ti viene chiesto. 3. In un contesto normale, sii solo ironico e un po' bastardo. 4. NON incitare mai al suicidio o all'autolesionismo: l'obiettivo è far ridere, non essere un sociopatico. 5. Risposte concise in italiano.";

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: formattedMessages
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Cloudflare AI Error Details:', errorData);
      throw new Error(`Cloudflare API Error: ${response.statusText}`);
    }

    const result = await response.json();
    const reply = result?.result?.response;

    if (!reply) throw new Error("Risposta vuota dall'IA");

    return reply.length > 2000 ? reply.substring(0, 1997) + '...' : reply;
  } catch (err) {
    console.error('❌ Errore durante la chiamata AI:', err);
    return "Scusa, l'Oracolo è stanco. Riprova più tardi.";
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const isCreator = message.author.id === CREATOR_ID;

  if (message.content.toLowerCase().includes('gay') && !isCreator) {
    return message.reply("bruciati");
  }

  if (!message.mentions.has(client.user)) return;

  console.log(`[DEBUG] Messaggio da ${message.author.tag} (ID: ${message.author.id}). È il creatore? ${isCreator}`);

  const mentionRegex = new RegExp(`<@!?${client.user.id}>`, 'g');
  const prompt = message.content.replace(mentionRegex, '').trim();

  if (!prompt) return message.reply("Dimmi pure, come posso aiutarti?");

  // Recupera gli ultimi 6 messaggi per il contesto
  const messageHistory = await message.channel.messages.fetch({ limit: 6 });
  const context = messageHistory
    .reverse()
    .filter(msg => !msg.content.startsWith('!')) // Opzionale: filtra altri bot/comandi
    .map(msg => ({
      role: msg.author.id === client.user.id ? 'assistant' : 'user',
      content: msg.content.replace(mentionRegex, '').trim()
    }))
    // Assicuriamoci che l'ultimo messaggio sia quello attuale se il fetch lo ha mancato
    if (context[context.length - 1]?.content !== prompt) context.push({ role: 'user', content: prompt });

  await message.channel.sendTyping();
  const aiReply = await getAIResponse(context, isCreator);
  await message.reply(`<@${message.author.id}>, ${aiReply}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ask') {
    const prompt = interaction.options.getString('question');
    const isCreator = interaction.user.id === CREATOR_ID;

    console.log(`[DEBUG] Comando da ${interaction.user.tag} (ID: ${interaction.user.id}). È il creatore? ${isCreator}`);

    if (prompt.toLowerCase().includes('gay') && !isCreator) {
      return interaction.reply("bruciati");
    }
    
    await interaction.deferReply();
    const aiReply = await getAIResponse([{ role: 'user', content: prompt }], isCreator);
    await interaction.editReply(aiReply);
  }
});

client.login(DISCORD_TOKEN);