'use client';

import { useCallback, useState } from 'react';

// Login fields must start empty: the browser may not pre-fill saved emails/passwords (or tint them grey).
// Browsers ignore autocomplete="off" on login forms, but they never auto-fill a read-only field, so the
// fields stay read-only until the person touches one of them.
//   const noAutofill = useNoAutofill();
//   <input {...noAutofill('email')} ... />   <input {...noAutofill('password')} ... />
export function useNoAutofill() {
  const [locked, setLocked] = useState(true);
  const unlock = useCallback(() => setLocked(false), []);

  return useCallback(
    (kind) => ({
      readOnly: locked,
      onFocus: unlock,
      onPointerDown: unlock, // before focus, so the phone keyboard opens on the first tap
      autoComplete: kind === 'password' ? 'new-password' : 'off',
      'data-lpignore': 'true', // LastPass
      'data-1p-ignore': 'true', // 1Password
      'data-form-type': 'other', // Dashlane
    }),
    [locked, unlock]
  );
}
