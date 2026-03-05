import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

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
      .select("id")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    /*
    --------------------------------
    Invite user (Supabase sends email)
    --------------------------------
    */

    const { data, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
        data: {
          role: "tenant",
          tenant_id: tenantId
        }
      });

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    /*
    --------------------------------
    Link tenant to auth user
    --------------------------------
    */

    await supabase
      .from("tenants")
      .update({
        auth_user_id: data.user?.id,
        must_reset_password: true
      })
      .eq("id", tenantId);

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