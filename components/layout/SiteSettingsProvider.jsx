'use client';

// Hands the admin's site switches (read on the server in app/layout.jsx) to client components:
// the header and bottom navs, the profile page and the profile menu.
import { createContext, useContext } from 'react';
import { DEFAULT_SITE_SETTINGS } from '@/utils/siteSettings/fetchSiteSettings';

const SiteSettingsContext = createContext(DEFAULT_SITE_SETTINGS);

export function SiteSettingsProvider({ settings, children }) {
  return (
    <SiteSettingsContext.Provider value={settings || DEFAULT_SITE_SETTINGS}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
