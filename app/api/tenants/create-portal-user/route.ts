import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/sendEmail";

export async function POST(req: Request) {
  try {
    const { tenantId, email } = await req.json();

    if (!tenantId || !email) {
      return NextResponse.json({ error: "Missing tenantId or email" }, { status: 400 });
    }

    // 1) Tenant + org
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("id, organization_id")
      .eq("id", tenantId)
      .single();

    if (tenantErr || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 2) Create invite token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    const { error: inviteErr } = await supabaseAdmin.from("invites").insert({
      tenant_id: tenantId,
      email: String(email).toLowerCase(),
      token,
      expires_at: expiresAt,
      used: false,
    });

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is missing" }, { status: 500 });
    }

    const inviteLink = `${appUrl}/invite/${token}`;

    // 3) Send email (RETURN RESULT)
    const gmailResult = await sendEmail({
      organizationId: tenant.organization_id,
      to: email,
      subject: "Kitchen Portal Access",
      html: `
        <h2>Kitchen Portal Access</h2>
        <p>Click below to set your password:</p>
        <p><a href="${inviteLink}">Set Your Password</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    return NextResponse.json({
      success: true,
      inviteLink,          // helpful for testing
      gmailResult,         // PROOF: should include id/threadId
    });
  } catch (err: any) {
    console.error("create-portal-user error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create portal user" },
      { status: 500 }
    );
  }
}