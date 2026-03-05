import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import crypto from "crypto";
import { sendEmail } from "@/lib/email/sendEmail";

export async function POST(req: Request) {
  try {
    const { tenantId, email } = await req.json();

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
    Generate token
    --------------------------------
    */

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24
    ).toISOString();

    /*
    --------------------------------
    Store invite
    --------------------------------
    */

    const { error: inviteErr } = await supabaseAdmin
      .from("invites")
      .insert({
        tenant_id: tenantId,
        email: email.toLowerCase(),
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
    Generate invite link
    --------------------------------
    */

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    /*
    --------------------------------
    Send email using Gmail API
    --------------------------------
    */

    await sendEmail({
      organizationId: tenant.organization_id,
      to: email,
      subject: "Kitchen Portal Access",
      html: `
        <h2>Kitchen Portal Access</h2>

        <p>Your portal account has been created.</p>

        <p>
          Click the link below to set your password:
        </p>

        <p>
          <a href="${inviteLink}">
            Set Your Password
          </a>
        </p>

        <p>This link expires in 24 hours.</p>
      `,
    });

    return NextResponse.json({
      success: true,
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );

  }
}