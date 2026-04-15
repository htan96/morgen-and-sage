export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/supabase-admin";
import { sendInvoiceEmail } from "@/lib/email/sendInvoiceEmail";
import { sendTenantMessageEmail } from "@/lib/email/sendTenantMessageEmail";

type CustomBody = {
  tenantId: string;
  to: string;
  subject?: string;
  message: string;
  invoiceId?: string;
};

function isCustomTenantMessage(body: unknown): body is CustomBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.tenantId === "string" &&
    typeof b.to === "string" &&
    typeof b.message === "string"
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (isCustomTenantMessage(body)) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }

      const { tenantId, to, subject, message, invoiceId } = body;

      if (!to.trim()) {
        return NextResponse.json(
          { error: "Missing recipient (to)" },
          { status: 400 }
        );
      }

      await sendTenantMessageEmail({
        tenantId,
        to: to.trim(),
        subject: typeof subject === "string" ? subject : "",
        message,
        invoiceId: invoiceId || null,
      });

      return NextResponse.json({ success: true, mode: "tenant_message" });
    }

    const { invoiceId } = body as { invoiceId?: string };

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId or tenant message payload" },
        { status: 400 }
      );
    }

    await sendInvoiceEmail(invoiceId);

    const { error } = await supabaseAdmin
      .from("invoices")
      .update({
        status: "sent",
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (error) {
      console.error("Invoice update error:", error);

      return NextResponse.json(
        { error: "Invoice email sent but failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, mode: "invoice" });
  } catch (err: unknown) {
    console.error("Send invoice error:", err);

    const message =
      err instanceof Error ? err.message : "Failed to send";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
