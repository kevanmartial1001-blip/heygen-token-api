// /api/ai-transcripts.js  (Vercel Serverless Function)
export default async function handler(req, res) {
  // ---- CORS ----
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

  try{
    const { session_id, transcript, page, meta = {} } = req.body || {};
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ ok:false, error:'missing transcript' });
    }

    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
    if (!shop || !token) {
      return res.status(500).json({ ok:false, error:'server not configured' });
    }

    const mutation = `
      mutation CreateTranscript($type: String!, $fields: [MetaobjectFieldInput!]!) {
        metaobjectCreate(type: $type, fields: $fields) {
          metaobject { id handle }
          userErrors { field message }
        }
      }
    `;

    // Adjust keys to match your metaobject definition
    const fields = [
      { key: "session_id", value: String(session_id || "") },
      { key: "page",       value: String(page || "") },
      { key: "transcript", value: String(transcript) },
      { key: "source",     value: String(meta.reason || "alex") },
      { key: "created_at", value: new Date().toISOString() },
    ];
    if (meta.email)   fields.push({ key: "email",   value: String(meta.email) });
    if (meta.company) fields.push({ key: "company", value: String(meta.company) });
    if (meta.website) fields.push({ key: "website", value: String(meta.website) });
    if (Object.keys(meta).length) fields.push({ key:"extra_json", value: JSON.stringify(meta) });

    const r = await fetch(`https://${shop}/admin/api/2024-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({ query: mutation, variables: { type: "transcripts", fields } })
    });
    const j = await r.json();

    const errs = j?.data?.metaobjectCreate?.userErrors || [];
    if (errs.length) {
      return res.status(400).json({ ok:false, errors: errs });
    }
    return res.status(200).json({ ok:true, id: j?.data?.metaobjectCreate?.metaobject?.id });
  }catch(e){
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
