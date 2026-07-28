// Complète `dist/` après `expo export --platform web` :
//
// 1. Ajoute les balises PWA (manifest, icônes) à index.html — l'export Metro
//    d'Expo ne les génère pas lui-même (contrairement à l'ancien build web
//    basé sur webpack), il faut donc les ajouter à la main pour qu'"Ajouter
//    à l'écran d'accueil" sur iOS fonctionne correctement.
//
// 2. Réécrit tous les chemins absolus ("/assets/...", "/_expo/...",
//    "/manifest.json", etc.) pour les préfixer par BASE_PATH. Nécessaire
//    car le dépôt est publié sur GitHub Pages en tant que "project page"
//    (https://<compte>.github.io/<dépôt>/), pas à la racine du domaine —
//    Expo génère ces chemins en absolu depuis la racine, sans option native
//    dans cette version pour les préfixer par un sous-chemin.
const fs = require("fs");
const path = require("path");

const BASE_PATH = process.env.WEB_BASE_PATH || "/Suivi-de-poids";
const distDir = path.join(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");
const manifestPath = path.join(distDir, "manifest.json");

// --- 1. Balises PWA dans index.html (chemins encore non préfixés à ce stade) ---
let html = fs.readFileSync(indexPath, "utf8");
if (!html.includes('rel="manifest"')) {
  const tags = `
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Suivi poids">
</head>`;
  html = html.replace("</head>", tags);
}

// --- 2. Préfixage de tous les chemins absolus (src="/...", href="/...") en une seule passe ---
html = html.replace(/(src|href)="\/(?!\/)/g, `$1="${BASE_PATH}/`);
fs.writeFileSync(indexPath, html);

// --- 3. manifest.json : icônes ---
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.start_url = `${BASE_PATH}/`;
manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: `${BASE_PATH}${icon.src}` }));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// --- 4. Bundle(s) JS : chemins "/assets/..." (registre d'assets Metro) et
//        "/_expo/..." (chargement des chunks des imports dynamiques) ---
const jsDir = path.join(distDir, "_expo", "static", "js", "web");
for (const file of fs.readdirSync(jsDir)) {
  if (!file.endsWith(".js")) continue;
  const filePath = path.join(jsDir, file);
  let js = fs.readFileSync(filePath, "utf8");
  js = js.split('"/assets/').join(`"${BASE_PATH}/assets/`);
  js = js.split('"/_expo/').join(`"${BASE_PATH}/_expo/`);
  fs.writeFileSync(filePath, js);
}

// --- 5. Service worker FCM : chemin de l'icône de notification ---
const swPath = path.join(distDir, "firebase-messaging-sw.js");
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, "utf8");
  fs.writeFileSync(swPath, sw.replace('"/icon-192.png"', `"${BASE_PATH}/icon-192.png"`));
}

console.log(`postbuild-web: chemins préfixés par ${BASE_PATH}, balises PWA ajoutées.`);
