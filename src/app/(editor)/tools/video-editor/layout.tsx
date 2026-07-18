export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#0e0e10]">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
