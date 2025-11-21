import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Configuration "Startup du Mois"
export const STARTUP_OF_MONTH_CONFIG = {
  basePrice: 15000, // Prix de base (FCFA)
  peakMonthPrice: 25000, // Prix haute saison (décembre, juin)
  duration: 30 * 24 * 60 * 60 * 1000, // 30 jours
  benefits: [
    '🎯 Bannière en page d\'accueil pendant 1 mois',
    '📖 Story dédiée mise en avant',
    '📧 Email à tous les utilisateurs inscrits',
    '🏆 Badge "Startup du mois" sur votre profil',
    '✍️ Article de blog complet sur votre startup',
    '📱 Post sur les réseaux sociaux de PipoMarket',
    '🎙️ Interview vidéo/audio (optionnel)',
    '📊 Rapport de performance à la fin du mois',
  ],
  expectedResults: {
    profileViews: '+500%',
    productViews: '+300%',
    orders: '+200%',
    followers: '+150',
  },
};

/**
 * Calculer le prix en fonction du mois
 */
export const calculatePrice = (month) => {
  // Mois de haute saison (décembre = 12, juin = 6)
  const peakMonths = [6, 12];
  const currentMonth = month || new Date().getMonth() + 1;

  return peakMonths.includes(currentMonth)
    ? STARTUP_OF_MONTH_CONFIG.peakMonthPrice
    : STARTUP_OF_MONTH_CONFIG.basePrice;
};

/**
 * Candidater pour "Startup du Mois"
 */
export const applyForStartupOfMonth = async (startupId, applicationData) => {
  try {
    const {
      month, // Mois ciblé (1-12)
      year, // Année
      motivation, // Texte de motivation
      paymentMethod,
    } = applicationData;

    // Vérifier que la startup existe
    const startupDoc = await getDoc(doc(db, 'startups', startupId));
    if (!startupDoc.exists()) {
      throw new Error('Startup introuvable');
    }

    const startup = startupDoc.data();

    // Vérifier qu'il n'y a pas déjà une startup du mois pour cette période
    const existing = await getStartupOfMonth(month, year);
    if (existing) {
      throw new Error(`Il y a déjà une "Startup du mois" pour ${month}/${year}`);
    }

    const price = calculatePrice(month);
    const startDate = new Date(year, month - 1, 1); // Premier jour du mois
    const endDate = new Date(year, month, 0); // Dernier jour du mois

    const application = {
      startupId,
      startupName: startup.name,
      startupLogo: startup.logo || '🏪',
      month,
      year,
      price,
      motivation,
      status: 'pending', // pending, approved, rejected, active, completed
      paymentMethod,
      paymentStatus: 'pending',
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      benefits: STARTUP_OF_MONTH_CONFIG.benefits,
      stats: {
        profileViews: 0,
        productViews: 0,
        orders: 0,
        newFollowers: 0,
        emailOpens: 0,
        socialEngagement: 0,
      },
    };

    const applicationRef = await addDoc(collection(db, 'startupOfMonth'), application);

    // Créer une transaction de paiement
    await addDoc(collection(db, 'payments'), {
      type: 'startup_of_month',
      applicationId: applicationRef.id,
      startupId,
      amount: price,
      method: paymentMethod,
      status: 'pending',
      description: `Startup du mois - ${month}/${year}`,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Candidature "Startup du mois" créée:', applicationRef.id);
    return {
      success: true,
      applicationId: applicationRef.id,
      price,
      message: `Candidature soumise pour ${price.toLocaleString()} FCFA. En attente d'approbation.`,
    };
  } catch (error) {
    console.error('❌ Erreur candidature Startup du mois:', error);
    throw error;
  }
};

/**
 * Obtenir la "Startup du Mois" actuelle
 */
export const getCurrentStartupOfMonth = async () => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return await getStartupOfMonth(currentMonth, currentYear);
  } catch (error) {
    console.error('❌ Erreur récupération Startup du mois actuelle:', error);
    return null;
  }
};

/**
 * Obtenir la "Startup du Mois" pour un mois/année spécifique
 */
