import React, { useEffect, useRef } from "react";

interface RejectOrderDialogProps {
  orderNumber: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function RejectOrderDialog({
  orderNumber, busy, error, onCancel, onConfirm,
}: RejectOrderDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      else document.getElementById("operator-queue-title")?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="tt-reject-dialog"
      aria-labelledby="reject-order-title"
      aria-describedby="reject-order-description"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="reject-order-title">Reject order {orderNumber}?</h2>
      <p id="reject-order-description">
        Rejecting this order will restore all reserved items to inventory. This decision cannot be undone.
      </p>
      {error && <p role="alert" className="tt-operator-error">{error}</p>}
      {busy && <p role="status">Rejecting order and restoring inventory...</p>}
      <div className="tt-operator-actions">
        <button ref={cancelRef} type="button" className="tt-btn" disabled={busy} onClick={onCancel}>
          Keep Order
        </button>
        <button type="button" className="tt-btn tt-btn-danger" disabled={busy} onClick={onConfirm}>
          {busy ? "Rejecting..." : "Confirm Rejection"}
        </button>
      </div>
    </dialog>
  );
}
