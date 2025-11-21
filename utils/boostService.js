import {
    Timestamp,
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types de boost disponibles
export const BOOST_TYPES = {
  BOOST_24H: {
    id: 'boost_24h',
    name: 'Boost 24 heures',
    duration: 24 * 60 * 60 * 1000, // 24h en millisecondes
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
    duration: 7 * 24 * 60 * 60 * 1000, // 7 jours
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
    duration: 30 * 24 * 60 * 60 * 1000, // 30 jours
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
    duration: 7 * 24 * 60 * 60 * 1000, // 7 jours
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
 * Acheter un boost pour un produit
 */
export const purchaseBoost = async (productId, boostType, paymentMethod = 'mobile_money') => {
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
    const now = new Date();
    const expiresAt = new Date(now.getTime() + boostConfig.duration);

    // Créer la transaction de boost
    const boostData = {
      productId,
      productName: product.name,
      startupId: product.startupId,
      boostType: boostConfig.id,
      boostName: boostConfig.name,
      price: boostConfig.price,
      paymentMethod,
      status: 'active',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      stats: {
        views: 0,
        clicks: 0,
        conversions: 0
      }
    };

    const boostRef = await addDoc(collection(db, 'productBoosts'), boostData);

    // Mettre à jour le produit avec le boost actif
    await updateDoc(doc(db, 'products', productId), {
      boost: {
        active: true,
        type: boostConfig.id,
        boostId: boostRef.id,
        expiresAt: Timestamp.fromDate(expiresAt),
        badge: boostType === 'FEATURED_BADGE' ? '💝 Coup de cœur' : '⭐ Mis en avant'
      },
      updatedAt: serverTimestamp()
    });

    // Créer une transaction de paiement
    await addDoc(collection(db, 'payments'), {
      type: 'product_boost',
      boostId: boostRef.id,
      productId,
      startupId: product.startupId,
      amount: boostConfig.price,
      method: paymentMethod,
      status: 'completed',
      description: `${boostConfig.name} - ${product.name}`,
      createdAt: serverTimestamp()
    });

    console.log('✅ Boost acheté avec succès:', boostRef.id);
    return {
      success: true,
      boostId: boostRef.id,
      expiresAt,
      message: `Boost activé jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}`
    };
  } catch (error) {
    console.error('❌ Erreur achat boost:', error);
    throw error;
  }
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

      // Désactiver le boost
      await updateDoc(doc(db, 'productBoosts', boostDoc.id), {
        status: 'expired',
        updatedAt: serverTimestamp()
      });

      // Retirer le boost du produit
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
    const boosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return boosts;
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

    if (!boostDoc.exists()) {
      return;
    }

    const currentStats = boostDoc.data().stats || { views: 0, clicks: 0, conversions: 0 };

    const updates = {
      [`stats.${eventType}`]: (currentStats[eventType] || 0) + 1
    };

    await updateDoc(boostRef, updates);
  } catch (error) {
    console.error('❌ Erreur tracking boost:', error);
  }
};

/**
 * Renouveler un boost expiré
 */
export const renewBoost = async (boostId) => {
  try {
    const boostDoc = await getDoc(doc(db, 'productBoosts', boostId));
    if (!boostDoc.exists()) {
      throw new Error('Boost introuvable');
    }

    const boost = boostDoc.data();
    const boostConfig = Object.values(BOOST_TYPES).find(b => b.id === boost.boostType);

    if (!boostConfig) {
      throw new Error('Configuration de boost introuvable');
    }

    // Créer un nouveau boost avec les mêmes paramètres
    return await purchaseBoost(boost.productId, boost.boostType.toUpperCase());
  } catch (error) {
    console.error('❌ Erreur renouvellement boost:', error);
    throw error;
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

    return {
      totalRevenue,
      boostCount,
      averageBoostValue: boostCount > 0 ? totalRevenue / boostCount : 0,
      revenueByType
    };
  } catch (error) {
    console.error('❌ Erreur calcul revenus boosts:', error);
    return null;
  }
};

export default {
  BOOST_TYPES,
  purchaseBoost,
  checkExpiredBoosts,
  getActiveBoosts,
  getBoostStats,
  trackBoostEvent,
  renewBoost,
  getBoostRevenue
};