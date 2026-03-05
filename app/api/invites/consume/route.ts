import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .select("id, tenant_id, email, expires_at, used")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: "Invite already used" }, { status: 400 });
    }

    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tenantId: invite.tenant_id,
      email: invite.email,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to validate invite" }, { status: 500 });
  }
}