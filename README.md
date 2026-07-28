# Suivi de poids — app React Native / Expo

Application de suivi de poids sans calories ni objectif chiffré, à partir du cahier des
charges v1.4. Ce document explique comment installer, configurer Firebase, lancer l'app, et ce
qui reste à faire.

## État actuel

L'app tourne réellement (installée, testée sur iPhone via Expo Go, connectée à un vrai projet
Firebase). Les écrans reproduisent la maquette du projet Claude Design « Échelle de Bristol et
calendrier » (fichier `Suivi - maquettes.dc.html`), avec un système de composants et de couleurs
« Organic » (terracotta / sauge, jamais associées à un jugement « bon/mauvais »).

### Ce qui est fait

- **Thème** (`src/theme/theme.ts`) : couleurs, typographies (Caprasimo / Figtree), espacements,
  rayons et ombres extraits du système « Organic », alignés 1:1 avec `styles.css` de la maquette.
- **Modèles de données** (`src/types/models.ts`) : Utilisateur, PeséeMatinale, PassageToilette,
  Cheatmeal, Grignotage, ContextePériode, **SeanceSport**.
- **Règles métier** (`src/utils/businessRules.ts`) : palier de kilogramme, moyenne mobile et
  tendances 7/30/90/180/365 jours, série de moyennes mobiles pour la courbe, delta depuis la
  pesée précédente, calcul de l'IMC, alerte de saignement récurrent, fenêtre matinale. Fonctions
  pures, testées (`src/utils/businessRules.test.ts`, 18 tests — `npm test`).
- **Firebase** (`src/services/firebaseConfig.ts`, `dataService.ts`, `firestore.rules`) : Auth +
  Firestore, structuré en sous-collections `users/{uid}/...` pour que les règles de sécurité
  restreignent chaque utilisateur à ses propres données (section 8.2 du cahier des charges).
  Déjà connecté à un projet Firebase réel (`suivi-de-poids`) ; règles publiées.
- **Notifications** (`src/services/notifications.ts`) : deux rappels quotidiens (9h/10h par
  défaut), annulés automatiquement si la pesée du jour est déjà enregistrée. Fonctionnalité
  limitée sous Expo Go (SDK 53+ a retiré les notifications push d'Expo Go) : à valider dans un
  build de développement (`expo-dev-client`) avant mise en production.
- **Navigation et écrans**, tous alignés sur la maquette :
  - Onboarding en 3 étapes (Bienvenue, Profil, Rituel matinal).
  - Accueil : courbe de poids SVG animée (`src/components/WeightCurve.tsx`, tracé qui se dessine,
    onglets 30j/90j/1an), badges delta/IMC, tendances 7-365j, semaine en cours, progression
    sportive hebdomadaire, actions rapides.
  - Mois : calendrier avec marqueurs (extra, grignotage, sport, kilo perdu/gagné), résumé du
    mois généré à partir des vraies données, contexte en cours.
  - Tendances : écran encore basique (texte uniquement) — la maquette ne couvre pas cet onglet,
    voir « Prochaines étapes ».
  - Réglages : fenêtre matinale/rappels, affichage (poids absolu, sexe, unités, taille),
    zones de mensuration suivies, objectif hebdomadaire de sport, export CSV, compte.
  - Écrans d'action : pesée matinale (stepper de poids), passage aux toilettes (échelle de
    Bristol dessinée à la main, possibilité de dater une entrée passée), extra, grignotage
    (créé en un tap, écran de confirmation en overlay), contexte particulier, séance de sport,
    détail d'une journée.
- **Icônes** (`src/components/icons/`) : jeu d'icônes dessinées à la main reprises de la
  maquette (toilettes, extra, grignotage, contexte, humeurs, échelle de Bristol, niveaux
  d'extra, tracé « Tendances ») ; le reste utilise `lucide-react-native`.
- **Suivi sportif** : séances (intensité léger/modéré/intense, durée 15/30/60 min), objectif
  hebdomadaire réglable (0 à 7, défaut 3), progression affichée sur l'Accueil et marqueur dédié
  dans le calendrier.

### Prochaines étapes suggérées

- **Onglet Tendances** : aucune maquette ne le couvre encore ; à concevoir (probablement une
  vue plus détaillée de la courbe déjà présente sur l'Accueil).
- **Cloud Function de suppression de compte** : la suppression actuelle (Réglages > Supprimer
  mon compte) supprime le compte Firebase Auth mais pas les sous-collections Firestore
  associées (section 8.2 du cahier des charges) — prévoir une Cloud Function déclenchée sur la
  suppression du compte Auth.
- **Icône d'app et écran de démarrage** (`assets/`) : non fournis, `app.json` ne référence
  aucun fichier d'assets manquant volontairement.
- **`npm audit`** signale des vulnérabilités dans les dépendances de test/tooling (pas dans le
  code de l'app) — à trier si besoin.
- Le choix entre Zustand et Redux Toolkit pour la gestion d'état (au-delà du contexte React
  actuel) reste ouvert si l'app grossit ; pas de besoin identifié pour l'instant.

## Installation

```bash
npm install
```

Le projet cible **Expo SDK 54** (React 19.1.0 / React Native 0.81.5) — volontairement pas la
toute dernière version publiée sur npm : au moment de la rédaction, le client **Expo Go**
disponible sur l'App Store ne supporte pas encore les SDK plus récents. Avant de faire évoluer
ces versions, vérifier que la version d'Expo Go installée sur le téléphone de test suit.

Après installation, vérifier que tout est sain :

```bash
npx tsc --noEmit
npm test
```

## Configurer Firebase

Un projet Firebase réel (`suivi-de-poids`) est déjà renseigné dans
`src/services/firebaseConfig.ts`. Pour connecter un autre projet :

1. Crée un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. Active **Authentication** (méthode e-mail/mot de passe) et **Firestore Database**.
3. Copie la config web (Paramètres du projet > Tes applications > Config SDK) dans
   `src/services/firebaseConfig.ts`. Ces valeurs ne sont pas des secrets côté serveur (elles
   sont conçues pour être présentes côté client) : la protection des données repose sur
   `firestore.rules`, pas sur leur confidentialité.
4. Publie les règles de sécurité : colle le contenu de `firestore.rules` dans Console Firebase
   > Firestore Database > Règles > Publier (ou `firebase deploy --only firestore:rules` si le
   CLI Firebase est installé).

## Lancer l'app

```bash
npx expo start
```

Puis ouvrir avec l'app **Expo Go** sur iPhone (en scannant le QR code, ou en saisissant
l'adresse manuellement dans Expo Go), ou dans un simulateur iOS si Xcode est installé.

**Sur Windows, en cas d'erreur de connexion depuis le téléphone** (timeout, "request failed") :
- Le pare-feu Windows doit autoriser Node.js en profil **Privé** sur le réseau utilisé
  (`Get-NetConnectionProfile` pour vérifier la catégorie du réseau Wi-Fi).
- Si la machine a plusieurs interfaces réseau (Wi-Fi + Ethernet), Expo peut choisir la mauvaise
  IP pour son manifest. Forcer l'IP correcte avant de lancer :
  ```bash
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = "<IP locale du PC>"
  npx expo start
  ```