export const getStartupOfMonth = async (month, year) => {
  try {
    const q = query(
      collection(db, 'startupOfMonth'),
      where('month', '==', month),
      where('year', '==', year),
      where('status', 'in', ['active', 'approved']),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error('❌ Erreur récupération Startup du mois:', error);
    return null;
  }
};

/**
 * Approuver une candidature (admin)
 */
export const approveApplication = async (applicationId) => {
  try {
    await updateDoc(doc(db, 'startupOfMonth', applicationId), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Activer automatiquement si c'est le mois en cours
    const applicationDoc = await getDoc(doc(db, 'startupOfMonth', applicationId));
    const application = applicationDoc.data();
    const now = new Date();
    const applicationMonth = application.month;
    const applicationYear = application.year;

    if (
      applicationMonth === now.getMonth() + 1 &&
      applicationYear === now.getFullYear()
    ) {
      await activateStartupOfMonth(applicationId);
    }

    console.log('✅ Candidature approuvée:', applicationId);
    return { success: true, message: 'Candidature approuvée' };
  } catch (error) {
    console.error('❌ Erreur approbation candidature:', error);
    throw error;
  }
};

/**
 * Activer une "Startup du Mois"
 */
export const activateStartupOfMonth = async (applicationId) => {
  try {
    const applicationDoc = await getDoc(doc(db, 'startupOfMonth', applicationId));
    if (!applicationDoc.exists()) {
      throw new Error('Candidature introuvable');
    }

    const application = applicationDoc.data();

    // Mettre à jour le statut
    await updateDoc(doc(db, 'startupOfMonth', applicationId), {
      status: 'active',
      activatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Ajouter le badge sur le profil de la startup
    await updateDoc(doc(db, 'startups', application.startupId), {
      badges: {
        startupOfMonth: {
          active: true,
          month: application.month,
          year: application.year,
        },
      },
      updatedAt: serverTimestamp(),
    });

    // TODO: Envoyer email aux utilisateurs
    // TODO: Créer post réseaux sociaux
    // TODO: Créer article de blog

    console.log('✅ Startup du mois activée:', applicationId);
    return { success: true, message: 'Startup du mois activée' };
  } catch (error) {
    console.error('❌ Erreur activation Startup du mois:', error);
    throw error;
  }
};

/**
 * Marquer comme terminée (fin du mois)
 */
export const completeStartupOfMonth = async (applicationId) => {
  try {
    const applicationDoc = await getDoc(doc(db, 'startupOfMonth', applicationId));
    if (!applicationDoc.exists()) {
      throw new Error('Candidature introuvable');
    }

    const application = applicationDoc.data();

    // Mettre à jour le statut
    await updateDoc(doc(db, 'startupOfMonth', applicationId), {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Retirer le badge actif (garder historique)
    await updateDoc(doc(db, 'startups', application.startupId), {
      'badges.startupOfMonth.active': false,
      updatedAt: serverTimestamp(),
    });

    // TODO: Générer rapport de performance
    // TODO: Envoyer rapport à la startup

    console.log('✅ Startup du mois terminée:', applicationId);
    return { success: true, message: 'Startup du mois terminée' };
  } catch (error) {
    console.error('❌ Erreur complétion Startup du mois:', error);
    throw error;
  }
};

/**
 * Enregistrer une vue de profil (stat)
 */
export const trackProfileView = async (applicationId) => {
  try {
    const applicationRef = doc(db, 'startupOfMonth', applicationId);
    const applicationDoc = await getDoc(applicationRef);

    if (applicationDoc.exists()) {
      const currentViews = applicationDoc.data().stats?.profileViews || 0;
      await updateDoc(applicationRef, {
        'stats.profileViews': currentViews + 1,
      });
    }
  } catch (error) {
    console.error('❌ Erreur tracking vue profil:', error);
  }
};

/**
 * Obtenir les statistiques d'une campagne
 */
export const getApplicationStats = async (applicationId) => {
  try {
    const applicationDoc = await getDoc(doc(db, 'startupOfMonth', applicationId));
    if (!applicationDoc.exists()) {
      throw new Error('Candidature introuvable');
    }

    const application = applicationDoc.data();
    const stats = application.stats || {};

    return {
      profileViews: stats.profileViews || 0,
      productViews: stats.productViews || 0,
      orders: stats.orders || 0,
      newFollowers: stats.newFollowers || 0,
      emailOpens: stats.emailOpens || 0,
      socialEngagement: stats.socialEngagement || 0,
      roi: calculateROI(application.price, stats.orders),
    };
  } catch (error) {
    console.error('❌ Erreur stats candidature:', error);
    return null;
  }
};

/**
 * Calculer le ROI
 */
const calculateROI = (investment, orders) => {
  // Supposons une valeur moyenne de commande de 15 000 FCFA
  const averageOrderValue = 15000;
  const revenue = orders * averageOrderValue;
  const roi = ((revenue - investment) / investment) * 100;
  return parseFloat(roi.toFixed(2));
};

/**
 * Calculer les revenus "Startup du mois"
 */
export const getStartupOfMonthRevenue = async (startDate, endDate) => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('type', '==', 'startup_of_month'),
      where('status', '==', 'completed'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(paymentsQuery);

    let totalRevenue = 0;
    let count = 0;

    snapshot.forEach((doc) => {
      const payment = doc.data();
      totalRevenue += payment.amount;
      count++;
    });

    return {
      totalRevenue,
      count,
      averageValue: count > 0 ? totalRevenue / count : 0,
    };
  } catch (error) {
    console.error('❌ Erreur calcul revenus Startup du mois:', error);
    return null;
  }
};

/**
 * Vérifier et activer/compléter les campagnes selon la date
 */
export const checkStartupOfMonthStatus = async () => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Chercher les campagnes approuvées pour ce mois
    const approvedQuery = query(
      collection(db, 'startupOfMonth'),
      where('month', '==', currentMonth),
      where('year', '==', currentYear),
      where('status', '==', 'approved')
    );

    const approvedSnapshot = await getDocs(approvedQuery);
    for (const doc of approvedSnapshot.docs) {
      await activateStartupOfMonth(doc.id);
    }

    // Chercher les campagnes actives du mois précédent
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const activeQuery = query(
      collection(db, 'startupOfMonth'),
      where('month', '==', lastMonth),
      where('year', '==', lastMonthYear),
      where('status', '==', 'active')
    );

    const activeSnapshot = await getDocs(activeQuery);
    for (const doc of activeSnapshot.docs) {
      await completeStartupOfMonth(doc.id);
    }

    console.log('✅ Vérification Startup du mois effectuée');
  } catch (error) {
    console.error('❌ Erreur vérification Startup du mois:', error);
  }
};

export default {
  STARTUP_OF_MONTH_CONFIG,
  calculatePrice,
  applyForStartupOfMonth,
  getCurrentStartupOfMonth,
  getStartupOfMonth,
  approveApplication,
  activateStartupOfMonth,
  completeStartupOfMonth,
  trackProfileView,
  getApplicationStats,
  getStartupOfMonthRevenue,
  checkStartupOfMonthStatus,
};