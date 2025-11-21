import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Numéros de paiement Mobile Money
export const PAYMENT_NUMBERS = {
  orange: '695 123 456',
  mtn: '677 987 654',
};

// Types de boost disponibles
export const BOOST_TYPES = {
  BOOST_24H: {
    id: 'boost_24h',
    name: 'Boost 24 heures',
    duration: 24 * 60 * 60 * 1000,
    price: 500,
    description: 'Votre produit en avant pendant 24h',
    features: [
      'Apparaît en premier dans les résultats',
      'Badge "⭐ Mis en avant"',
      'Visibilité maximale'
    ]
  },
  BOOST_7D: {
    id: 'boost_7d',
    name: 'Boost 7 jours',
    duration: 7 * 24 * 60 * 60 * 1000,
    price: 2000,
    description: 'Votre produit en avant pendant 1 semaine',
    features: [
      'Apparaît en premier pendant 7 jours',
      'Badge "⭐ Mis en avant"',
      'Économisez 1500 FCFA vs 7×24h'
    ],
    savings: 1500
  },
  BOOST_30D: {
    id: 'boost_30d',
    name: 'Boost 30 jours',
    duration: 30 * 24 * 60 * 60 * 1000,
    price: 5000,
    description: 'Votre produit en avant pendant 1 mois',
    features: [
      'Apparaît en premier pendant 30 jours',
      'Badge "⭐ Mis en avant"',
      'Économisez 10000 FCFA vs 30×24h'
    ],
    savings: 10000
  },
  FEATURED_BADGE: {
    id: 'featured_badge',
    name: 'Badge Coup de Cœur',
    duration: 7 * 24 * 60 * 60 * 1000,
    price: 1000,
    description: 'Badge "💝 Coup de cœur" sur votre produit',
    features: [
      'Badge spécial "Coup de cœur"',
      'Augmente la confiance',
      'Attire l\'attention'
    ]
  }
};

/**
 * ✅ NOUVELLE FONCTION: Créer une demande de boost en attente de paiement
 */
export const requestBoost = async (productId, boostType, startupId) => {
  try {
    const boostConfig = BOOST_TYPES[boostType];
    if (!boostConfig) {
      throw new Error('Type de boost invalide');
    }

    // Vérifier que le produit existe
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (!productDoc.exists()) {
      throw new Error('Produit introuvable');
    }

    const product = productDoc.data();

    // Créer une demande de boost en attente
    const boostRequest = {
      productId,
      productName: product.name,
      productImage: product.image || '📦',
      startupId: startupId || product.startupId,
      boostType: boostConfig.id,
      boostName: boostConfig.name,
      duration: boostConfig.duration,
      price: boostConfig.price,
      status: 'pending', // pending, approved, rejected, expired
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const requestRef = await addDoc(collection(db, 'boostRequests'), boostRequest);

    console.log('✅ Demande de boost créée:', requestRef.id);
    return {
      success: true,
      requestId: requestRef.id,
      price: boostConfig.price,
      paymentNumbers: PAYMENT_NUMBERS,
      message: `Demande créée! Payez ${boostConfig.price} FCFA pour activer le boost.`
    };
  } catch (error) {
    console.error('❌ Erreur création demande boost:', error);
    throw error;
  }
};

/**
 * ✅ NOUVELLE FONCTION: Valider une demande de boost (Admin)
 */
export const approveBoostRequest = async (requestId) => {
  try {
    const requestDoc = await getDoc(doc(db, 'boostRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Demande introuvable');
    }

    const request = requestDoc.data();
    if (request.status !== 'pending') {
      throw new Error('Cette demande a déjà été traitée');
    }

    const boostConfig = Object.values(BOOST_TYPES).find(b => b.id === request.boostType);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (boostConfig?.duration || request.duration));

    // Créer le boost actif
    const boostData = {
      productId: request.productId,
      productName: request.productName,
      startupId: request.startupId,
      boostType: request.boostType,
      boostName: request.boostName,
      price: request.price,
      status: 'active',
      requestId,
      createdAt: serverTimestamp(),
      activatedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      stats: { views: 0, clicks: 0, conversions: 0 }
    };

    const boostRef = await addDoc(collection(db, 'productBoosts'), boostData);

    // Mettre à jour le produit avec le boost actif
    await updateDoc(doc(db, 'products', request.productId), {
      boost: {
        active: true,
        type: request.boostType,
        boostId: boostRef.id,
        expiresAt: Timestamp.fromDate(expiresAt),
        badge: request.boostType === 'featured_badge' ? '💝 Coup de cœur' : '⭐ Mis en avant'
      },
      updatedAt: serverTimestamp()
    });

    // Marquer la demande comme approuvée
    await updateDoc(doc(db, 'boostRequests', requestId), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      boostId: boostRef.id,
      updatedAt: serverTimestamp()
    });

    // Créer la transaction de paiement
    await addDoc(collection(db, 'payments'), {
      type: 'product_boost',
      boostId: boostRef.id,
      requestId,
      productId: request.productId,
      startupId: request.startupId,
      amount: request.price,
      status: 'completed',
      description: `${request.boostName} - ${request.productName}`,
      createdAt: serverTimestamp()
    });

    console.log('✅ Boost approuvé et activé:', boostRef.id);
    return {
      success: true,
      boostId: boostRef.id,
      expiresAt,
      message: `Boost activé jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}`
    };
  } catch (error) {
    console.error('❌ Erreur approbation boost:', error);
    throw error;
  }
};

/**
 * ✅ NOUVELLE FONCTION: Rejeter une demande de boost (Admin)
 */
