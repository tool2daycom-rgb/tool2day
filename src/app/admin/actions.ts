"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inquiryStatuses, type InquiryStatus } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import {
  getInquiry,
  saveInquiryReply,
  updateInquiry,
} from "@/lib/inquiries";
import { sendCustomerReply } from "@/lib/mail";

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
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/${id}`);
  redirect(`/admin/${id}?saved=1`);
}

export type SendReplyState = {
  ok: boolean;
  error?: string;
};

export async function sendReplyAction(
  _prev: SendReplyState,
  formData: FormData,
): Promise<SendReplyState> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") || "").trim();
  const subject = String(formData.get("subject") || "");
  const body = String(formData.get("body") || "");

  if (!id) {
    return { ok: false, error: "معرّف الطلب غير صالح." };
  }

  const inquiry = await getInquiry(id);
  if (!inquiry) {
    return { ok: false, error: "الطلب غير موجود." };
  }

  const result = await sendCustomerReply({
    to: inquiry.email,
    subject,
    body,
  });

  if (!result.ok) {
    return { ok: false, error: result.message };
  }

  await saveInquiryReply({
    inquiryId: inquiry.id,
    subject: subject.trim(),
    body: body.trim(),
    toEmail: inquiry.email,
    fromEmail: result.fromEmail,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/${id}`);
  redirect(`/admin/${id}?replied=1`);
}
