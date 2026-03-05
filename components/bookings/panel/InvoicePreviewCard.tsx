type Props = {
invoicePreview: any | null;
};

export default function InvoicePreviewCard({ invoicePreview }: Props) {
if (!invoicePreview) return null;

return (
<div
className="p-4 rounded-lg space-y-3"
style={{ border: "1px solid var(--border)" }}
> <h3 className="text-sm font-semibold">Invoice Preview</h3>

  <div className="text-sm">
    {invoicePreview.bookingCount} dates selected
  </div>

  <div className="text-sm">
    {invoicePreview.earliestDate} – {invoicePreview.latestDate}
  </div>

  <div className="border-t pt-2 text-sm">
    {invoicePreview.totalHours} hrs @ ${invoicePreview.hourlyRate}/hr
  </div>

  <div className="text-sm">
    Usage: ${invoicePreview.usageSubtotal}
  </div>

  {/* MONTHLY SERVICES */}

  {invoicePreview.monthlyServices?.map((service: any) => (
    <div key={service.serviceId} className="text-sm">
      {service.quantity} × ${service.rate} monthly service

      {service.alreadyBilled && (
        <span className="text-xs opacity-60 ml-2">
          already billed
        </span>
      )}
    </div>
  ))}

  <div className="border-t pt-2 font-medium text-sm">
    Total: ${invoicePreview.total}
  </div>

  <div className="text-xs opacity-70">
    Due: {invoicePreview.dueDateLabel}
  </div>
</div>

);
}
