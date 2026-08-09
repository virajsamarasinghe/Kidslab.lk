import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";
import Payment from "@/models/Payment";

/**
 * Lets the return page find out whether the webhook has confirmed an order.
 *
 * The success page can't tell the customer they've paid just because PayHere
 * redirected them there — the redirect happens before, and independently of,
 * the notification. So it polls this until the status settles.
 *
 * Deliberately anonymous but minimal: an order id is unguessable, and the
 * response carries no payer details, only what the page has to render.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const limited = await enforceRateLimit("payment-status", clientIp(req), 120, 60 * 10);
  if (limited) return limited;

  await connectDB();
  const { orderId } = await params;

  const payment = await Payment.findOne({ orderId })
    .select("orderId status itemName amount currency createdAt")
    .lean();

  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(
    {
      orderId: payment.orderId,
      status: payment.status,
      itemName: payment.itemName,
      amount: payment.amount,
      currency: payment.currency,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
