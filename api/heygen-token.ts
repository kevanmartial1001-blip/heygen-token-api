// /api/heygen-token  — Vercel serverless
export default async function handler(req: any, res: any) {
  // 1) Déterminer l’origine : Origin header OU Referer (fallback)
  const rawOrigin = req.headers.origin || '';
  let origin = rawOrigin;
  if (!origin && req.headers.referer) {
    try { origin = new URL(req.headers.referer).origin; } catch {}
  }

  // 2) Domaines autorisés
  const ALLOWED = new Set<string>([
    'https://97hsgp-a4.myshopify.com',     // ta boutique Shopify
    'https://heygen-token-api.vercel.app'  // utile pour certains tests
    // ajoute ici ton domaine custom si tu en as un plus tard
  ]);

  // 3) Préflight CORS
  if (req.method === 'OPTIONS') {
    if (!origin || !ALLOWED.has(origin)) return res.status(403).end();
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  // 4) Vérif CORS (on accepte aussi le cas où Origin est vide MAIS referer match)
  if (!origin || !ALLOWED.has(origin)) {
    return res.status(403).json({ error: 'forbidden_origin', origin });
  }

  try {
    // 5) Appel HeyGen (clé côté serveur uniquement)
    const r = await fetch('https://api.heygen.com/v1/streaming/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HEYGEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
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
