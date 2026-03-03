"use client";

import { useState } from "react";
import { TenantService } from "./types";

type Props = {
  item: TenantService;
  onUpdate: (
    id: string,
    amount: number,
    frequency: string,
    quantity: number
  ) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, current: boolean) => void;
};

export default function TenantServiceRow({
  item,
  onUpdate,
  onDelete,
  onToggleStatus,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(item.amount);
  const [frequency, setFrequency] = useState(item.frequency);
  const [quantity, setQuantity] = useState(item.quantity);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  return (
    <tr className="border-t border-[var(--border)] hover:bg-[var(--hover)] transition-colors">

      {/* ✅ FIXED SERVICE NAME */}
      <td className="px-6 py-4 font-medium text-[var(--text)]">
        {item.services?.[0]?.name || "Unknown"}
      </td>

      {/* Amount */}
      <td className="px-6 py-4">
        {editing ? (
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="ui-input"
          />
        ) : (
          <span className="text-[var(--text)]">
            {formatCurrency(amount)}
          </span>
        )}
      </td>

      {/* Frequency */}
      <td className="px-6 py-4">
        {editing ? (
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="ui-input"
          >
            <option value="per_booking">Per Booking</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
            <option value="one_time">One Time</option>
          </select>
        ) : (
          <span className="text-[var(--text)] capitalize">
            {frequency.replace("_", " ")}
          </span>
        )}
      </td>

      {/* Quantity */}
      <td className="px-6 py-4 text-[var(--text)]">
        {editing ? (
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="ui-input"
          />
        ) : (
          quantity
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <button
          onClick={() => onToggleStatus(item.id, item.is_active)}
          className={`ui-btn ${
            item.is_active ? "ui-btn-edit" : "ui-btn-delete"
          }`}
        >
          {item.is_active ? "Active" : "Inactive"}
        </button>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end items-center gap-4">

          {editing ? (
            <>
              <button
                onClick={() => {
                  onUpdate(item.id, amount, frequency, quantity);
                  setEditing(false);
                }}
                className="ui-btn-filled-save"
              >
                Save
              </button>

              <button
                onClick={() => setEditing(false)}
                className="ui-btn ui-btn-cancel"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="ui-btn ui-btn-edit"
              >
                Edit
              </button>

              <button
                onClick={() => onDelete(item.id)}
                className="ui-btn ui-btn-delete"
              >
                Delete
              </button>
            </>
          )}

        </div>
      </td>

    </tr>
  );
}