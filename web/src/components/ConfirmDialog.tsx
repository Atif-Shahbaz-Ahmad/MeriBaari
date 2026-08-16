'use client';

import { useEffect, useId, useRef } from 'react';

import { Button } from '@web/components/ui';

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-full max-w-md rounded-2xl border border-line bg-surface-card p-0 text-ink shadow-soft backdrop:bg-slate-900/50"
      onClose={onCancel}
    >
      <form
        className="space-y-4 p-5"
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm();
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-sm text-ink-secondary">{body}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant={danger ? 'danger' : 'primary'}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
