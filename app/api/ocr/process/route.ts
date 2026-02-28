import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const { documentId } = await req.json();

  if (!documentId) {
    return NextResponse.json(
      { error: "Missing documentId" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1️⃣ Fetch document
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !doc) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Prevent double processing
    if (doc.status !== "pending") {
      return NextResponse.json({ message: "Already processed" });
    }

    // 2️⃣ Mark as processing
    const { error: processingError } = await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    if (processingError) {
      console.error("Failed to mark processing:", processingError);
      throw processingError;
    }

    // 3️⃣ Create signed URL
    const { data: signedData, error: signedError } =
      await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 120);

    if (signedError || !signedData?.signedUrl) {
      console.error("Signed URL error:", signedError);

      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);

      return NextResponse.json(
        { error: "Could not access file" },
        { status: 500 }
      );
    }

    console.log("Calling OpenAI for:", documentId);

    // 4️⃣ Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are an expert financial document parser.

Extract and return ONLY valid JSON:
{
  "vendor_name": string | null,
  "document_date": string (YYYY-MM-DD) | null,
  "total_amount": number | null,
  "category": string | null,
  "is_depreciable": boolean
}

If unsure, return null.
Do not hallucinate.
          `,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: signedData.signedUrl,
              },
            },
          ],
        },
      ],
    });

    console.log("OpenAI response received for:", documentId);

    let extracted: any = {};

    try {
      extracted = JSON.parse(
        response.choices[0].message.content || "{}"
      );
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      extracted = {};
    }

    console.log("Updating document:", documentId);

    // 5️⃣ Update document safely
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        vendor_name: extracted.vendor_name ?? null,
        document_date: extracted.document_date ?? null,
        amount: extracted.total_amount ?? null,
        category: extracted.category ?? null,
        is_depreciable: extracted.is_depreciable ?? false,
        status: "review",
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Update failed:", updateError);

      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);

      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("OCR Error:", err);

    await supabase
      .from("documents")
      .update({ status: "error" })
      .eq("id", documentId);

    return NextResponse.json(
      { error: "OCR failed" },
      { status: 500 }
    );
  }
}