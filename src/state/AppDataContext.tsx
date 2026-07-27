import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/services/firebaseConfig";
import {
  getUtilisateur,
  getPesees,
  getPassagesToilette,
  getCheatmeals,
  getGrignotages,
  getContextes,
} from "@/services/dataService";
import type {
  Utilisateur,
  PeseeMatinale,
  PassageToilette,
  Cheatmeal,
  Grignotage,
  ContextePeriode,
} from "@/types/models";

interface AppData {
  utilisateurFirebase: User | null;
  utilisateur: Utilisateur | null;
  pesees: PeseeMatinale[];
  passages: PassageToilette[];
  cheatmeals: Cheatmeal[];
  grignotages: Grignotage[];
  contextes: ContextePeriode[];
  chargement: boolean;
  rafraichir: () => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [utilisateurFirebase, setUtilisateurFirebase] = useState<User | null>(null);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [pesees, setPesees] = useState<PeseeMatinale[]>([]);
  const [passages, setPassages] = useState<PassageToilette[]>([]);
  const [cheatmeals, setCheatmeals] = useState<Cheatmeal[]>([]);
  const [grignotages, setGrignotages] = useState<Grignotage[]>([]);
  const [contextes, setContextes] = useState<ContextePeriode[]>([]);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setUtilisateur(null);
      setPesees([]);
      setPassages([]);
      setCheatmeals([]);
      setGrignotages([]);
      setContextes([]);
      setChargement(false);
      return;
    }
    setChargement(true);
    const [u, p, t, c, g, ctx] = await Promise.all([
      getUtilisateur(uid),
      getPesees(uid),
      getPassagesToilette(uid),
      getCheatmeals(uid),
      getGrignotages(uid),
      getContextes(uid),
    ]);
    setUtilisateur(u);
    setPesees(p);
    setPassages(t);
    setCheatmeals(c);
    setGrignotages(g);
    setContextes(ctx);
    setChargement(false);
  }, []);

  useEffect(() => {
    const desabonner = onAuthStateChanged(auth, (u) => {
      setUtilisateurFirebase(u);
      rafraichir();
    });
    return desabonner;
  }, [rafraichir]);

  return (
    <AppDataContext.Provider
      value={{
        utilisateurFirebase,
        utilisateur,
        pesees,
        passages,
        cheatmeals,
        grignotages,
        contextes,
        chargement,
        rafraichir,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData doit être utilisé sous AppDataProvider");
  return ctx;
}
