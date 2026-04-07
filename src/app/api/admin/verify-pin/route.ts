// [IZMENA vs Zlatni standard] PIN za /admin-zdravko se NE upoređuje u browseru (tam bi bio javno čitljiv).
// Vrednost je samo u MEDEX_ADMIN_DASHBOARD_PIN na serveru (.env / hosting secrets).

import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function pinsEqual(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const pinRaw = (body as { pin?: unknown }).pin;
  const pin = typeof pinRaw === "string" ? pinRaw : "";

  const configured = process.env.MEDEX_ADMIN_DASHBOARD_PIN?.trim() ?? "";
  const isProd = process.env.NODE_ENV === "production";

  let expected: string;
  if (configured.length > 0) {
    expected = configured;
  } else if (!isProd) {
    // [DEV] Dok ne postaviš MEDEX_ADMIN_DASHBOARD_PIN, ostaje kompatibilno sa starim Zlatnim standardom.
    expected = "admin123";
  } else {
    return NextResponse.json(
      { ok: false, error: "pin_not_configured" },
      { status: 503 },
    );
  }

  if (!pinsEqual(pin, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
