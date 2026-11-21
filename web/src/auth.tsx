import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, getToken, Me, setToken, setUnauthorizedHandler } from "./api";

interface AuthState {
  /* undefined while the saved session is being checked */
  me: Me | null | undefined;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(getToken() ? undefined : null);

  const signOut = useCallback(() => {
    setToken(null);
    setMe(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setMe(null);
      return;
    }
    try {
      setMe(await api.me());
    } catch {
      signOut();
    }
  }, [signOut]);

  const signIn = useCallback(
    async (token: string) => {
      setToken(token);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    refresh();
  }, [refresh, signOut]);

  const value = useMemo(() => ({ me, signIn, signOut, refresh }), [me, signIn, signOut, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
