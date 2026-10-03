'use client';

// Confirmation dialog for destructive / important actions (never window.confirm).
//
//   <ConfirmDialog
//     open={!!pending}
//     title={L('Cancel booking?', 'إلغاء الحجز؟')}
//     message={L('The customer will be notified.', 'سيتم إبلاغ العميل.')}
//     confirmLabel={L('Cancel booking', 'إلغاء الحجز')}
//     tone="danger"                      // 'danger' (red) | 'primary' (blue)
//     requireReason                      // optional: a required reason textarea
//     onConfirm={async (reason) => { await updateBookingStatus(id, 'cancelled', { reason }); }}
//     onClose={() => setPending(null)}
//   />
//
// onConfirm may return a promise. While it runs the buttons are disabled, Escape/backdrop do nothing and a
// ref lock stops double submits. When it resolves the dialog calls onClose() itself — unless it returned
// `false` or threw (then it stays open so the caller's error toast can explain what happened).
// Extra optional props: cancelLabel, reasonLabel, reasonPlaceholder, reasonOptional (show the textarea but
// don't require it), defaultReason, busy (external busy flag), children (extra content under the message).

import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { useAdminLang } from '../AdminI18n';
import { useDialogA11y } from './useDialogA11y';

const REASON_MAX = 500;

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  requireReason = false,
  reasonOptional = false,
  reasonLabel,
  reasonPlaceholder,
  defaultReason = '',
  busy: externalBusy = false,
  onConfirm,
  onClose,
  children,
}) {
  const { L, dir } = useAdminLang();
  const [reason, setReason] = useState(defaultReason);
  const [running, setRunning] = useState(false);
  const [touched, setTouched] = useState(false);
  const lock = useRef(false);
  const titleId = useId();
  const messageId = useId();
  const reasonId = useId();

  const busy = running || externalBusy;
  const showReason = requireReason || reasonOptional;
  const reasonMissing = requireReason && reason.trim().length === 0;

  // Fresh state every time it opens
  useEffect(() => {
    if (open) {
      setReason(defaultReason);
      setTouched(false);
      setRunning(false);
      lock.current = false;
    }
  }, [open, defaultReason]);

  const close = () => {
    if (lock.current || externalBusy) return;
    onClose?.();
  };

  const panelRef = useDialogA11y(open, close, { canClose: !busy });

  if (!open) return null;

  const handleConfirm = async (event) => {
    event?.preventDefault();
    if (lock.current || externalBusy) return;
    if (reasonMissing) {
      setTouched(true);
      return;
    }
    lock.current = true;
    setRunning(true);
    let keepOpen = false;
    try {
      const result = await onConfirm?.(showReason ? reason.trim() : undefined);
      keepOpen = result === false;
    } catch {
      keepOpen = true; // the caller shows the error toast
    } finally {
      lock.current = false;
      setRunning(false);
    }
    if (!keepOpen) onClose?.();
  };

  const danger = tone === 'danger';
  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4" dir={dir}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        tabIndex={-1}
        onSubmit={handleConfirm}
        className="relative w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl outline-none sm:rounded-2xl sm:p-6 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {message && (
              <div id={messageId} className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {message}
              </div>
            )}
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}

        {showReason && (
          <div className="mt-4">
            <label htmlFor={reasonId} className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {reasonLabel || L('Reason', 'السبب')}
              {requireReason ? (
                <span className="text-red-600 dark:text-red-400" aria-hidden="true"> *</span>
              ) : (
                <span className="font-normal text-slate-500 dark:text-slate-400"> ({L('optional', 'اختياري')})</span>
              )}
            </label>
            <textarea
              id={reasonId}
              data-autofocus
              rows={3}
              maxLength={REASON_MAX}
              dir="auto"
              value={reason}
              disabled={busy}
              required={requireReason}
              aria-invalid={touched && reasonMissing ? 'true' : undefined}
              aria-describedby={touched && reasonMissing ? `${reasonId}-err` : undefined}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder || L('Write a short reason…', 'اكتب سبباً مختصراً…')}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
            />
            {touched && reasonMissing && (
              <p id={`${reasonId}-err`} className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                {L('Please enter a reason.', 'يرجى كتابة السبب.')}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={close}
            disabled={busy}
            data-autofocus={showReason ? undefined : true}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 sm:min-h-10 sm:pointer-coarse:min-h-11 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cancelLabel || L('Keep it', 'تراجع')}
          </button>
          <button
            type="submit"
            disabled={busy}
            aria-busy={busy || undefined}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:pointer-coarse:min-h-11 ${
              danger ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600' : 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600'
            }`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel || L('Confirm', 'تأكيد')}
          </button>
        </div>
      </form>
    </div>
  );
}

export { ConfirmDialog };
