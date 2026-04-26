import Stripe from 'stripe';
import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

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
  if (req.method !== 'POST') return res.status(405).end();

  const auth = getAuth(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: 'Missing bookingId' });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: { include: { listing: true } }, user: true }
  });

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.userId !== auth.userId) return res.status(403).json({ error: 'Forbidden' });

  const successUrl = process.env.STRIPE_SUCCESS_URL || `${process.env.APP_URL || 'http://localhost:3000'}/booking/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL || `${process.env.APP_URL || 'http://localhost:3000'}/booking/cancel`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: (process.env.CURRENCY || 'usd').toLowerCase(),
          product_data: {
            name: `${booking.room.title} at ${booking.room.listing.title}`,
          },
          unit_amount: booking.totalAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { bookingId: String(booking.id) },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe error' });
  }
}