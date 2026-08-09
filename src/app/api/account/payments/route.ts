import { NextResponse } from "next/server";
import { getAccountUser } from "@/lib/account";
import Payment from "@/models/Payment";

/**
 * The signed-in visitor's order history.
 *
 * Scoped by `userId` taken from the session — there is deliberately no way to
 * ask for someone else's, and the selection omits `rawNotification`, which
 * holds the card holder name and masked card number PayHere sends back.
 */
export async function GET() {
  const account = await getAccountUser();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const payments = await Payment.find({ userId: account._id })
    .select("orderId itemName amount currency status method paymentId createdAt")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json(
    {
      payments: payments.map((p) => ({
        orderId: p.orderId,
        itemName: p.itemName,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        method: p.method ?? "",
        paymentId: p.paymentId ?? "",
        createdAt: p.createdAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
