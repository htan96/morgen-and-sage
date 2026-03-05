import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/sendEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const tenantId = body?.tenantId;
    const email = body?.email;

    console.log("Invite request payload:", { tenantId, email });

    if (!tenantId || !email) {
      return NextResponse.json(
        { error: "Missing tenantId or email" },
        { status: 400 }
      );
    }

    /*
    --------------------------------
    Validate tenant
    --------------------------------
    */

    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("id, organization_id")
      .eq("id", tenantId)
      .single();

    if (tenantErr || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    /*
    --------------------------------
    Expire existing invites
    --------------------------------
    */

    await supabaseAdmin
      .from("invites")
      .update({ used: true })
      .eq("tenant_id", tenantId)
      .eq("used", false);

    /*
    --------------------------------
    Generate invite token
    --------------------------------
    */

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24
    ).toISOString(); // 24 hours

    /*
    --------------------------------
    Store invite
    --------------------------------
    */

    const { error: inviteErr } = await supabaseAdmin
      .from("invites")
      .insert({
        tenant_id: tenantId,
        email: String(email).toLowerCase(),
        token,
        expires_at: expiresAt,
        used: false,
      });

    if (inviteErr) {
      return NextResponse.json(
        { error: inviteErr.message },
        { status: 500 }
      );
    }

    /*
    --------------------------------
    Build invite link
    --------------------------------
    */

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const inviteLink = `${appUrl.replace(/\/$/, "")}/invite/${token}`;

    /*
    --------------------------------
    Send email
    --------------------------------
    */

    const gmailResult = await sendEmail({
      organizationId: tenant.organization_id,
      to: String(email).toLowerCase(),
      subject: "Kitchen Portal Access",
      html: `
        <h2>Kitchen Portal Access</h2>
        <p>Click below to set your password:</p>
        <p>
          <a href="${inviteLink}" target="_blank">
            Set Your Password
          </a>
        </p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    /*
    --------------------------------
    Success
    --------------------------------
    */

    return NextResponse.json({
      success: true,
      inviteLink,
      gmailResult,
    });

  } catch (err: any) {
    console.error("create-portal-user error:", err);

    return NextResponse.json(
      { error: err?.message || "Failed to create portal user" },
      { status: 500 }
    );
  }
}