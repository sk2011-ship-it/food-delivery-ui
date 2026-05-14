"use client";

import React, { createContext, useContext } from "react";
import { SiteKey, SiteConfig, SITES, DEFAULT_SITE } from "@/config/sites";
import { useConfigStore } from "@/store/useConfigStore";

interface SiteContextType {
  site: SiteConfig;
  siteKey: SiteKey;
  setSite: (key: SiteKey) => void;
}

const SiteContext = createContext<SiteContextType>({
  site: SITES[DEFAULT_SITE],
  siteKey: DEFAULT_SITE,
  setSite: () => {},
});

export function SiteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = useConfigStore((state) => state.site);
  const setSiteInStore = useConfigStore((state) => state.setSite);
  const siteKey = site.key;

  const setSite = (key: SiteKey) => {
    setSiteInStore(key);
  };

  return (
    <SiteContext.Provider value={{ site, siteKey, setSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);
