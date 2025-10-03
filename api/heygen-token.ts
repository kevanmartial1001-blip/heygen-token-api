// Vercel serverless function: /api/heygen-token
// Returns a short-lived HeyGen streaming token with strict CORS.

export default async function handler(req: any, res: any) {
  // Allow only your Shopify domain (add your custom domain later if you get one)
  const origin = req.headers.origin || '';
  const ALLOWED = new Set([
    'https://97hsgp-a4.myshopify.com'
  ]);

  // Basic CORS
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
    // Call HeyGen to mint a short-lived token (server-side key!)
    const r = await fetch('https://api.heygen.com/v1/streaming/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HEYGEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // pass options if HeyGen supports any for your plan
    });

    const text = await r.text();
    if (!r.ok) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      return res.status(r.status).json({ error: 'heygen_error', detail: text });
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text); // { token: "...", expires_in: ... }
  } catch (e: any) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    return res.status(500).json({ error: 'server_error', detail: String(e) });
  }
}
