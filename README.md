# Suivi de poids — scaffold React Native / Expo

Point de départ du développement, à partir du cahier des charges v1.4 et des maquettes Claude
Design. Ce document explique comment installer, configurer Firebase, lancer l'app, et ce qui
reste à faire.

## Ce qui est déjà fait

- **Thème** (`src/theme/theme.ts`) : couleurs, typographies (Caprasimo / Figtree), espacements,
  rayons et ombres extraits du système « Organic » de Claude Design.
- **Modèles de données** (`src/types/models.ts`) : les six entités du cahier des charges
  (Utilisateur, PeséeMatinale, PassageToilette, Cheatmeal, Grignotage, ContextePériode),
  avec les champs sexe / taille / masquage du poids ajoutés en v1.3-1.4.
- **Règles métier** (`src/utils/businessRules.ts`) : passage de kilogramme entier, moyenne
  mobile et tendances 7/30/90/180/365 jours, calcul de l'IMC, alerte de saignement récurrent,
  fenêtre matinale. Fonctions pures, testées (`src/utils/businessRules.test.ts`, à lancer avec
  `npm test` une fois les dépendances installées).
- **Firebase** (`src/services/firebaseConfig.ts`, `dataService.ts`, `firestore.rules`) : Auth +
  Firestore, structuré en sous-collections `users/{uid}/...` pour que les règles de sécurité
  restreignent chaque utilisateur à ses propres données (section 8.2 du cahier des charges).
- **Notifications** (`src/services/notifications.ts`) : deux rappels quotidiens (9h/10h par
  défaut), annulés automatiquement si la pesée du jour est déjà enregistrée.
- **Navigation et écrans** : onboarding en 3 étapes, tableau de bord, calendrier mensuel,
  tendances, réglages, et les 6 écrans d'action (pesée, toilettes, cheatmeal, grignotage,
  contexte particulier, détail d'une journée).

## Ce qui n'a pas pu être fait ici, et pourquoi

Cet environnement n'a pas d'accès réseau vers les registres npm publics : il n'a donc pas été
possible d'exécuter `npm install`, de lancer `expo start`, ni de faire tourner un vrai
compilateur TypeScript (`tsc`) ou Jest dans ce sandbox. Vérifications faites malgré tout, pour
ne rien livrer à l'aveugle :

- Chaque fichier `.ts`/`.tsx` a été passé dans un parseur (esbuild) pour confirmer l'absence
  d'erreur de syntaxe. Un vrai bug a été trouvé et corrigé de cette façon (un commentaire dans
  `theme.ts` contenant involontairement une séquence `*/`).
- La logique métier (`businessRules.ts`) a été rejouée dans un script Node isolé avec les mêmes
  cas que le fichier de test Jest livré, y compris l'exemple exact du cahier des charges
  (lundi 82,5 kg → vendredi 81,9 kg → marqueur de perte) : tout passe.

Ce que je n'ai **pas** pu vérifier : la cohérence complète des types TypeScript à travers tout
le projet (`tsc --noEmit`), le comportement réel sur un simulateur iOS, et la compatibilité
exacte des versions de dépendances listées dans `package.json` (Expo SDK 57 / React Native 0.86,
à jour en juillet 2026 au moment de la rédaction). **Première chose à faire après `npm
install` : lancer `npx tsc --noEmit` et corriger ce qui remonte.**

## Installation

```bash
npm install
```

## Configurer Firebase

1. Crée un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. Active **Authentication** (méthode e-mail/mot de passe) et **Firestore Database**.
3. Copie la config web (Paramètres du projet > Tes applications > Config SDK) dans
   `src/services/firebaseConfig.ts`, à la place des valeurs `REMPLACE_MOI`.
4. Déploie les règles de sécurité :
   ```bash
   firebase deploy --only firestore:rules
   ```
   (ou colle le contenu de `firestore.rules` directement dans la console Firebase >
   Firestore Database > Règles.)

## Lancer l'app

```bash
npx expo start
```

Puis ouvrir avec l'app **Expo Go** sur iPhone (en scannant le QR code), ou dans un simulateur
iOS si Xcode est installé.

## Prochaines étapes suggérées

- Faire correspondre plus finement chaque écran aux maquettes Claude Design (cet scaffold suit
  leur structure et leurs textes, mais n'a pas reproduit pixel pour pixel toutes les
  micro-interactions : courbe SVG animée, dégradés, etc.).
- Ajouter une vraie courbe de poids (ex. `react-native-svg` déjà en dépendance, ou une
  librairie de graphiques) à la place des indicateurs chiffrés actuels sur `HomeScreen`.
- Écrire une Cloud Function qui supprime les sous-collections Firestore d'un utilisateur
  lorsqu'il supprime son compte (le scaffold supprime le compte Auth, pas encore les données
  Firestore associées — section 8.2 du cahier des charges).
- Ajouter une icône d'app et un écran de démarrage (`assets/`, non fournis dans ce scaffold ;
  `app.json` ne référence pour l'instant aucun fichier d'assets manquant, volontairement).
- Décider Firebase vs. Supabase n'est plus un sujet (Firebase est acté), mais le choix entre
  Zustand et Redux Toolkit pour la gestion d'état plus fine (au-delà du contexte React actuel)
  reste ouvert si l'app grossit.
