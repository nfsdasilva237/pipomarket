
import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Définir la startup du mois
 */
export async function setStartupOfMonth(startupId, startupName, startupLogo, amount) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const startupOfMonthData = {
      startupId,
      startupName,
      startupLogo,
      amount,
      month,
      year,
      impressions: 0,
      clicks: 0,
      active: true,
      setAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Utiliser un ID basé sur le mois et l'année
    const docId = `${year}-${month.toString().padStart(2, '0')}`;
    
    await setDoc(doc(db, 'startup_of_month', docId), startupOfMonthData);

    console.log('✅ Startup du mois définie:', startupName);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur définition startup du mois:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer la startup du mois actuelle
 */
export async function getCurrentStartupOfMonth() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const docId = `${year}-${month.toString().padStart(2, '0')}`;

    const docRef = doc(db, 'startup_of_month', docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    console.error('❌ Erreur récupération startup du mois:', error);
    return null;
  }
}

/**
 * Enregistrer une impression
 */
export async function trackStartupOfMonthImpression() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const docId = `${year}-${month.toString().padStart(2, '0')}`;

    const docRef = doc(db, 'startup_of_month', docId);
    
    await setDoc(docRef, {
      impressions: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur tracking impression:', error);
    return { success: false };
  }
}

/**
 * Enregistrer un clic
 */
export async function trackStartupOfMonthClick() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const docId = `${year}-${month.toString().padStart(2, '0')}`;

    const docRef = doc(db, 'startup_of_month', docId);
    
    await setDoc(docRef, {
      clicks: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur tracking clic:', error);
    return { success: false };
  }
}

/**
 * Récupérer l'historique des startups du mois
 */
export async function getStartupOfMonthHistory() {
  try {
    const querySnapshot = await getDocs(collection(db, 'startup_of_month'));
    const history = [];

    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Trier par année et mois (plus récent en premier)
    history.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    return history;
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    return [];
  }
}

/**
 * Obtenir les statistiques
 */
export async function getStartupOfMonthStats() {
  try {
    const history = await getStartupOfMonthHistory();

    const stats = {
      totalMonths: history.length,
      totalRevenue: history.reduce((sum, h) => sum + (h.amount || 0), 0),
      totalImpressions: history.reduce((sum, h) => sum + (h.impressions || 0), 0),
      totalClicks: history.reduce((sum, h) => sum + (h.clicks || 0), 0),
      averageCTR: 0,
    };

    if (stats.totalImpressions > 0) {
      stats.averageCTR = (stats.totalClicks / stats.totalImpressions) * 100;
    }

    return stats;
  } catch (error) {
    console.error('❌ Erreur stats startup du mois:', error);
    return null;
  }
}