export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // TODO: verify webhook signature if TBO provides one
    // TODO: update booking/payment/voucher records

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Webhook handling failed' });
  }
}