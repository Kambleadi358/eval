import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const ADMIN_EMAIL = 'vicharmanch1956@gmail.com';
const DEFAULT_PASSWORD = 'admin123';
const STORAGE_KEY = 'vicharmanch_admin_auth';
const PASSWORD_KEY = 'vicharmanch_admin_pwd';

interface AuthContextType {
  isAdmin: boolean;
  loading: boolean;
  adminEmail: string | null;
  signIn: (email: string, password: string) => { error: string | null };
  signOut: () => void;
  changePassword: (currentPwd: string, newPwd: string) => { error: string | null };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const getStoredPassword = () => localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setIsAdmin(true);
      setAdminEmail(ADMIN_EMAIL);
    }
    setLoading(false);
  }, []);

  const signIn = (email: string, password: string) => {
    const storedPwd = getStoredPassword();
    if (email.toLowerCase().trim() === ADMIN_EMAIL && password === storedPwd) {
      setIsAdmin(true);
      setAdminEmail(ADMIN_EMAIL);
      localStorage.setItem(STORAGE_KEY, 'true');
      return { error: null };
    }
    return { error: 'अवैध क्रेडेन्शियल्स (Invalid credentials)' };
  };

  const signOut = () => {
    setIsAdmin(false);
    setAdminEmail(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const changePassword = (currentPwd: string, newPwd: string) => {
    const storedPwd = getStoredPassword();
    if (currentPwd !== storedPwd) {
      return { error: 'सध्याचा पासवर्ड चुकीचा आहे' };
    }
    if (newPwd.length < 6) {
      return { error: 'नवीन पासवर्ड किमान ६ अक्षरांचा असावा' };
    }
    localStorage.setItem(PASSWORD_KEY, newPwd);
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ isAdmin, loading, adminEmail, signIn, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
