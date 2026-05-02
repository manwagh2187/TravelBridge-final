export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: verify webhook signature if TBO provides one
    // TODO: update local booking/payment/voucher records here

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Webhook handling failed' });
  }
}