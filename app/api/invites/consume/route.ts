import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";

export async function POST(req: Request) {
  try {
    const { token, userId } = await req.json();

    if (!token || !userId) {
      return NextResponse.json(
        { error: "Missing token or userId" },
        { status: 400 }
      );
    }

    const { data: invite, error } = await supabaseAdmin
      .from("invites")
      .select("tenant_id")
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // mark invite used
    await supabaseAdmin
      .from("invites")
      .update({ used: true })
      .eq("token", token);

    // attach tenant to user
    await supabaseAdmin
      .from("profiles")
      .update({
        tenant_id: invite.tenant_id,
        role: "tenant",
      })
      .eq("id", userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to consume invite" },
      { status: 500 }
    );
  }
}