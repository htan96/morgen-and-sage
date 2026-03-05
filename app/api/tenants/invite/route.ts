import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/sendEmail"; // <-- adjust path if different

export async function POST(req: Request) {
  try {
    const { tenantId, email } = await req.json();

    if (!tenantId || !email) {
      return NextResponse.json(
        { error: "Missing tenantId or email" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // validate tenant exists (+ grab org id + tenant name if you want it in the email)
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("id, name, organization_id")
      .eq("id", tenantId)
      .single();

    if (tenantErr || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // generate token + expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24
    ).toISOString(); // 24h

    // store invite
    const { error: inviteErr } = await supabaseAdmin.from("invites").insert({
      tenant_id: tenantId,
      email: normalizedEmail,
      token,
      expires_at: expiresAt,
      used: false,
    });

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${appUrl}/invite/${token}`;

    // ✅ SEND EMAIL
    // If you have multi-org sending configured, use tenant.organization_id here.
    // This assumes your sendEmail looks up the sender profile by organizationId.
    if (!tenant.organization_id) {
      return NextResponse.json(
        {
          error:
            "Tenant is missing organization_id — required to send email with organization sender.",
        },
        { status: 500 }
      );
    }

    await sendEmail({
      organizationId: tenant.organization_id,
      to: normalizedEmail,
      subject: "Your Portal Invite",
      html: `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height: 1.5;">
          <h2 style="margin: 0 0 8px;">You're invited</h2>
          <p style="margin: 0 0 16px;">
            Use the link below to activate your portal access${
              tenant?.name ? ` for <b>${tenant.name}</b>` : ""
            }.
          </p>
          <p style="margin: 0 0 16px;">
            <a href="${inviteLink}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;border:1px solid #ddd;">
              Accept Invite
            </a>
          </p>
          <p style="margin:0;color:#666;font-size:12px;">
            This link expires in 24 hours.
          </p>
          <p style="margin:12px 0 0;color:#666;font-size:12px;">
            If the button doesn't work, copy/paste this URL:<br/>
            ${inviteLink}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, inviteLink });
  } catch (err: any) {
    console.error("Invite create/send failed:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create invite" },
      { status: 500 }
    );
  }
}