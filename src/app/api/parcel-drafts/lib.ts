import { createSupabaseAdminClient } from "@/lib/supabaseServer";

export async function getOwnedDraft(draftId: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("parcel_drafts")
    .select("id, user_id, step_completed, status")
    .eq("id", draftId)
    .eq("user_id", userId)
    .single();

  return { data, error, supabase };
}

export function createTrackingNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const serial = Math.floor(100000 + Math.random() * 900000);
  return `PKS-${year}-${serial}`;
}
