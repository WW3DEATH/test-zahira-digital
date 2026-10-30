import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SchoolSetting } from '../types';
import { SEED_SETTING } from '../services/dataService';

interface SiteConfigContextType {
  siteConfig: SchoolSetting;
  loading: boolean;
  updateSiteConfig: (newValues: Partial<SchoolSetting>) => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  siteConfig: SEED_SETTING,
  loading: true,
  updateSiteConfig: async () => {},
});

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteConfig, setSiteConfig] = useState<SchoolSetting>(SEED_SETTING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configDocRef = doc(db, 'schoolSettings', 'main-settings');
    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSiteConfig({ ...SEED_SETTING, ...(snapshot.data() as SchoolSetting) });
        } else {
          // Initialize in Firestore if not present
          setDoc(configDocRef, SEED_SETTING, { merge: true }).catch(console.warn);
          setSiteConfig(SEED_SETTING);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Site config snapshot error, using cached seed settings:', error);
        setSiteConfig(SEED_SETTING);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSiteConfig = async (newValues: Partial<SchoolSetting>) => {
    const updated = { ...siteConfig, ...newValues };
    setSiteConfig(updated);
    const configDocRef = doc(db, 'schoolSettings', 'main-settings');
    await setDoc(configDocRef, updated, { merge: true });
  };

  return (
    <SiteConfigContext.Provider value={{ siteConfig, loading, updateSiteConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);
