"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inquiryStatuses, type InquiryStatus } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { updateInquiry } from "@/lib/inquiries";

export async function updateInquiryAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as InquiryStatus;
  const internalNote = String(formData.get("internalNote") || "");

  if (!id || !inquiryStatuses.includes(status)) {
    redirect("/admin");
  }

  await updateInquiry(id, { status, internalNote });
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
  redirect(`/admin/${id}?saved=1`);
}
