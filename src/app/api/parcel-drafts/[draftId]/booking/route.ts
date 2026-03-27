import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { createTrackingNumber, getOwnedDraft } from "@/app/api/parcel-drafts/lib";

const PHONE_REGEX = /^09\d{9}$/;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "You must be logged in to complete a booking." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { draftId } = await params;

    const senderName = String(body.senderName ?? "").trim();
    const senderPhone = String(body.senderPhone ?? "").trim();
    const receiverName = String(body.receiverName ?? "").trim();
    const receiverPhone = String(body.receiverPhone ?? "").trim();
    const paymentMethod = String(body.paymentMethod ?? "").trim();
    const selectedService = String(body.selectedService ?? "").trim();
    const servicePrice = Number(body.servicePrice ?? 0);
    const totalParcels = Number(body.totalParcels ?? 0);
    const distance = String(body.distance ?? "").trim();
    const duration = String(body.duration ?? "").trim();

    if (!senderName || !receiverName) {
      return NextResponse.json(
        { message: "Sender and receiver names are required." },
        { status: 400 },
      );
    }

    if (!PHONE_REGEX.test(senderPhone) || !PHONE_REGEX.test(receiverPhone)) {
      return NextResponse.json(
        { message: "Phone numbers must use the 09XXXXXXXXX format." },
        { status: 400 },
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { message: "Please select a payment method before continuing." },
        { status: 400 },
      );
    }

    if (!selectedService || !Number.isFinite(servicePrice) || servicePrice <= 0) {
      return NextResponse.json(
        { message: "Delivery service details are incomplete." },
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

    const trackingNumber = createTrackingNumber();
    const { error: updateError } = await supabase
      .from("parcel_drafts")
      .update({ step_completed: 5, status: "submitted" })
      .eq("id", draftId)
      .eq("user_id", session.userId);

    if (updateError) {
      return NextResponse.json(
        { message: "Unable to complete booking right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      draftId,
      trackingNumber,
      stepCompleted: 5,
      status: "submitted",
      booking: {
        senderName,
        senderPhone,
        receiverName,
        receiverPhone,
        paymentMethod,
        selectedService,
        servicePrice,
        totalParcels,
        distance,
        duration,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to complete booking right now." },
      { status: 500 },
    );
  }
}
