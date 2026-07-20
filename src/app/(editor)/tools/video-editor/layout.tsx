export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // واجهة المحرر فقط — بدون شريط قوائم الموقع (فيديو/صوت/PDF)
  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#0e0e10]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
