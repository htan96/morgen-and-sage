"use client";

export default function PrintButton() {
  return (
    <div className="mt-10 text-center">
      <button
        onClick={() => window.print()}
        className="px-6 py-3 bg-black text-white rounded-lg"
      >
        Print / Download PDF
      </button>
    </div>
  );
}