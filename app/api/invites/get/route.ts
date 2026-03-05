import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { tenantId, email } = await req.json();

    if (!tenantId || !email) {
      return NextResponse.json({ error: "Missing tenantId or email" }, { status: 400 });
    }

    // validate tenant exists
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("id", tenantId)
      .single();

    if (tenantErr || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // generate token + expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24h

    // store invite
    const { error: inviteErr } = await supabaseAdmin.from("invites").insert({
      tenant_id: tenantId,
      email: email.toLowerCase(),
      token,
      expires_at: expiresAt,
      used: false,
    });

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/invite/${token}`;

    // IMPORTANT: return link so you can copy/send any way you want (no Supabase email)
    return NextResponse.json({ success: true, inviteLink });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}