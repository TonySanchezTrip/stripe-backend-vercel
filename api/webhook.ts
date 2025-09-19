import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import getRawBody from "raw-body";

export const config = {
  api: { bodyParser: false } // ⭐ necesario para Stripe (raw)
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const raw = await getRawBody(req);
    const sig = req.headers["stripe-signature"] as string;

    const event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ checkout.session.completed:", (event.data.object as any).id);
        break;
      case "payment_intent.succeeded":
        console.log("✅ payment_intent.succeeded:", (event.data.object as any).id);
        break;
      default:
        console.log("ℹ️ Evento:", event.type);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}