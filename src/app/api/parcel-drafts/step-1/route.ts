import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { createSupabaseAdminClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in to create a parcel draft." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const draftId = body.draftId ? String(body.draftId) : null;

    if (!body.pickupLocation?.address || !body.deliveryLocation?.address) {
      return NextResponse.json(
        { message: "Pickup and delivery locations are required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const payload = {
      user_id: session.userId,
      pickup_address: String(body.pickupLocation.address),
      pickup_details: body.pickupLocation.details
        ? String(body.pickupLocation.details)
        : null,
      delivery_address: String(body.deliveryLocation.address),
      delivery_details: body.deliveryLocation.details
        ? String(body.deliveryLocation.details)
        : null,
      distance_text: body.distance ? String(body.distance) : null,
      duration_text: body.duration ? String(body.duration) : null,
      step_completed: 1,
      status: "draft",
    };

    if (draftId) {
      const { data: updatedDraft, error } = await supabase
        .from("parcel_drafts")
        .update(payload)
        .eq("id", draftId)
        .eq("user_id", session.userId)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { message: "Unable to update parcel draft." },
          { status: 500 },
        );
      }

      return NextResponse.json({ draftId: updatedDraft.id });
    }

    const { data: createdDraft, error } = await supabase
      .from("parcel_drafts")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { message: "Unable to create parcel draft." },
        { status: 500 },
      );
    }

    return NextResponse.json({ draftId: createdDraft.id });
  } catch {
    return NextResponse.json(
      { message: "Unable to save route details right now." },
      { status: 500 },
    );
  }
}
