"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SiteKey, SiteConfig, SITES, DEFAULT_SITE } from "@/config/sites";

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
  initialSite,
}: {
  children: React.ReactNode;
  initialSite?: SiteKey;
}) {
  const [siteKey, setSiteKey] = useState<SiteKey>(initialSite ?? DEFAULT_SITE);

  const setSite = (key: SiteKey) => {
    setSiteKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedSite", key);
    }
  };

  useEffect(() => {
    if (!initialSite && typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedSite") as SiteKey | null;
      if (stored && SITES[stored]) setSiteKey(stored);
    }
  }, [initialSite]);

  return (
    <SiteContext.Provider value={{ site: SITES[siteKey], siteKey, setSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);
