"use client";

import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

type FaqItem = {
  id: string;
  question: string;
  answer: React.ReactNode;
};

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

const supportLink = (
  <Link href="/contact" className="font-medium text-[#2563eb] hover:underline">
    تواصل مع فريق الدعم
  </Link>
);

const sections: FaqSection[] = [
  {
    id: "billing",
    title: "الفوترة والحساب",
    items: [
      {
        id: "cancel-subscription",
        question: "كيف ألغي الاشتراك أو أوقف التجديد التلقائي؟",
        answer: (
          <>
            <p>تحقق مما إذا كان اشتراكك ملغى. اتبع الخطوات التالية:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>سجّل الدخول إلى حسابك في Tool2Day إن لم تكن مسجّلاً.</li>
              <li>اضغط على أيقونة الملف الشخصي في الشريط العلوي.</li>
              <li>
                اختر <strong>الحساب</strong> من القائمة.
              </li>
              <li>مرّر إلى أسفل الصفحة.</li>
              <li>
                إذا كانت حالة الخطة <strong>نشطة</strong>، اضغط{" "}
                <strong>إلغاء الاشتراك</strong>.
              </li>
            </ol>
            <p className="mt-3">
              إذا لم يكن Premium مفعّلاً رغم الخصم، فقد يكون الاشتراك تحت بريد إلكتروني
              آخر. جرّب كل عناوين البريد التي قد تكون استخدمتها واتبع الخطوات أعلاه.
            </p>
            <p className="mt-3">
              إذا ألغيت الاشتراك وما زالت الرسوم مستمرة، يرجى {supportLink}.
            </p>
          </>
        ),
      },
      {
        id: "still-charged",
        question: "لماذا ما زلت أدفع بعد إلغاء الاشتراك؟",
        answer: (
          <>
            <p>
              تأكد أنك مسجّل الدخول للحساب الصحيح عبر أيقونة الملف الشخصي في الشريط
              العلوي.
            </p>
            <p className="mt-3">
              إذا كنت مسجّلاً ولا يظهر Premium بعد الدفع، تأكد أنك استخدمت نفس البريد
              عند الدفع. قد يكون الاشتراك مرتبطاً بحساب آخر.
            </p>
            <p className="mt-3">
              إذا كنت متأكداً أن الحساب صحيح وما زال الوصول غير متاح، يرجى {supportLink}.
            </p>
          </>
        ),
      },
      {
        id: "restore-premium",
        question: "تم الخصم لكن لا أملك وصول Premium. كيف أستعيده؟",
        answer: (
          <>
            <p>
              قد يكون لديك اشتراك تحت حساب آخر. راجع كل عناوين البريد التي قد تكون
              استخدمتها. إذا وجدت اشتراكاً غير مرغوب، ألغِه كما في{" "}
              <a
                href="#cancel-subscription"
                className="font-medium text-[#2563eb] hover:underline"
              >
                كيف ألغي الاشتراك؟
              </a>
              .
            </p>
            <p className="mt-3">
              إذا كان لديك اشتراك واحد فقط وتم الخصم مرتين، يرجى {supportLink} وأرسل
              إيصالات الدفع.
            </p>
          </>
        ),
      },
      {
        id: "charged-twice",
        question: "تم الخصم مرتين. ماذا أفعل؟",
        answer: (
          <>
            <p>
              تحقق إن كان لديك اشتراك نشط تحت بريد آخر. ألغِ أي خطط غير مرغوبة كما هو
              موضّح{" "}
              <a
                href="#cancel-subscription"
                className="font-medium text-[#2563eb] hover:underline"
              >
                هنا
              </a>
              .
            </p>
            <p className="mt-3">
              إذا كنت متأكداً أن الاشتراك واحد فقط، يرجى {supportLink} وأرفق إيصالات
              الدفع.
            </p>
          </>
        ),
      },
      {
        id: "annual-vs-monthly",
        question:
          "اشتريت خطة سنوية بالخطأ وأردت شهرية. هل يمكن التحويل أو الاسترداد؟",
        answer: (
          <p>
            نتفهم حدوث الأخطاء. إذا اخترت الخطة السنوية بدل الشهرية، تواصل معنا خلال{" "}
            <strong>12 ساعة</strong> من الشراء وسنحاول المساعدة — {supportLink}.
          </p>
        ),
      },
      {
        id: "change-payment",
        question: "كيف أغيّر طريقة الدفع؟",
        answer: (
          <>
            <p>لتغيير طريقة الدفع:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>سجّل الدخول إلى حساب Tool2Day.</li>
              <li>
                افتح <strong>طريقة الدفع</strong> ثم اضغط <strong>تغيير</strong>.
              </li>
              <li>اختر طريقة جديدة من الخيارات المتاحة وأكّد.</li>
            </ol>
            <p className="mt-3">
              ستُستخدم الطريقة المحدّثة للفواتير القادمة. إن واجهت مشكلة، يرجى{" "}
              {supportLink}.
            </p>
          </>
        ),
      },
      {
        id: "payment-failed",
        question: "عملية الدفع تفشل أو تُرفض. ماذا أفعل؟",
        answer: (
          <>
            <p>إذا رُفضت العملية، جرّب الخطوات التالية:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>
                <strong>تحقق من بيانات البطاقة</strong>: الرقم، تاريخ الانتهاء، ورمز CVV.
              </li>
              <li>
                <strong>تأكد من كفاية الرصيد</strong> في الحساب المرتبط.
              </li>
              <li>
                <strong>فعّل المدفوعات الإلكترونية والدولية</strong> من تطبيق البنك إن
                لزم.
              </li>
              <li>
                <strong>اسأل البنك</strong> إن تم حظر العملية لأسباب أمنية.
              </li>
              <li>
                <strong>عطّل VPN أو البروكسي</strong> ثم أعد المحاولة.
              </li>
              <li>
                <strong>جرّب بطاقة أو متصفحاً آخر</strong> (Chrome، Firefox، Safari، Edge).
              </li>
            </ol>
            <p className="mt-3">
              ما زالت المشكلة بعد التأكد مع البنك؟ يرجى {supportLink} لنراجع رمز الخطأ.
            </p>
          </>
        ),
      },
      {
        id: "upi",
        question: "هل تدعمون الدفع عبر UPI؟",
        answer: <p>ليس حالياً، ونفكر في إتاحته مستقبلاً.</p>,
      },
      {
        id: "crypto",
        question: "هل يمكن الدفع بالعملات الرقمية؟",
        answer: <p>ليس حالياً، ونفكر في إتاحته مستقبلاً.</p>,
      },
      {
        id: "cant-login",
        question: "لا أستطيع تسجيل الدخول إلى حسابي",
        answer: (
          <>
            <p>إذا فشل تسجيل الدخول، جرّب ما يلي:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>
                <strong>تحقق من بيانات الدخول</strong> من أخطاء إملائية أو مسافات أو لغة
                لوحة المفاتيح.
              </li>
              <li>
                <strong>جرّب نافذة عادية</strong> إذا كان وضع التصفح الخاص يمنع ملفات
                تعريف الارتباط.
              </li>
              <li>
                <strong>أعد تعيين كلمة المرور</strong> عبر «نسيت كلمة المرور».
              </li>
              <li>
                <strong>امسح ملفات تعريف الارتباط والذاكرة المؤقتة</strong> ثم أعد
                المحاولة.
              </li>
              <li>
                <strong>جرّب متصفحاً أو جهازاً آخر.</strong>
              </li>
              <li>
                <strong>عطّل مانعات الإعلانات</strong> أو إضافات الخصوصية التي قد تعيق
                الدخول.
              </li>
              <li>
                <strong>استخدم نفس طريقة التسجيل</strong> (Google، Apple، البريد، إلخ).
              </li>
              <li>
                <strong>أعد المحاولة لاحقاً</strong> في حال مشكلة مؤقتة في الخدمة.
              </li>
            </ol>
            <p className="mt-3">
              إذا لم تنجح الخطوات، يرجى {supportLink} مع تفاصيل المشكلة.
            </p>
          </>
        ),
      },
      {
        id: "reset-email",
        question: "لا تصلني رسالة إعادة تعيين كلمة المرور",
        answer: (
          <>
            <p>إذا لم تصل الرسالة:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>
                <strong>تحقق من مجلد البريد المزعج / Spam.</strong>
              </li>
              <li>
                <strong>تأكد من البريد</strong> أنه نفس المستخدم عند إنشاء الحساب.
              </li>
              <li>
                <strong>انتظر حتى 10 دقائق</strong> — قد يتأخر التسليم.
              </li>
              <li>ابحث في صندوق الوارد عن «Tool2Day» أو «Password Reset».</li>
              <li>
                <strong>تحقق من مساحة صندوق البريد</strong> — الامتلاء قد يمنع الرسائل
                الجديدة.
              </li>
              <li>راجع إعدادات الأمان حتى لا يُحظر نطاق tool2day.com.</li>
              <li>فلاتر العمل أو الجامعة قد تؤخر رسائل النظام.</li>
              <li>
                إذا سجّلت عبر Google/Apple، سجّل الدخول بتلك الطريقة بدل إعادة التعيين.
              </li>
              <li>انتظر دقائق بين محاولات إعادة الإرسال لتجنب الحدود المؤقتة.</li>
              <li>تأكد من استقرار اتصال الإنترنت.</li>
            </ol>
            <p className="mt-3">
              ما زالت الرسالة غير واصلة؟ يرجى {supportLink} مع بريدك المسجّل.
            </p>
          </>
        ),
      },
      {
        id: "delete-account",
        question: "كيف أحذف حسابي؟",
        answer: (
          <>
            <p>لحذف الحساب:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>سجّل الدخول إلى حسابك.</li>
              <li>
                مرّر للأسفل واضغط <strong>حذف الحساب</strong>.
              </li>
              <li>أكّد في النافذة، أو ألغِ إذا غيّرت رأيك.</li>
            </ol>
            <p className="mt-3">
              <strong>ملاحظة:</strong> حذف الحساب يزيل البيانات المرتبطة ويلغي أي اشتراك
              Premium. لا يمكن التراجع عن ذلك.
            </p>
          </>
        ),
      },
      {
        id: "unknown-charge",
        question: "تم الخصم لكنني لا أتذكر أنني اشتركت",
        answer: (
          <>
            <p>الخصومات غير المعروفة من Tool2Day غالباً لأحد الأسباب التالية:</p>
            <ol className="mt-3 list-decimal space-y-2 ps-5">
              <li>
                <strong>تجديد الاشتراك.</strong> قد تكون اشتركت سابقاً وتجددت الخطة تلقائياً.
              </li>
              <li>
                <strong>مواقع مشابهة.</strong> بعض المواقع تشبه Tool2Day وليست تابعة لنا.
                في كشف الحساب يظهر خصمنا عادةً باسم <strong>TOOL2DAY</strong> أو مشابه. إذا
                كان الوصف مختلفاً فغالباً خدمة أخرى.
              </li>
              <li>
                <strong>استخدام داخل المنزل.</strong> شخص لديه وصول لوسيلة الدفع قد يكون
                اشترك.
              </li>
              <li>
                <strong>استخدام غير مصرّح.</strong> إذا شككت بالاحتيال، اتصل بالبنك فوراً
                لحظر البطاقة.
              </li>
            </ol>
            <p className="mt-3">
              إذا لم ينطبق شيء مما سبق، يرجى {supportLink} لنساعدك.
            </p>
          </>
        ),
      },
      {
        id: "change-email",
        question: "كيف أغيّر عنوان البريد الإلكتروني؟",
        answer: (
          <p>
            تغيير البريد المرتبط بالحساب غير متاح حالياً. نخطط لإضافته في إعدادات الملف
            الشخصي لاحقاً. للحالات العاجلة، يرجى {supportLink}.
          </p>
        ),
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "استكشاف الأخطاء",
    items: [
      {
        id: "stuck-progress",
        question: "توقّف الرفع أو التصدير (مثلاً 0٪ أو 100٪ أو NaN٪)",
        answer: (
          <>
            <p>إذا توقف شريط التقدم، غالباً السبب اتصال الشبكة:</p>
            <ul className="mt-3 list-disc space-y-2 ps-5">
              <li>
                <strong>تحقق من الاتصال</strong> — استخدم شبكة مستقرة.
              </li>
              <li>
                <strong>جرّب شبكة أخرى</strong> (مثل نقطة اتصال الجوال) فقد تحجب شبكات
                العمل/المدرسة المعالجة.
              </li>
              <li>
                <strong>عطّل VPN أو البروكسي</strong> أو غيّر موقع الخادم ثم أعد المحاولة.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "larger-output",
        question: "لماذا ملف الإخراج أكبر من الأصلي رغم القص؟",
        answer: (
          <p>
            يعيد Tool2Day ترميز الفيديو عند التصدير. قد يكون ملفك الأصلي مضغوطاً بقوة. للحفاظ
            على الجودة قد نستخدم معدل بت أعلى، فيكبر الملف حتى بعد القص. لتقليل الحجم اختر
            دقة أقل أو جودة/ضغطاً أقل عند التصدير.
          </p>
        ),
      },
      {
        id: "encoding-failed",
        question: 'أظهر الخطأ "Encoding failed". كيف أصلحه؟',
        answer: (
          <p>
            غالباً يعني أن تنسيق الملف أو الترميز أو بنيته سبّب مشكلة أثناء التحويل. ندعم
            أغلب الصيغ الشائعة، لكن بعض الترميزات النادرة أو الملفات التالفة قد تفشل. يرجى{" "}
            {supportLink}.
          </p>
        ),
      },
      {
        id: "subtitles",
        question: "كيف أضيف ترجمة أو تعليقات أو نصاً؟",
        answer: (
          <p>
            يمكنك إضافة نص فوق الفيديو من{" "}
            <Link
              href="/tools/video-editor"
              className="font-medium text-[#2563eb] hover:underline"
            >
              محرر الفيديو
            </Link>{" "}
            عبر أداة النص. الترجمة المتزامنة / Closed Captions غير مدعومة بعد — ونعمل على
            إضافتها لاحقاً.
          </p>
        ),
      },
      {
        id: "save-button",
        question: 'أين زر "حفظ"؟',
        answer: (
          <p>
            في محرر الفيديو الإجراء اسمه <strong>تصدير</strong> (غالباً أعلى مساحة العمل).
            استخدمنا «تصدير» ليتوافق مع برامج التحرير الشائعة.
          </p>
        ),
      },
      {
        id: "transitions",
        question: "كيف أضيف انتقالات أو تأثيرات تلاشي؟",
        answer: (
          <p>
            الانتقالات بين المقاطع وتأثيرات التلاشي غير متاحة حالياً. نعرف أهميتها ونعمل
            على إضافتها في تحديثات قادمة.
          </p>
        ),
      },
      {
        id: "remove-logo",
        question: "كيف أزيل شعاراً أو علامة مائية من فيديو؟",
        answer: (
          <>
            <p>
              استخدم أداة{" "}
              <Link
                href="/tools/remove-logo"
                className="font-medium text-[#2563eb] hover:underline"
              >
                إزالة الشعار
              </Link>{" "}
              لطمس الشعارات أو العلامات المائية. تعمل بشكل أفضل على سطح المكتب؛ دعم الجوال
              محدود حالياً.
            </p>
            <p className="mt-3 font-semibold">الخطوات:</p>
            <ol className="mt-2 list-decimal space-y-2 ps-5">
              <li>
                افتح{" "}
                <Link
                  href="/tools/remove-logo"
                  className="font-medium text-[#2563eb] hover:underline"
                >
                  إزالة الشعار من الفيديو
                </Link>
                .
              </li>
              <li>
                اضغط <strong>اختيار ملف</strong> وارفع الفيديو.
              </li>
              <li>ارسم تحديداً فوق الشعار (يمكن تحديد أكثر من منطقة).</li>
              <li>
                اضغط <strong>تصدير</strong> عند الانتهاء.
              </li>
              <li>اختر الدقة والصيغة ثم نزّل النتيجة.</li>
            </ol>
          </>
        ),
      },
      {
        id: "remove-logo-mobile",
        question: "هل تعمل أداة إزالة الشعار على الجوال؟",
        answer: (
          <p>
            ليس بالكامل بعد — الأفضل على الكمبيوتر. نعمل على تحسين تجربة الجوال.
          </p>
        ),
      },
      {
        id: "mic-camera",
        question: 'كيف أفعّل الميكروفون أو الكاميرا بعد الضغط على "حظر"؟',
        answer: (
          <>
            <p>
              إذا رفضت إذن الكاميرا/الميكروفون، أعد تفعيله من إعدادات المتصفح لموقع{" "}
              <strong>tool2day.com</strong>.
            </p>
            <p className="mt-4 font-semibold">Google Chrome و Microsoft Edge</p>
            <ol className="mt-2 list-decimal space-y-2 ps-5">
              <li>افتح صفحة Tool2Day التي تحتاج الكاميرا أو الميكروفون.</li>
              <li>اضغط أيقونة القفل (أو معلومات الموقع) يسار شريط العنوان.</li>
              <li>
                اضبط <strong>الكاميرا</strong> / <strong>الميكروفون</strong> على السماح
                (أو السؤال).
              </li>
              <li>أعد تحميل الصفحة.</li>
            </ol>
            <p className="mt-4 font-semibold">Safari (macOS)</p>
            <ol className="mt-2 list-decimal space-y-2 ps-5">
              <li>
                Safari ← <strong>الإعدادات</strong> ← <strong>المواقع</strong>.
              </li>
              <li>
                اختر الكاميرا أو الميكروفون، ابحث عن tool2day.com واضبط على{" "}
                <strong>السماح</strong>.
              </li>
              <li>أعد التحميل ثم حاول مجدداً.</li>
            </ol>
            <p className="mt-4 font-semibold">Mozilla Firefox</p>
            <ol className="mt-2 list-decimal space-y-2 ps-5">
              <li>افتح الموقع واضغط أيقونة القفل في شريط العنوان.</li>
              <li>
                أزل حظر الكاميرا/الميكروفون، أعد التحميل، ثم اسمح عند الطلب.
              </li>
            </ol>
            <p className="mt-4 font-semibold">إذا استمرت المشكلة</p>
            <ul className="mt-2 list-disc space-y-2 ps-5">
              <li>
                اسمح للمتصفح من إعدادات خصوصية النظام (مثلاً macOS ← إعدادات النظام ←
                الخصوصية والأمان).
              </li>
              <li>أغلق التطبيقات/التبويبات الأخرى التي تستخدم الكاميرا أو الميكروفون.</li>
            </ul>
          </>
        ),
      },
      {
        id: "relogin",
        question: "لماذا يُطلب مني تسجيل الدخول مجدداً عند التنقل بين الأدوات؟",
        answer: (
          <>
            <p>
              جلسة الدخول تعتمد على ملفات تعريف الارتباط. وضع التصفح الخاص وإعدادات
              الخصوصية الصارمة غالباً تمسحها أو تمنعها عند التنقل بين الصفحات.
            </p>
            <p className="mt-3">للبقاء مسجّلاً بشكل أفضل:</p>
            <ul className="mt-2 list-disc space-y-2 ps-5">
              <li>تجنّب وضع التصفح الخاص / Incognito</li>
              <li>اسمح بملفات تعريف الارتباط لـ tool2day.com</li>
              <li>عطّل الإضافات التي تحظر ملفات تعريف الارتباط</li>
            </ul>
          </>
        ),
      },
      {
        id: "projects-shared",
        question: "هل تُشارك المشاريع بين محرري الصوت والفيديو أو الأدوات المختلفة؟",
        answer: (
          <p>
            تُخزَّن المشاريع لكل أداة/جلسة في المتصفح ولا تُشارك تلقائياً بين كل أدوات
            Tool2Day. تُحفظ البيانات بشكل منفصل لخصوصية المتصفح وحدود التخزين.
          </p>
        ),
      },
      {
        id: "project-other-computer",
        question:
          "لماذا مشروع أنشأته على جهاز غير متوفر أو ناقص على جهاز آخر؟",
        answer: (
          <>
            <p>
              كثير من أدوات Tool2Day تعالج الملفات داخل المتصفح. قد تبقى الملفات على ذلك
              الجهاز ما لم تُفعَّل مزامنة لحساب مسجّل.
            </p>
            <ul className="mt-3 list-disc space-y-2 ps-5">
              <li>قد لا تكون المزامنة اكتملت قبل تبديل الجهاز</li>
              <li>الجلسات المجانية قد تبقي الملفات محلياً لفترة محدودة فقط</li>
              <li>مشكلة خادم مؤقتة (نادرة)</li>
              <li>اتصال إنترنت غير مستقر يقطع الرفع/المزامنة</li>
            </ul>
          </>
        ),
      },
      {
        id: "timeline-missing",
        question: "لماذا تايملاين محرر الفيديو مفقود أو لا تظهر الملفات؟",
        answer: (
          <>
            <p>غالباً السبب متصفح قديم.</p>
            <ul className="mt-3 list-disc space-y-2 ps-5">
              <li>
                <strong>حدّث المتصفح</strong> إلى أحدث Chrome أو Firefox أو Safari أو Edge.
              </li>
              <li>
                <strong>Windows 7 / 8:</strong> قد يتوقف تحديث Chrome على إصدارات قديمة.
                نفضّل <strong>Firefox</strong> لأنه أكثر توافقاً مع محرر الفيديو لدينا.
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
];

function itemSearchText(item: FaqItem) {
  return `${item.question} ${item.id}`.toLowerCase();
}

export function HelpFaq() {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>("cancel-subscription");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            itemSearchText(item).includes(q) ||
            section.title.toLowerCase().includes(q) ||
            item.question.includes(query.trim()),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold text-[#111] sm:text-4xl">المساعدة</h1>
      <p className="mt-2 text-[#666]">
        إجابات حول الفوترة والحساب والأدوات في Tool2Day. تحتاج مساعدة إضافية؟{" "}
        <Link href="/contact" className="font-medium text-[#2563eb] hover:underline">
          تواصل معنا
        </Link>
        .
      </p>

      <label className="relative mt-8 block">
        <span className="sr-only">بحث في المساعدة</span>
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث..."
          className="w-full rounded-full border border-[#e5e5e5] bg-white py-3 pe-4 ps-10 text-[15px] text-[#222] outline-none ring-[#2563eb]/30 placeholder:text-[#999] focus:border-[#2563eb] focus:ring-2"
        />
      </label>

      <div className="mt-10 space-y-10">
        {filtered.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="mb-4 text-xl font-bold text-[#111]">{section.title}</h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const open = openId === item.id;
                return (
                  <li key={item.id} id={item.id} className="scroll-mt-24">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : item.id)}
                      className="flex w-full items-start gap-2.5 rounded-md px-1 py-3 text-start transition hover:bg-[#f7f7f7]"
                    >
                      <ChevronDown
                        className={`mt-0.5 h-4 w-4 shrink-0 text-[#444] transition-transform duration-200 ${
                          open ? "rotate-0" : "rotate-90"
                        }`}
                      />
                      <span className="text-[15px] font-bold leading-snug text-[#1a1a1a]">
                        {item.question}
                      </span>
                    </button>
                    {open ? (
                      <div className="mb-3 ms-6 rounded-xl bg-[#f3f4f6] px-4 py-4 text-[14px] leading-7 text-[#333] sm:px-5">
                        {item.answer}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {filtered.length === 0 ? (
          <p className="text-[#666]">
            لا نتائج. جرّب كلمة أخرى أو{" "}
            <Link href="/contact" className="font-medium text-[#2563eb] hover:underline">
              تواصل مع الدعم
            </Link>
            .
          </p>
        ) : null}
      </div>

      <p className="mt-12">
        <Link href="/" className="text-sm font-semibold text-[#2563eb] hover:underline">
          ← العودة للصفحة الرئيسية
        </Link>
      </p>
    </div>
  );
}
