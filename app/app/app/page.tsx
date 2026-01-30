"use client";

import React, { useEffect, useMemo, useState } from "react";

type MenuItem = { id: string; category: string; name: string; price: number; desc?: string };
type CartLine = { id: string; qty: number };

const MENU: MenuItem[] = [
  // Dinners (prices updated)
  { id: "dinner_half_chicken", category: "Dinners", name: "Half Chicken Dinner", price: 15.5, desc: "Includes baked potato, coleslaw, dinner roll, butter, whoopie pie, & a drink." },
  { id: "dinner_leg_thigh", category: "Dinners", name: "Leg & Thigh Dinner", price: 13.0, desc: "Includes baked potato, coleslaw, dinner roll, butter, whoopie pie, & a drink." },
  { id: "dinner_pulled_pork", category: "Dinners", name: "Pulled Pork Dinner", price: 16.5, desc: "Includes baked potato, coleslaw, dinner roll, butter, whoopie pie, & a drink." },
  { id: "dinner_rib", category: "Dinners", name: "Rib Dinner (Half Rack)", price: 18.75, desc: "Includes baked potato, coleslaw, dinner roll, butter, whoopie pie, & a drink." },
  { id: "dinner_brisket", category: "Dinners", name: "Brisket Dinner", price: 26.0, desc: "Includes baked potato, coleslaw, dinner roll, butter, whoopie pie, & a drink." },

  // Singles
  { id: "single_half_chicken", category: "Single Items", name: "Half Chicken", price: 9.5 },
  { id: "single_leg_thigh", category: "Single Items", name: "Leg & Thigh", price: 6.0 },
  { id: "single_pp_sand_combo", category: "Single Items", name: "Pulled Pork Sandwich (with chips & drink)", price: 11.0 },
  { id: "single_ribs_full", category: "Single Items", name: "Full Rack Ribs", price: 24.99 },
  { id: "single_ribs_half", category: "Single Items", name: "Half Rack Ribs", price: 13.0 },
  { id: "single_brisket_sand", category: "Single Items", name: "Brisket Sandwich (with coleslaw & sauce)", price: 16.0 },
  { id: "single_pp_sand", category: "Single Items", name: "Pulled Pork Sandwich", price: 8.0 },

  // Sides & extras
  { id: "side_pp_quart", category: "Sides & Extras", name: "Quart Pulled Pork", price: 18.0 },
  { id: "side_pp_pint", category: "Sides & Extras", name: "Pint Pulled Pork", price: 10.0 },
  { id: "side_coleslaw_quart", category: "Sides & Extras", name: "Quart Coleslaw", price: 9.99 },
  { id: "side_coleslaw_pint", category: "Sides & Extras", name: "Pint Coleslaw", price: 5.25 },
  { id: "side_beans_8oz", category: "Sides & Extras", name: "8 oz Smoked Beans", price: 4.25 },
  { id: "side_brisket_pint", category: "Sides & Extras", name: "Pint of Brisket", price: 24.5 },
  { id: "side_bbq_beans_pint", category: "Sides & Extras", name: "Pint Smoked BBQ Beans", price: 8.0 },
  { id: "side_bbq_beans_quart", category: "Sides & Extras", name: "Quart Smoked BBQ Beans", price: 14.75 },
  { id: "side_whoopie", category: "Sides & Extras", name: "Whoopie Pie", price: 2.0 },
  { id: "side_whoopie_6", category: "Sides & Extras", name: "6 Whoopie Pies", price: 10.0 },
  { id: "side_drink", category: "Sides & Extras", name: "Drink", price: 2.0 },
  { id: "side_sauce_pint", category: "Sides & Extras", name: "BBQ Sauce (1 Pint)", price: 12.0, desc: "Limited amounts per week." }
];

