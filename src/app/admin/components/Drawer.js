'use client';

// Side drawer (detail panels). Slides in from the inline end (right in English, left in Arabic);
// full width on phones.
//
//   <Drawer open={!!selected} onClose={() => setSelected(null)} title={L('Booking', 'الحجز')}
//           subtitle={booking?.orderNumber} footer={<button …/>} width="max-w-xl">
//     …
//   </Drawer>
//
// role="dialog" + aria-modal, Escape and backdrop click close, focus moves in and returns to the opener.
// Pass canClose={false} while a request inside the drawer is running.

import { useId } from 'react';
import { X } from 'lucide-react';
import { useAdminLang } from '../AdminI18n';
import { useDialogA11y } from './useDialogA11y';

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  headerActions,
  width = 'sm:max-w-xl',
  canClose = true,
}) {
  const { L, dir } = useAdminLang();
  const titleId = useId();
  const close = () => {
    if (canClose) onClose?.();
  };
  const panelRef = useDialogA11y(open, close, { canClose });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir={dir}>
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex h-full w-full ${width} flex-col border-s border-slate-200 bg-white shadow-2xl outline-none dark:border-slate-800 dark:bg-slate-900`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6 dark:border-slate-800">
          <div className="min-w-0 py-1.5">
            <h2 id={titleId} className="truncate text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {subtitle && <div className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{subtitle}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={close}
              disabled={!canClose}
              aria-label={L('Close', 'إغلاق')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">{children}</div>
        {footer && (
          <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-950/60">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}

export { Drawer };
