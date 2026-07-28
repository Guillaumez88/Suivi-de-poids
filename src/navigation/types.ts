/** Paramètres de navigation, pour garder le typage strict sur chaque écran. */

export type OnboardingStackParamList = {
  Bienvenue: undefined;
  Profil: undefined;
  Rituel: undefined;
};

export type TabParamList = {
  Accueil: undefined;
  Mois: undefined;
  Tendances: undefined;
  Reglages: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Principal: undefined;
  PeseeMatinale: undefined;
  PassageToilette: undefined;
  Cheatmeal: undefined;
  Grignotage: undefined;
  ContextePeriode: undefined;
  SeanceSport: undefined;
  VerreEau: undefined;
  DetailJournee: { date: string };
};
