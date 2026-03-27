import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in to add parcels." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { draftId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: draft, error: draftError } = await supabase
      .from("parcel_drafts")
      .select("id")
      .eq("id", draftId)
      .eq("user_id", session.userId)
      .single();

    if (draftError || !draft) {
      return NextResponse.json(
        { message: "Parcel draft not found." },
        { status: 404 },
      );
    }

    if (!body.size || !body.weight || !body.itemType || !body.deliveryGuarantee) {
      return NextResponse.json(
        { message: "Parcel details are incomplete." },
        { status: 400 },
      );
    }

    const { data: createdItem, error: itemError } = await supabase
      .from("parcel_draft_items")
      .insert({
        parcel_draft_id: draftId,
        size: String(body.size),
        weight_text: String(body.weight),
        item_type: String(body.itemType),
        delivery_guarantee: String(body.deliveryGuarantee),
        quantity: Number(body.quantity ?? 1),
        photo_name: body.photoName ? String(body.photoName) : null,
      })
      .select("id")
      .single();

    if (itemError) {
      return NextResponse.json(
        { message: "Unable to save parcel item." },
        { status: 500 },
      );
    }

    await supabase
      .from("parcel_drafts")
      .update({ step_completed: 3 })
      .eq("id", draftId)
      .eq("user_id", session.userId);

    return NextResponse.json({ itemId: createdItem.id });
  } catch {
    return NextResponse.json(
      { message: "Unable to save parcel details right now." },
      { status: 500 },
    );
  }
}