function dollars(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function isFutureISO(dateISO: string) {
  const t = new Date(todayISO() + "T00:00:00");
  const d = new Date(dateISO + "T00:00:00");
  return d.getTime() > t.getTime();
}

declare global {
  interface Window { Square?: any }
}

export default function Page() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [eventDate, setEventDate] = useState(todayISO());
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");

  const isFuture = useMemo(() => isFutureISO(eventDate), [eventDate]);

  const [payChoice, setPayChoice] = useState<"pickup" | "square">("pickup");
  const [squarePaid, setSquarePaid] = useState<{ paymentId: string; receiptUrl?: string } | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "error" | "ok"; message?: string }>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);

  // enforce rule when date changes
  useEffect(() => {
    if (isFuture) setPayChoice("square");
    else setPayChoice("pickup");
    setSquarePaid(null);
  }, [isFuture]);

  function add(id: string) {
    setCart(prev => {
      const found = prev.find(l => l.id === id);
      if (found) return prev.map(l => l.id === id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { id, qty: 1 }];
    });
  }
  function setQty(id: string, qty: number) {
    setCart(prev => qty <= 0 ? prev.filter(l => l.id !== id) : prev.map(l => l.id === id ? { ...l, qty } : l));
  }
  function remove(id: string) { setCart(prev => prev.filter(l => l.id !== id)); }
  function clear() { setCart([]); setSquarePaid(null); setStatus({ type: "idle" }); }

  const detailed = useMemo(() => {
    return cart.map(l => {
      const item = MENU.find(m => m.id === l.id)!;
      const lineTotal = item.price * l.qty;
      return { id: l.id, name: item.name, unitPrice: item.price, qty: l.qty, lineTotal };
    });
  }, [cart]);

  const subtotal = useMemo(() => detailed.reduce((s, l) => s + l.lineTotal, 0), [detailed]);
  const amountCents = useMemo(() => Math.round(subtotal * 100), [subtotal]);

  const byCategory = useMemo(() => {
    const m = new Map<string, MenuItem[]>();
    for (const item of MENU) {
      if (!m.has(item.category)) m.set(item.category, []);
      m.get(item.category)!.push(item);
    }
    return Array.from(m.entries());
  }, []);

  function validate(): string | null {
    if (!customerName.trim()) return "Please enter a name.";
    if (!phone.trim()) return "Please enter a phone number.";
    if (!eventDate) return "Please select a date.";
    if (!pickupTime.trim()) return "Please enter a pickup time (or time window).";
    if (detailed.length === 0) return "Your cart is empty.";
    if (isFuture && !squarePaid) return "Future/pre-orders require online payment.";
    if (payChoice === "square" && !squarePaid) return "If paying online, please complete payment first.";
    return null;
  }

  async function submitOrder() {
    const err = validate();
    if (err) { setStatus({ type: "error", message: err }); return; }

    setSubmitting(true);
    setStatus({ type: "idle" });

    const payload = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      eventDate,
      pickupTime: pickupTime.trim(),
      notes: notes.trim() || undefined,
      lines: detailed,
      subtotal,
      paymentMethod: (squarePaid ? "square" : "pay_at_pickup"),
      paymentStatus: (squarePaid ? "paid" : "unpaid"),
      square: squarePaid || undefined
    };

    const res = await fetch("/api/order/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) {
      setStatus({ type: "error", message: data.error || "Order failed." });
      setSubmitting(false);
      return;
    }

    setStatus({ type: "ok", message: data.detail || "Order submitted." });
    setSubmitting(false);
    setCart([]);
    setSquarePaid(null);
  }

  // ---- Square Pay (loads only if you choose square or it is required) ----
  const squareAppId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
  const squareLocationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";
  const squareConfigured = Boolean(squareAppId && squareLocationId);

  useEffect(() => {
    const wantSquare = (payChoice === "square") || isFuture;
    if (!wantSquare) return;

    // Load Square SDK once
    const existing = document.querySelector('script[src="https://sandbox.web.squarecdn.com/v1/square.js"]');
    if (existing) return;

    const s = document.createElement("script");
    s.src = "https://sandbox.web.squarecdn.com/v1/square.js";
    s.async = true;
    document.body.appendChild(s);
  }, [payChoice, isFuture]);

  async function squarePay() {
    try {
      if (!squareConfigured) {
        setStatus({ type: "error", message: "Square keys not set yet (preview mode). Add env vars on Vercel to enable." });
        return;
      }
      if (!window.Square) {
        setStatus({ type: "error", message: "Square SDK not loaded yet. Try again in a moment." });
        return;
      }

      const payments = window.Square.payments(squareAppId, squareLocationId);
      const card = await payments.card();
      await card.attach("#card-container");
      const result = await card.tokenize();

      if (result.status !== "OK") {
        setStatus({ type: "error", message: result.errors?.[0]?.message || "Card tokenize failed." });
        return;
      }

      const res = await fetch("/api/square/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: result.token, amountCents, buyerEmail: customerEmail.trim() || undefined })
      });

      const data = await res.json();
      if (!data.ok) {
        setStatus({ type: "error", message: "Payment failed. (Square not configured yet or token invalid.)" });
        return;
      }

      setSquarePaid({ paymentId: data.paymentId, receiptUrl: data.receiptUrl });
      setStatus({ type: "ok", message: "Payment successful. Now submit the order." });
    } catch (e: any) {
      setStatus({ type: "error", message: e?.message || "Square payment error." });
    }
  }

  const showSquare = isFuture || payChoice === "square";

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 className="h1">BBQ Hut – Order Ahead</h1>
            <div className="muted">Same-day: pay at pickup or online. Future dates: online payment required.</div>
          </div>
          <span className="badge">Email-to-fax friendly</span>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid grid2">
        <div className="card">
          <div className="h2">Menu</div>
          <div className="muted">Tap “Add” to build an order.</div>
          <div className="hr" />

          <div className="grid" style={{ gap: 16 }}>
            {byCategory.map(([cat, items]) => (
              <div key={cat} className="card">
                <div className="h2" style={{ margin: 0 }}>{cat}</div>
                <div className="hr" />
                <div className="grid" style={{ gap: 12 }}>
                  {items.map((item) => (
                    <div key={item.id} className="item">
                      <div style={{ maxWidth: "75%" }}>
                        <div style={{ fontWeight: 800 }}>{item.name}</div>
                        {item.desc ? <div className="muted" style={{ fontSize: 12 }}>{item.desc}</div> : null}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="price">{dollars(item.price)}</div>
                        <button className="btn primary" onClick={() => add(item.id)} style={{ marginTop: 6 }}>Add</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="h2">Your Order</div>
          <div className="muted" style={{ fontSize: 12 }}>Orders are emailed as plain text (tiny size) for email-to-fax delivery.</div>
          <div className="hr" />

          {detailed.length === 0 ? (
            <div className="muted">Cart is empty.</div>
          ) : (
            <div className="grid" style={{ gap: 10 }}>
              {detailed.map(l => (
                <div key={l.id} className="card" style={{ borderRadius: 14 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 800 }}>{l.name}</div>
                    <div className="price">{dollars(l.lineTotal)}</div>
                  </div>
                  <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn" onClick={() => setQty(l.id, l.qty - 1)}>-</button>
                    <span className="kbd">Qty: {l.qty}</span>
                    <button className="btn" onClick={() => setQty(l.id, l.qty + 1)}>+</button>
                    <button className="btn danger" onClick={() => remove(l.id)} style={{ marginLeft: "auto" }}>Remove</button>
                  </div>
                </div>
              ))}
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800 }}>Subtotal</div>
                <div className="price">{dollars(subtotal)}</div>
              </div>
            </div>
          )}

          <div className="hr" />

          <div className="grid" style={{ gap: 10 }}>
            <div>
              <label>Customer Name *</label>
              <input className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div>
              <label>Phone *</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label>Customer Email (optional)</label>
              <input className="input" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
            </div>
            <div>
              <label>Event / Pickup Date *</label>
              <input className="input" type="date" value={eventDate} min={todayISO()} onChange={e => setEventDate(e.target.value)} />
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Same-day can pay at pickup or online. Future dates require online payment.
              </div>
            </div>
            <div>
              <label>Pickup Time *</label>
              <input className="input" value={pickupTime} onChange={e => setPickupTime(e.target.value)} placeholder="e.g., 3:30 PM or 2–3 PM" />
            </div>
            <div>
              <label>Notes</label>
              <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="hr" />

          <div className="card" style={{ borderRadius: 14 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900 }}>Payment</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {isFuture ? "Pre-orders require online payment." : "Same-day orders can pay at pickup or online."}
                </div>
              </div>
              <span className="badge">{isFuture ? "ONLINE REQUIRED" : "OPTIONAL ONLINE"}</span>
            </div>

            <div className="hr" />

            {!isFuture && (
              <div className="row">
                <label style={{ margin: 0, width: "100%" }}>
                  <input type="radio" name="pay" checked={payChoice === "pickup"} onChange={() => setPayChoice("pickup")} /> Pay at pickup (same day)
                </label>
                <label style={{ margin: 0, width: "100%" }}>
                  <input type="radio" name="pay" checked={payChoice === "square"} onChange={() => setPayChoice("square")} /> Pay online now (Square)
                </label>
              </div>
            )}

            {isFuture && <div className="muted" style={{ fontSize: 12 }}>Online payment is required for future dates.</div>}
          </div>

          {showSquare && (
            <div className="card" style={{ borderRadius: 14, marginTop: 12 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>Square Online Payment</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {squareConfigured ? "Enter card details and pay." : "Preview mode: add Square keys on Vercel to enable real payments."}
                  </div>
                </div>
                <span className="badge">SANDBOX</span>
              </div>

              <div className="hr" />

              <div id="card-container" className="card" style={{ borderRadius: 14, padding: 12 }} />
              <div className="row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
                <button className="btn primary" onClick={squarePay} disabled={!squareConfigured || amountCents <= 0}>
                  Pay Now
                </button>
              </div>

              {squarePaid && (
                <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                  Paid: <span className="kbd">{squarePaid.paymentId}</span>
                </div>
              )}
            </div>
          )}

          <div className="hr" />

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn danger" onClick={clear}>Clear Cart</button>
            <button className="btn primary" onClick={submitOrder} disabled={submitting || detailed.length === 0}>
              {submitting ? "Submitting…" : "Submit Order"}
            </button>
          </div>

          {status.type !== "idle" && (
            <div className="card" style={{ borderRadius: 14, marginTop: 12 }}>
              <div style={{ fontWeight: 900 }}>{status.type === "error" ? "Issue" : "Success"}</div>
              <div className="muted">{status.message}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
