'use client';

// Browser tab titles. The admin layout already sets "<Page> | Admin · Ahmed Cooling" for every sidebar
// page, so pages normally do nothing. A page that needs a more specific title can override it:
//   useAdminTitle(L('Booking ORD-123', 'الحجز ORD-123'));
// (cleared again when the page unmounts or passes a falsy title)

import { createContext, useContext, useEffect, useState } from 'react';

const TitleContext = createContext(null);

export function AdminTitleProvider({ children }) {
  const [override, setOverride] = useState(null);
  return <TitleContext.Provider value={{ override, setOverride }}>{children}</TitleContext.Provider>;
}

export function useAdminTitleOverride() {
  return useContext(TitleContext)?.override || null;
}

export function useAdminTitle(title) {
  const ctx = useContext(TitleContext);
  const setOverride = ctx?.setOverride;
  useEffect(() => {
    if (!setOverride) return undefined;
    setOverride(title || null);
    return () => setOverride(null);
  }, [title, setOverride]);
}

export default useAdminTitle;
