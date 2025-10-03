// Vercel serverless function: /api/heygen-token
// Retourne un jeton HeyGen "streaming" (courte durée) avec CORS strict.

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin || '';
  const ALLOWED = new Set<string>([
    'https://97hsgp-a4.myshopify.com',   // ta boutique Shopify
    'https://heygen-token-api.vercel.app' // utile pour tests directs si besoin
  ]);

  // Préflight CORS
  if (req.method === 'OPTIONS') {
    if (!ALLOWED.has(origin)) return res.status(403).end();
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (!ALLOWED.has(origin)) {
    return res.status(403).json({ error: 'forbidden_origin', origin });
  }

  try {
    const r = await fetch('https://api.heygen.com/v1/streaming/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HEYGEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // options éventuelles selon ton plan HeyGen
    });

    const text = await r.text();
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Content-Type', 'application/json');

    if (!r.ok) {
      return res.status(r.status).json({ error: 'heygen_error', detail: text });
    }
    return res.status(200).send(text); // { token: "...", expires_in: ... }
  } catch (e: any) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    return res.status(500).json({ error: 'server_error', detail: String(e) });
  }
}
