import type { Metadata } from "next";
import { InfoShell } from "@/components/info-shell";

export const metadata: Metadata = {
  title: "حذف بيانات المستخدم",
  description: "كيفية طلب حذف بياناتك من Tool2Day",
};

export default function DataDeletionPage() {
  return (
    <InfoShell
      title="حذف بيانات المستخدم"
      description="تعليمات طلب حذف بيانات حسابك المرتبطة بتسجيل الدخول عبر Facebook أو Google أو GitHub."
      paragraphs={[
        "إذا سجّلت الدخول إلى Tool2Day عبر Facebook أو Google أو GitHub، يمكنك طلب حذف بيانات حسابك في أي وقت.",
        "اطلب الحذف عبر صفحة «تواصل معنا» من بريدك المسجّل، واكتب في الرسالة: «طلب حذف حسابي وبياناتي».",
        "بعد التحقق من ملكية الحساب، نحذف بيانات الملف المرتبطة بخدمتنا خلال مدة معقولة (عادة خلال 30 يوماً)، ما لم يُطلب الاحتفاظ بها قانونياً.",
        "يمكنك أيضاً إزالة صلاحية تطبيق Tool2Day من إعدادات Facebook لديك: الإعدادات ← التطبيقات والمواقع ← إزالة tool2day.",
        "للتواصل: support@tool2day.com أو https://www.tool2day.com/contact",
      ]}
    />
  );
}
