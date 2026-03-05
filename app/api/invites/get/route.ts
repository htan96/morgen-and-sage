import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token;

    console.log("Invite validation request:", { token });

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }

    /*
    --------------------------------
    Fetch invite
    --------------------------------
    */

    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .select("id, tenant_id, email, expires_at, used")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    /*
    --------------------------------
    Prevent reused invites
    --------------------------------
    */

    if (invite.used) {
      return NextResponse.json(
        { error: "Invite already used" },
        { status: 400 }
      );
    }

    /*
    --------------------------------
    Check expiration
    --------------------------------
    */

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Invite expired" },
        { status: 400 }
      );
    }

    /*
    --------------------------------
    Success
    --------------------------------
    */

    return NextResponse.json({
      success: true,
      tenantId: invite.tenant_id,
      email: invite.email,
    });

  } catch (err: any) {
    console.error("invite-get error:", err);

    return NextResponse.json(
      { error: err?.message || "Failed to validate invite" },
      { status: 500 }
    );
  }
}