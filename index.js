import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    if (!isValidRequest) {
      return new Response('Bad request signature', { status: 401 });
    }

    const interaction = JSON.parse(body);

    if (interaction.type === InteractionType.PING) {
      return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
        headers: { 'content-type': 'application/json' },
      });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data.name === 'ask') {
      const prompt = interaction.data.options[0].value;
      const userId = interaction.member?.user?.id || interaction.user?.id;
      const historyKey = `history:${userId}`;

      ctx.waitUntil((async () => {
        const historyRaw = await env.KV_ORACULUM.get(historyKey);
        let messages = historyRaw ? JSON.parse(historyRaw) : [
          { role: 'system', content: 'Sei OraculumAI.' }
        ];
        messages.push({ role: 'user', content: prompt });

        const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });
        const reply = aiResponse.response;

        messages.push({ role: 'assistant', content: reply });
        await env.KV_ORACULUM.put(historyKey, JSON.stringify(messages.slice(-10)), { expirationTtl: 3600 });

        const endpoint = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}/messages/@original`;
        await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `**Domanda:** ${prompt}\n\n${reply}`.substring(0, 2000) }),
        });
      })());

      return new Response(JSON.stringify({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      }), { headers: { 'content-type': 'application/json' } });
    }

    return new Response('Unknown interaction', { status: 400 });
  },
};