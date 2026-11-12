import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText: string;
  loading: boolean;              // the action is on its way → both buttons wait
  onConfirm: () => void;
  onCancel: () => void;
}

// "Are you sure?" window. Cancel (or Escape, or a click outside) does nothing.
export default function ConfirmDialog({ title, message, confirmText, loading, onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // the safe button gets the focus — pressing Enter by mistake does not delete
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [loading, onCancel]);

  return (
    <div className="dialog-backdrop" onClick={() => !loading && onCancel()}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-message">{message}</p>

        <div className="dialog-actions">
          <button ref={cancelRef} className="btn btn-light" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-delete" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
