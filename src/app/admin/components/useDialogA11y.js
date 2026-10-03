'use client';

// Shared behaviour for every admin modal / drawer:
// - focus moves into the panel when it opens and goes back to the opener when it closes
// - Tab / Shift+Tab stay inside the panel
// - Escape closes (unless `canClose` is false, e.g. while a request is running)
// - the page behind does not scroll

import { useEffect, useRef } from 'react';

// Open dialogs, newest last: only the top one reacts to Escape / Tab (a ConfirmDialog over a Drawer)
const stack = [];

const FOCUSABLE ='a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogA11y(open, onClose, { canClose = true, initialFocusRef } = {}) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(canClose);
  onCloseRef.current = onClose;
  canCloseRef.current = canClose;

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const panel = panelRef.current;

    const focusFirst = () => {
      const target = initialFocusRef?.current || panel?.querySelector('[data-autofocus]') || panel?.querySelector(FOCUSABLE) || panel;
      target?.focus?.({ preventScroll: true });
    };
    // Wait one frame so the panel is painted before focusing
    const raf = requestAnimationFrame(focusFirst);

    const token = {};
    stack.push(token);

    const onKeyDown = (event) => {
      if (stack[stack.length - 1] !== token) return;
      if (event.key === 'Escape') {
        if (canCloseRef.current) {
          event.stopPropagation();
          onCloseRef.current?.();
        }
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      const index = stack.indexOf(token);
      if (index !== -1) stack.splice(index, 1);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [open, initialFocusRef]);

  return panelRef;
}

export default useDialogA11y;
