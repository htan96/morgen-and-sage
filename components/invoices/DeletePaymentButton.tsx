"use client";

import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeletePaymentButton({
  paymentId,
}: {
  paymentId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this payment?")) return;

    await fetch(`/api/payments/${paymentId}`, {
      method: "DELETE",
    });

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="inline-flex items-center gap-1 text-sm transition hover:opacity-80"
      style={{ color: "rgb(239,68,68)" }}
    >
      <Trash size={14} />
    </button>
  );
}