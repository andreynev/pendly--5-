// Public Firebase web config. These values are not secrets: they identify the
// project and ship with every web app. Data is protected by firestore.rules.
const HOSTING_DOMAINS = ['pendly-c0b1f.web.app', 'pendly-c0b1f.firebaseapp.com'];

// Sign-in must run on the same domain the app is served from: mobile Safari and
// Chrome partition storage per site, so a redirect through another domain loses
// the result and the user lands back on the login screen. Firebase Hosting
// serves the auth handler (/__/auth/*) on every hosting domain.
const authDomain = typeof window !== 'undefined' && HOSTING_DOMAINS.includes(window.location.hostname)
    ? window.location.hostname
    : 'pendly-c0b1f.firebaseapp.com';

export const firebaseConfig = {
    apiKey: "AIzaSyDHb8v0QS3lb4e-dlfQ_4lOIlidW_CGf7I",
    authDomain,
    projectId: "pendly-c0b1f",
    storageBucket: "pendly-c0b1f.firebasestorage.app",
    messagingSenderId: "404002811557",
    appId: "1:404002811557:web:f4e989a9a30cf9fdda674c",
};
