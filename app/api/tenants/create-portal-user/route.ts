import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
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

    const supabase = supabaseAdmin;

    /*
    --------------------------------
    Get tenant
    --------------------------------
    */

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

    /*
    --------------------------------
    Check if user exists
    --------------------------------
    */

    const { data: users } = await supabase.auth.admin.listUsers();

    const existingUser = users.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let authUserId;

    /*
    --------------------------------
    Create user if needed
    --------------------------------
    */

    if (!existingUser) {

      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            role: "tenant",
            tenant_id: tenantId
          }
        });

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }

      authUserId = newUser.user.id;

    } else {

      authUserId = existingUser.id;

    }

    /*
    --------------------------------
    Link tenant to auth user
    --------------------------------
    */

    await supabase
      .from("tenants")
      .update({
        auth_user_id: authUserId,
        must_reset_password: true
      })
      .eq("id", tenantId);

    /*
    --------------------------------
    Generate password setup link
    --------------------------------
    */

    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email
      });

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message },
        { status: 500 }
      );
    }

    const resetLink = linkData.properties.action_link;

    /*
    --------------------------------
    Send Email
    --------------------------------
    */

    await sendEmail({
      organizationId,
      to: email,
      subject: "Set Up Your Kitchen Portal Access",
      html: `
        <h2>Kitchen Portal Access</h2>

        <p>Your portal account is ready.</p>

        <p>
          Click the link below to set your password:
        </p>

        <p>
          <a href="${resetLink}">
            Set Your Password
          </a>
        </p>

        <p>If you did not request this access please ignore this email.</p>
      `
    });

    return NextResponse.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: "Failed to create portal user" },
      { status: 500 }
    );

  }
}