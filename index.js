import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();
    
    // Verifica che la richiesta provenga effettivamente da Discord
    const isValidRequest = verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    if (!isValidRequest) {
      return new Response('Bad request signature', { status: 401 });
    }

    const interaction = JSON.parse(body);

    // Gestione del PING per la validazione dell'URL di Discord
    if (interaction.type === InteractionType.PING) {
      return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    // Gestione del comando Slash /ask
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      if (interaction.data.name === 'ask') {
        const prompt = interaction.data.options[0].value;

        try {
          const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages: [
              { role: 'system', content: 'Sei OraculumAI, un assistente AI utile integrato in un server Discord.' },
              { role: 'user', content: prompt }
            ],
          });

          return new Response(
            JSON.stringify({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `> **${prompt}**\n\n${response.response}`,
              },
            }),
            { headers: { 'content-type': 'application/json' } }
          );
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
      }
    }

    return new Response('Unknown interaction', { status: 400 });
  },
};