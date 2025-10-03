export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  // IMPORTANT: only allow from whitelisted origins
  if (!allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", "");
    return res.status(403).json({ error: "forbidden_origin", origin });
  }

  try {
    const key = process.env.HEYGEN_API_KEY;
    if (!key) return res.status(500).json({ error: "missing_api_key" });

    const r = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({})
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
