import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
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

    // Fetch document
    const { data: doc, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (error || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Create signed URL to read file
    const { data: signedData, error: signedError } =
      await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 60);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Could not access file" },
        { status: 500 }
      );
    }

    // Call OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are an expert financial document parser.

Extract and return ONLY valid JSON with:
{
  "vendor_name": string | null,
  "document_date": string (YYYY-MM-DD) | null,
  "total_amount": number | null,
  "category": string | null,
  "is_depreciable": boolean,
  "confidence_score": number (0-1)
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

    const extracted = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    // Update document in DB
    await supabase
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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("OCR Error:", err);

    return NextResponse.json(
      { error: "OCR failed" },
      { status: 500 }
    );
  }
}