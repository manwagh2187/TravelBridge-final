import { buffer } from 'micro';
import Stripe from 'stripe';
import prisma from '../../../lib/prisma';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      try {
        await prisma.booking.update({
          where: { id: Number(bookingId) },
          data: {
            status: 'confirmed',
            paymentId: session.payment_intent || null,
          }
        });
      } catch (err) {
        console.error('Failed to update booking', err);
      }
    }
  }

  res.json({ received: true });
}