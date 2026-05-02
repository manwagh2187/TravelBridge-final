import { cancelBooking } from '../../../../lib/tbo';
import jwt from 'jsonwebtoken';

function getAuth(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace('Bearer ', '');
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev');
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = getAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await cancelBooking(req.query.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Cancellation failed' });
  }
}