'use client';

// Accessible on/off switch (role="switch", 44px touch target).
//   <Switch checked={on} onChange={(next) => …} label="Active" />            // visible label next to it
//   <Switch checked={on} onChange={…} label="Auto-assign" hideLabel />      // label for screen readers only
// `busy` shows the switch as pending (disabled, aria-busy). Works in RTL (the knob moves to the inline end).

import { useId } from 'react';

export default function Switch({ checked, onChange, label, description, hideLabel = false, disabled = false, busy = false, tone = 'blue', className = '' }) {
  const id = useId();
  const on = !!checked;
  const track = on
    ? tone === 'green' ? 'bg-green-600' : tone === 'violet' ? 'bg-violet-600' : 'bg-blue-600'
    : 'bg-slate-300 dark:bg-slate-600';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={hideLabel ? label : undefined}
        aria-labelledby={hideLabel ? undefined : `${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        aria-busy={busy || undefined}
        disabled={disabled || busy}
        onClick={() => onChange?.(!on)}
        className="group -my-1.5 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:cursor-not-allowed"
      >
        <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${track} ${disabled || busy ? 'opacity-60' : ''}`}>
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] ${on ? 'start-[1.375rem]' : 'start-0.5'} ${busy ? 'animate-pulse' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>
      {!hideLabel && (
        <span className="min-w-0">
          <label id={`${id}-l`} htmlFor={id} className="block cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>
          {description && <span id={`${id}-d`} className="block text-xs text-slate-600 dark:text-slate-400">{description}</span>}
        </span>
      )}
      {hideLabel && description && <span id={`${id}-d`} className="sr-only">{description}</span>}
    </div>
  );
}

export { Switch };
