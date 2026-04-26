import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY || !env.DISCORD_APPLICATION_ID) {
      console.error('Configurazione mancante: assicurati che DISCORD_PUBLIC_KEY e DISCORD_APPLICATION_ID siano impostati.');
      return new Response('Unauthorized', { status: 401 });
    }

    const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    if (!isValidRequest) {
      console.error('Verifica della firma fallita. Assicurati che la Public Key nel portale Discord coincida con il segreto.');
      return new Response('Bad request signature', { status: 401 });
    }

    const interaction = JSON.parse(body);

    if (interaction.type === InteractionType.PING) {
      return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      if (interaction.data.name === 'ask') {
        const prompt = interaction.data.options[0].value;
        const userId = interaction.member?.user?.id || interaction.user?.id;
        const endpoint = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}/messages/@original`;

        if (!env.AI || !env.KV_ORACULUM) {
          return new Response(JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: 'Errore: I servizi AI o KV non sono stati configurati correttamente nel Worker.' },
          }), { headers: { 'content-type': 'application/json' } });
        }

        ctx.waitUntil((async () => {
          try {
            const historyKey = `history:${userId}`;
            const historyRaw = await env.KV_ORACULUM.get(historyKey);
            let messages = historyRaw ? JSON.parse(historyRaw) : [
              { role: 'system', content: 'Sei OraculumAI, un assistente utile. Sii conciso e amichevole.' }
            ];

            messages.push({ role: 'user', content: prompt });
            if (messages.length > 10) messages.splice(1, 2);

            const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });
            const reply = aiResponse.response;

            messages.push({ role: 'assistant', content: reply });
            await env.KV_ORACULUM.put(historyKey, JSON.stringify(messages), { expirationTtl: 3600 });

            await fetch(endpoint, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `> **${prompt}**\n\n${reply}`,
              }),
            });
          } catch (e) {
            console.error(e);
            await fetch(endpoint, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: `Errore durante la generazione: ${e.message}` }),
            });
          }
        })());

        return new Response(JSON.stringify({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        }), { headers: { 'content-type': 'application/json' } });
      }
    }

    return new Response('Unknown interaction', { status: 400 });
  },
};