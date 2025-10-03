// /api/heygen-token.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = (req.headers.origin || '').toString();

  // CORS preflight
  if (req.method === 'OPTIONS') {
    if (ALLOWED.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (!ALLOWED.includes(origin)) {
    res.setHeader('Vary', 'Origin');
    return res.status(403).json({ error: 'forbidden_origin', origin });
  }

  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // Create a short-lived token with your HeyGen API key
    const r = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.HEYGEN_API_KEY || ''
      },
      body: JSON.stringify({}) // Body is currently empty for token creation
    });

    const data = await r.json();
    if (!r.ok) {
      throw new Error(data?.message || 'Token fetch failed');
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    return res.status(200).json({ token: data.data?.token || data.token });
  } catch (e:any) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    return res.status(500).json({ error: 'server_error', message: e?.message });
  }
}
