import { NextResponse } from "next/server";

interface WaitlistPayload {
  email?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as WaitlistPayload;
  const email = body.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Invalid email address" },
      { status: 400 }
    );
  }

  // Optional: forward to an external mailing list provider via webhook.
  // Configure MAILING_LIST_WEBHOOK_URL in your Vercel environment to enable this.
  const webhook = process.env.MAILING_LIST_WEBHOOK_URL;

  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("[waitlist] forwarding error", err);
      // We still return 200 to avoid leaking implementation details to clients.
    }
  }

  console.log("[waitlist] new signup:", email);

  return NextResponse.json({ ok: true });
}


