// [firebase-messaging-sw.js]
// This file enables background notifications for Firebase Cloud Messaging in the web app.

importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDmKBa-JLJlg81yRlnttnji3RkLPBEGP-g",
  authDomain: "fir-setup-3286f.firebaseapp.com",
  projectId: "fir-setup-3286f",
  storageBucket: "fir-setup-3286f.appspot.com",
  messagingSenderId: "1037243626226",
  appId: "1:1037243626226:web:718bca97daf5e8195d166b",
  measurementId: "G-JC536RPSMT"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
