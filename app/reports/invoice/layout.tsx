export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[1100px] px-16 py-20">
        {children}
      </div>
    </div>
  );
}