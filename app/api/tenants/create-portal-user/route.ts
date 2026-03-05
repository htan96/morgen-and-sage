import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sendEmail";

function generatePassword() {
  return Math.random().toString(36).slice(-10);
}

export async function POST(req: Request) {
  try {
    const { tenantId, email } = await req.json();

    if (!tenantId || !email) {
      return NextResponse.json(
        { error: "Missing tenantId or email" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    /* ------------------------------ */
    /* Get tenant + organization      */
    /* ------------------------------ */

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, organization_id")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const organizationId = tenant.organization_id;

    /* ------------------------------ */
    /* Generate password              */
    /* ------------------------------ */

    const tempPassword = generatePassword();

    /* ------------------------------ */
    /* Create Supabase Auth User      */
    /* ------------------------------ */

    const { data, error } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const authUserId = data.user.id;

    /* ------------------------------ */
    /* Link tenant to auth user       */
    /* ------------------------------ */

    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        auth_user_id: authUserId,
        must_change_password: true,
      })
      .eq("id", tenantId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    /* ------------------------------ */
    /* Send Email via Gmail API       */
    /* ------------------------------ */

    await sendEmail({
      organizationId,
      to: email,
      subject: "Your Kitchen Portal Login",
      html: `
        <h2>Welcome to the Kitchen Portal</h2>

        <p>Your portal account has been created.</p>

        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>

        <p>Please login and change your password.</p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">
            Open Portal
          </a>
        </p>
      `,
    });

    return NextResponse.json({
      success: true,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to create portal user" },
      { status: 500 }
    );
  }
}