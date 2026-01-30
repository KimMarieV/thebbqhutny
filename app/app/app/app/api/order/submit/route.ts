import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

function buildPlainTextTicket(order: any) {
  const lines = (order.lines || [])
    .map((l: any) => `${l.qty} x ${l.name} – $${l.unitPrice.toFixed(2)}  (Line: $${l.lineTotal.toFixed(2)})`)
    .join("\n");

  const isPreorder = order.eventDate !== new Date().toISOString().slice(0, 10);
  const preorderFlag = isPreorder ? "\n*** PRE-ORDER – DO NOT PREP TODAY ***\n" : "";

  const payLine =
    order.paymentStatus === "paid"
      ? `PAYMENT STATUS: PAID ONLINE${isPreorder ? " (PRE-ORDER)" : " (SAME DAY)"}`
      : "PAYMENT STATUS: PAY AT PICKUP (SAME DAY)";

  return [
    "NEW BBQ ORDER",
    preorderFlag.trimEnd(),
    `EVENT DATE: ${order.eventDate}`,
    `PICKUP TIME: ${order.pickupTime}`,
    "",
    `Customer Name: ${order.customerName}`,
    `Phone: ${order.phone}`,
    order.customerEmail ? `Customer Email: ${order.customerEmail}` : "",
    "",
    "ORDER:",
    lines,
    "",
    `SUBTOTAL: $${Number(order.subtotal || 0).toFixed(2)}`,
    payLine,
    order.square?.receiptUrl ? `Receipt: ${order.square.receiptUrl}` : "",
    "",
    "NOTES:",
    order.notes?.trim() ? order.notes.trim() : "(none)",
    "",
    "—",
    `Received: ${new Date().toISOString()}`
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const order = await req.json();

    if (!order?.customerName || !order?.phone || !order?.eventDate || !order?.pickupTime) {
      return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }
    if (!Array.isArray(order.lines) || order.lines.length === 0) {
      return NextResponse.json({ ok: false, error: "Cart is empty." }, { status: 400 });
    }

    const to = process.env.ORDER_TO_EMAIL || "thebbqhut@upwardmail.com";
    const ticket = buildPlainTextTicket(order);

    // If SMTP not configured, log in Vercel function logs (preview mode)
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      console.log("\n=== ORDER (SMTP not configured) ===\n" + ticket + "\n===============================\n");
      return NextResponse.json({ ok: true, detail: "Preview mode: SMTP not set. Order logged to server console." });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || "orders@example.com",
      to,
      subject: `NEW BBQ ORDER – ${order.eventDate} ${order.pickupTime}`,
      text: ticket // plain text for email-to-fax
    });

    return NextResponse.json({ ok: true, detail: "Order email sent." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
