// Loaded only by Playwright's server through NODE_OPTIONS; never imported by the app.
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input, init) {
  const url = input instanceof Request ? input.url : String(input);
  if (url === 'https://openrouter.ai/api/v1/chat/completions') {
    const request = new Request(input, init);
    if (request.headers.get('authorization') !== 'Bearer test-openrouter-key') {
      return Response.json({ error: { message: 'Invalid test key' } }, { status: 401 });
    }
    const body = await request.json();
    if (request.method !== 'POST' || body.model !== 'openrouter/free' || body.max_tokens !== 900 || !body.messages?.[0]?.content) {
      return Response.json({ error: { message: 'Invalid test payload' } }, { status: 400 });
    }
    return Response.json({ choices: [{ message: {
      content: 'VEREDITO: SUSPEITO\n\nPOR QUE:\n- Resposta simulada em modo de teste, sem chamada externa.\n\nO QUE FAZER AGORA:\n1. Não clique nos links.\n2. Confirme por um canal oficial.\n3. Peça ajuda antes de responder.',
    } }] });
  }
  if (url.startsWith('https://openrouter.ai/')) throw new Error('Unexpected OpenRouter URL in tests');
  return originalFetch(input, init);
};
