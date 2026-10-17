"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inquiryStatuses, type InquiryStatus } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import {
  deleteInquiry,
  getInquiry,
  saveInquiryReply,
  updateInquiry,
} from "@/lib/inquiries";
import { sendCustomerReply } from "@/lib/mail";

function revalidateInquiryPaths(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  if (id) revalidatePath(`/admin/${id}`);
}

function safeAdminPath(path: string, fallback = "/admin/inquiries") {
  if (!path.startsWith("/admin")) return fallback;
  return path;
}

export async function updateInquiryAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as InquiryStatus;
  const internalNote = String(formData.get("internalNote") || "");

  if (!id || !inquiryStatuses.includes(status)) {
    redirect("/admin/inquiries");
  }

  await updateInquiry(id, { status, internalNote });
  revalidateInquiryPaths(id);
  redirect(`/admin/${id}?saved=1`);
}

export async function archiveInquiryAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") || "").trim();
  const next = safeAdminPath(String(formData.get("next") || "/admin/inquiries"));
  if (!id) redirect("/admin/inquiries");

  await updateInquiry(id, { status: "archived" });
  revalidateInquiryPaths(id);

  const url = new URL(next, "https://tool2day.com");
  url.searchParams.set("archived", "1");
  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

export async function unarchiveInquiryAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/admin/inquiries");

  await updateInquiry(id, { status: "in_progress" });
  revalidateInquiryPaths(id);
  redirect(`/admin/${id}?saved=1`);
}

export async function deleteInquiryAction(formData: FormData) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/admin/inquiries");

  await deleteInquiry(id);
  revalidateInquiryPaths(id);
  redirect("/admin/inquiries?deleted=1");
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

  revalidateInquiryPaths(id);
  redirect(`/admin/${id}?replied=1`);
}
