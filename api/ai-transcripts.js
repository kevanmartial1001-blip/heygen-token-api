// /api/ai-transcripts.js  (Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Payload from theme
  const { session_id, transcript, page, meta = {} } = req.body || {};
  if (!transcript) return res.status(400).json({ ok:false, error:'missing transcript' });

  // You will get the shop domain from the proxy headers or query.
  // In Vercel behind App Proxy, Shopify forwards:
  // x-shopify-shop-domain: your-shop.myshopify.com
  const shop = req.headers['x-shopify-shop-domain'];
  if (!shop) return res.status(400).json({ ok:false, error:'missing shop header' });

  // Admin API token from your private app or custom app
  const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN; // set in Vercel env

  // Build GraphQL mutation
  const mutation = `
    mutation CreateTranscript($type: String!, $fields: [MetaobjectFieldInput!]!) {
      metaobjectCreate(type: $type, fields: $fields) {
        metaobject { id handle }
        userErrors { field message }
      }
    }
  `;

  // Map fields to your definition keys
  const fields = [
    { key: "session_id", value: String(session_id || "") },
    { key: "page", value: String(page || "") },
    { key: "transcript", value: String(transcript) },
    { key: "source", value: String(meta.reason || "alex") },
    { key: "created_at", value: new Date().toISOString() },
    // Optional extras:
    ...(meta.email ? [{ key:"email", value: meta.email }] : []),
    ...(meta.company ? [{ key:"company", value: meta.company }] : []),
    ...(meta.website ? [{ key:"website", value: meta.website }] : []),
    ...(Object.keys(meta).length ? [{ key:"extra_json", value: JSON.stringify(meta) }] : [])
  ];

  try {
    const r = await fetch(`https://${shop}/admin/api/2024-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'X-Shopify-Access-Token': ADMIN_TOKEN
      },
      body: JSON.stringify({ query: mutation, variables: { type: "transcripts", fields } })
    });
    const j = await r.json();
    if (j?.data?.metaobjectCreate?.userErrors?.length) {
      return res.status(400).json({ ok:false, errors: j.data.metaobjectCreate.userErrors });
    }
    return res.status(200).json({ ok:true, id: j?.data?.metaobjectCreate?.metaobject?.id });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
}
