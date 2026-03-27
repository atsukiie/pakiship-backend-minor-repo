import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { getOwnedDraft } from "@/app/api/parcel-drafts/lib";

const ALLOWED_SERVICES = new Set(["pakishare", "PakiExpress", "pakibusiness"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in to select a delivery service." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { draftId } = await params;
    const serviceId = String(body.serviceId ?? "");
    const servicePrice = Number(body.servicePrice ?? 0);
    const dropOffPoint = body.dropOffPoint ?? null;

    if (!ALLOWED_SERVICES.has(serviceId)) {
      return NextResponse.json(
        { message: "Please select a valid delivery service." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(servicePrice) || servicePrice <= 0) {
      return NextResponse.json(
        { message: "Service pricing is invalid." },
        { status: 400 },
      );
    }

    if (serviceId === "pakishare" && !dropOffPoint?.id) {
      return NextResponse.json(
        { message: "PakiShare requires a drop-off hub selection." },
        { status: 400 },
      );
    }

    const { data: draft, error, supabase } = await getOwnedDraft(
      draftId,
      session.userId,
    );

    if (error || !draft) {
      return NextResponse.json(
        { message: "Parcel draft not found." },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabase
      .from("parcel_drafts")
      .update({ step_completed: 4, status: "draft" })
      .eq("id", draftId)
      .eq("user_id", session.userId);

    if (updateError) {
      return NextResponse.json(
        { message: "Unable to save delivery service right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      draftId,
      stepCompleted: 4,
      status: "draft",
      service: {
        id: serviceId,
        price: servicePrice,
        dropOffPoint,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to save delivery service right now." },
      { status: 500 },
    );
  }
}
