// Service worker Firebase Cloud Messaging — reçoit les notifications push
// pendant que l'app n'est pas au premier plan (ou fermée). Doit être servi
// depuis la racine du champ d'action voulu (voir l'enregistrement dans
// src/services/pushWeb.ts), avec la config Firebase du projet (valeurs
// publiques, sans risque à exposer ici comme dans firebaseConfig.ts).
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBVEK44Ni477yXEPW8IHp0KN1eVTjGMrUA",
  authDomain: "suivi-de-poids.firebaseapp.com",
  projectId: "suivi-de-poids",
  storageBucket: "suivi-de-poids.firebasestorage.app",
  messagingSenderId: "357271601703",
  appId: "1:357271601703:web:f4c0d36ef176e55a530402",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Suivi de poids", {
    body: body || "",
    icon: "/icon-192.png",
  });
});