export const rejectBoostRequest = async (requestId, reason = '') => {
  try {
    const requestDoc = await getDoc(doc(db, 'boostRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Demande introuvable');
    }

    await updateDoc(doc(db, 'boostRequests', requestId), {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Demande de boost rejetée:', requestId);
    return { success: true, message: 'Demande rejetée' };
  } catch (error) {
    console.error('❌ Erreur rejet boost:', error);
    throw error;
  }
};

/**
 * ✅ NOUVELLE FONCTION: Obtenir toutes les demandes de boost en attente (Admin)
 */
export const getPendingBoostRequests = async () => {
  try {
    const q = query(
      collection(db, 'boostRequests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erreur récupération demandes en attente:', error);
    return [];
  }
};

/**
 * ✅ NOUVELLE FONCTION: Obtenir toutes les demandes de boost (Admin)
 */
export const getAllBoostRequests = async (status = null) => {
  try {
    let q = collection(db, 'boostRequests');

    if (status) {
      q = query(q, where('status', '==', status), orderBy('createdAt', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erreur récupération demandes boost:', error);
    return [];
  }
};

/**
 * Ancienne fonction - garde pour compatibilité mais marque comme deprecated
 * @deprecated Utiliser requestBoost() à la place
 */
export const purchaseBoost = async (productId, boostType, paymentMethod = 'mobile_money') => {
  // Rediriger vers le nouveau système
  return await requestBoost(productId, boostType);
};

/**
 * Vérifier et désactiver les boosts expirés
 */
export const checkExpiredBoosts = async () => {
  try {
    const now = Timestamp.now();
    const boostsQuery = query(
      collection(db, 'productBoosts'),
      where('status', '==', 'active'),
      where('expiresAt', '<', now)
    );

    const snapshot = await getDocs(boostsQuery);
    const expiredBoosts = [];

    for (const boostDoc of snapshot.docs) {
      const boost = boostDoc.data();

      await updateDoc(doc(db, 'productBoosts', boostDoc.id), {
        status: 'expired',
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'products', boost.productId), {
        'boost.active': false,
        updatedAt: serverTimestamp()
      });

      expiredBoosts.push(boostDoc.id);
    }

    if (expiredBoosts.length > 0) {
      console.log(`✅ ${expiredBoosts.length} boosts expirés désactivés`);
    }

    return expiredBoosts;
  } catch (error) {
    console.error('❌ Erreur vérification boosts expirés:', error);
    throw error;
  }
};

/**
 * Obtenir les boosts actifs d'une startup
 */
export const getActiveBoosts = async (startupId) => {
  try {
    const now = Timestamp.now();
    const boostsQuery = query(
      collection(db, 'productBoosts'),
      where('startupId', '==', startupId),
      where('status', '==', 'active'),
      where('expiresAt', '>', now)
    );

    const snapshot = await getDocs(boostsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Erreur récupération boosts actifs:', error);
    return [];
  }
};

/**
 * Obtenir les statistiques d'un boost
 */
export const getBoostStats = async (boostId) => {
  try {
    const boostDoc = await getDoc(doc(db, 'productBoosts', boostId));
    if (!boostDoc.exists()) {
      throw new Error('Boost introuvable');
    }

    const boost = boostDoc.data();
    return {
      views: boost.stats?.views || 0,
      clicks: boost.stats?.clicks || 0,
      conversions: boost.stats?.conversions || 0,
      roi: boost.stats?.conversions
        ? ((boost.stats.conversions * 10000 - boost.price) / boost.price * 100).toFixed(1)
        : 0
    };
  } catch (error) {
    console.error('❌ Erreur stats boost:', error);
    return null;
  }
};

/**
 * Enregistrer une vue/clic/conversion sur un boost
 */
export const trackBoostEvent = async (boostId, eventType) => {
  try {
    const boostRef = doc(db, 'productBoosts', boostId);
    const boostDoc = await getDoc(boostRef);

    if (!boostDoc.exists()) return;

    const currentStats = boostDoc.data().stats || { views: 0, clicks: 0, conversions: 0 };
    await updateDoc(boostRef, {
      [`stats.${eventType}`]: (currentStats[eventType] || 0) + 1
    });
  } catch (error) {
    console.error('❌ Erreur tracking boost:', error);
  }
};

/**
 * Calculer les revenus des boosts
 */
export const getBoostRevenue = async (startDate, endDate) => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('type', '==', 'product_boost'),
      where('status', '==', 'completed'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(paymentsQuery);
    let totalRevenue = 0;
    let boostCount = 0;
    const revenueByType = {};

    snapshot.forEach(doc => {
      const payment = doc.data();
      totalRevenue += payment.amount;
      boostCount++;
      const boostType = payment.description?.split(' - ')[0] || 'Unknown';
      revenueByType[boostType] = (revenueByType[boostType] || 0) + payment.amount;
    });

    return { totalRevenue, boostCount, averageBoostValue: boostCount > 0 ? totalRevenue / boostCount : 0, revenueByType };
  } catch (error) {
    console.error('❌ Erreur calcul revenus boosts:', error);
    return null;
  }
};

export default {
  BOOST_TYPES,
  PAYMENT_NUMBERS,
  requestBoost,
  approveBoostRequest,
  rejectBoostRequest,
  getPendingBoostRequests,
  getAllBoostRequests,
  purchaseBoost,
  checkExpiredBoosts,
  getActiveBoosts,
  getBoostStats,
  trackBoostEvent,
  getBoostRevenue
};
