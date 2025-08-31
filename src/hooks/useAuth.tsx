import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Faction = "marines" | "seals";

type AuthState = {
  isAuthed: boolean;
  faction: Faction | null;
  setFaction: (f: Faction | null) => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [faction, setFactionState] = useState<Faction | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("faction") as Faction | null;
    if (saved === "marines" || saved === "seals") setFactionState(saved);
  }, []);

  const setFaction = (f: Faction | null) => {
    setFactionState(f);
    if (f) localStorage.setItem("faction", f);
    else localStorage.removeItem("faction");
  };

  const value = useMemo(
    () => ({ isAuthed: !!faction, faction, setFaction }),
    [faction]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}