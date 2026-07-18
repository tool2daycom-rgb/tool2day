export async function speakText(text: string, lang = "ar-SA") {
  const value = text.trim();
  if (!value) throw new Error("اكتب نصاً للتحويل");
  if (!("speechSynthesis" in window)) {
    throw new Error("المتصفح لا يدعم التحويل إلى كلام");
  }

  await new Promise<void>((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(value);
    utter.lang = lang;
    utter.rate = 1;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("فشل تشغيل الصوت"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
}
