      
   

// ==========================================
// FIREBASE CONFIGURATION - PIPOMARKET
// ==========================================
// TODO: Remplacez avec VOS propres clés Firebase
// Allez sur: https://console.firebase.google.com

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ==========================================
// CONFIGURATION FIREBASE
// TODO: REMPLACEZ CES VALEURS !
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDQj6FfYH2EDP8qDYRXL9QKJOod5Q_Y2p4",
  authDomain: "pipomarket-4da97.firebaseapp.com",
  projectId: "pipomarket-4da97",
  storageBucket: "pipomarket-4da97.appspot.com",
  messagingSenderId: "259564310935",
  appId: "1:259564310935:web:25022fcc0b15077ad1b4d2",
  measurementId: "G-EEF0VJW9WS"
};


// ==========================================
// INSTRUCTIONS POUR OBTENIR VOS CLÉS:
// ==========================================
// 1. Allez sur: https://console.firebase.google.com
// 2. Créez un projet "PipoMarket"
// 3. Allez dans: Paramètres du projet (⚙️) > Général
// 4. Descendez jusqu'à "Vos applications"
// 5. Cliquez sur l'icône Web (</>)
// 6. Copiez la configuration (firebaseConfig)
// 7. COLLEZ ICI en remplaçant les valeurs ci-dessus
// ==========================================

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


// Export app
export default app;
// ==========================================
// STRUCTURE DE LA BASE DE DONNÉES
// ==========================================
// Collections:
// - users: {email, fullName, phone, role, startupId?, createdAt}
// - startups: {name, ownerId, category, verified, approved, createdAt}
// - products: {startupId, name, price, stock, available, imageUrl}
// - orders: {userId, items, total, status, deliveryInfo, createdAt}
