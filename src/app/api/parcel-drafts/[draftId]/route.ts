import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in to view a parcel draft." },
      { status: 401 },
    );
  }

  try {
    const { draftId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: draft, error } = await supabase
      .from("parcel_drafts")
      .select(
        `
          id,
          pickup_address,
          pickup_details,
          delivery_address,
          delivery_details,
          distance_text,
          duration_text,
          step_completed,
          status,
          parcel_draft_items (
            id,
            size,
            weight_text,
            item_type,
            delivery_guarantee,
            quantity,
            photo_name
          )
        `,
      )
      .eq("id", draftId)
      .eq("user_id", session.userId)
      .single();

    if (error || !draft) {
      return NextResponse.json(
        { message: "Parcel draft not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      draft: {
        id: draft.id,
        pickupLocation: {
          address: draft.pickup_address,
          details: draft.pickup_details,
        },
        deliveryLocation: {
          address: draft.delivery_address,
          details: draft.delivery_details,
        },
        distance: draft.distance_text,
        duration: draft.duration_text,
        stepCompleted: draft.step_completed,
        status: draft.status,
        items: (draft.parcel_draft_items ?? []).map((item) => ({
          id: item.id,
          size: item.size,
          weight: item.weight_text,
          itemType: item.item_type,
          deliveryGuarantee: item.delivery_guarantee,
          quantity: item.quantity,
          photoName: item.photo_name,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to load parcel draft right now." },
      { status: 500 },
    );
  }
}
