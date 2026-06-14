/**
 * Cloudflare Worker — Proxy CR Stats
 *
 * Déploiement :
 * 1. Va sur https://dash.cloudflare.com/ > Workers & Pages > Create
 * 2. Colle ce code dans l'éditeur
 * 3. Settings > Variables > ajoute CR_API_KEY = ta clé (secret)
 * 4. Copie l'URL du Worker (ex: cr-proxy.tonnom.workers.dev)
 * 5. Dans app.js, remplace WORKER_URL par cette URL
 * 6. Sur developer.clashroyale.com, crée une clé avec l'IP du Worker
 *    (lance une requête, lis l'erreur pour avoir l'IP, ajoute-la une seule fois)
 */

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    if (!path) {
      return new Response(JSON.stringify({ message: 'Missing ?path=' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const crUrl = 'https://api.clashroyale.com/v1' + path;
    const resp = await fetch(crUrl, {
      headers: { 'Authorization': 'Bearer ' + env.CR_API_KEY },
    });

    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
