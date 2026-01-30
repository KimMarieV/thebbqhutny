import { NextResponse } from "next/server";
import crypto from "crypto";

function apiBase() {
  const env = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
}

export async function POST(req: Request) {
  try {
    const token = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!token || !locationId) {
      return NextResponse.json({ ok: false, error: "Square not configured." }, { status: 400 });
    }

    const { sourceId, amountCents, buyerEmail } = await req.json();
    if (!sourceId || !Number.isInteger(amountCents) || amountCents <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid payment request." }, { status: 400 });
    }

    const res = await fetch(`${apiBase()}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        source_id: sourceId,
        amount_money: { amount: amountCents, currency: "USD" },
        location_id: locationId,
        buyer_email_address: buyerEmail || undefined,
        autocomplete: true
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data?.errors || data }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      paymentId: data?.payment?.id,
      receiptUrl: data?.payment?.receipt_url,
      status: data?.payment?.status
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
