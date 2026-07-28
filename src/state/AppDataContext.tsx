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
  getSeancesSport,
  getConsommationsEau,
} from "@/services/dataService";
import type {
  Utilisateur,
  PeseeMatinale,
  PassageToilette,
  Cheatmeal,
  Grignotage,
  ContextePeriode,
  SeanceSport,
  ConsommationEau,
} from "@/types/models";

interface AppData {
  utilisateurFirebase: User | null;
  utilisateur: Utilisateur | null;
  pesees: PeseeMatinale[];
  passages: PassageToilette[];
  cheatmeals: Cheatmeal[];
  grignotages: Grignotage[];
  contextes: ContextePeriode[];
  seancesSport: SeanceSport[];
  consommationsEau: ConsommationEau[];
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
  const [seancesSport, setSeancesSport] = useState<SeanceSport[]>([]);
  const [consommationsEau, setConsommationsEau] = useState<ConsommationEau[]>([]);
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
      setSeancesSport([]);
      setConsommationsEau([]);
      setChargement(false);
      return;
    }
    // Ne repasse pas `chargement` à true ici : ce booléen ne doit gater que le
    // tout premier chargement (RootNavigator affiche un plein écran de
    // chargement tant qu'il est true, ce qui démonte/remonte toute la
    // navigation — un rafraîchissement après une simple modification de
    // réglage ne doit jamais faire ça, sous peine de renvoyer l'utilisateur
    // sur le premier onglet à chaque enregistrement).
    const [u, p, t, c, g, ctx, s, eau] = await Promise.all([
      getUtilisateur(uid),
      getPesees(uid),
      getPassagesToilette(uid),
      getCheatmeals(uid),
      getGrignotages(uid),
      getContextes(uid),
      getSeancesSport(uid),
      getConsommationsEau(uid),
    ]);
    setUtilisateur(u);
    setPesees(p);
    setPassages(t);
    setCheatmeals(c);
    setGrignotages(g);
    setContextes(ctx);
    setSeancesSport(s);
    setConsommationsEau(eau);
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
        seancesSport,
        consommationsEau,
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
