'use client';

import { useEffect, useState } from 'react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(window.localStorage.getItem('careerset-cookie-consent') !== 'dismissed'), []);
  if (!visible) return null;
  return <aside className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 border border-[#cfe0f5] bg-white p-4 shadow-lg sm:left-auto sm:max-w-md"><p className="text-sm leading-5 text-slate-600">This site uses essential browser storage for authentication and preferences. No optional tracking is enabled by this notice.</p><button type="button" className="self-start rounded bg-[#1559c7] px-4 py-2 text-sm font-semibold text-white" onClick={() => { window.localStorage.setItem('careerset-cookie-consent', 'dismissed'); setVisible(false); }}>Dismiss</button></aside>;
}
