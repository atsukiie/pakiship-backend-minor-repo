import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";

async function getOwnedDraftItem(
  draftId: string,
  itemId: string,
  userId: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("parcel_draft_items")
    .select(`
      id,
      quantity,
      parcel_drafts!inner (
        id,
        user_id
      )
    `)
    .eq("id", itemId)
    .eq("parcel_draft_id", draftId)
    .eq("parcel_drafts.user_id", userId)
    .single();

  return { data, error, supabase };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ draftId: string; itemId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in to update a parcel item." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const quantity = Number(body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { message: "Quantity must be at least 1." },
        { status: 400 },
      );
    }

    const { draftId, itemId } = await params;
    const { data, error, supabase } = await getOwnedDraftItem(
      draftId,
      itemId,
      session.userId,
    );

    if (error || !data) {
      return NextResponse.json(
        { message: "Parcel item not found." },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabase
      .from("parcel_draft_items")
      .update({ quantity })
      .eq("id", itemId)
      .eq("parcel_draft_id", draftId);

    if (updateError) {
      return NextResponse.json(
        { message: "Unable to update parcel quantity." },
        { status: 500 },
      );
    }

    await supabase
      .from("parcel_drafts")
      .update({ step_completed: 3 })
      .eq("id", draftId)
      .eq("user_id", session.userId);

    return NextResponse.json({ itemId, quantity });
  } catch {
    return NextResponse.json(
      { message: "Unable to update parcel item right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ draftId: string; itemId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in to remove a parcel item." },
      { status: 401 },
    );
  }

  try {
    const { draftId, itemId } = await params;
    const { data, error, supabase } = await getOwnedDraftItem(
      draftId,
      itemId,
      session.userId,
    );

    if (error || !data) {
      return NextResponse.json(
        { message: "Parcel item not found." },
        { status: 404 },
      );
    }

    const { error: deleteError } = await supabase
      .from("parcel_draft_items")
      .delete()
      .eq("id", itemId)
      .eq("parcel_draft_id", draftId);

    if (deleteError) {
      return NextResponse.json(
        { message: "Unable to remove parcel item." },
        { status: 500 },
      );
    }

    await supabase
      .from("parcel_drafts")
      .update({ step_completed: 3 })
      .eq("id", draftId)
      .eq("user_id", session.userId);

    return NextResponse.json({ itemId });
  } catch {
    return NextResponse.json(
      { message: "Unable to remove parcel item right now." },
      { status: 500 },
    );
  }
}
