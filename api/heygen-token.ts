// /api/heygen-token.js (Vercel)
// Make sure HEYGEN_API_KEY is set in Vercel → Project → Settings → Environment Variables
// Also set ALLOWED_ORIGINS to a comma-separated list of your domains:
//   https://97hsgp-a4.myshopify.com,https://<your-custom-domain>,https://<your-preview-domain>.myshopify.com

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  // Check origin
  if (!allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", ""); // block
    return res.status(403).json({ error: "forbidden_origin", origin });
  }

  try {
    const key = process.env.HEYGEN_API_KEY;
    if (!key) return res.status(500).json({ error: "missing_api_key" });

    // Ask HeyGen for a streaming token
    const r = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({}) // no body needed today
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    return res.status(200).json({ token: data?.data?.token || data?.token });
  } catch (e) {
    return res.status(500).json({ error: "token_failed", detail: String(e) });
  }
}
