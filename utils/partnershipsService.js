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
  Timestamp,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

// Types de partenariats disponibles
export const PARTNERSHIP_TYPES = {
  PAYMENT_PROMO: {
    id: 'payment_promo',
    name: 'Promotion Paiement',
    description: 'Bonus pour utilisation d\'un moyen de paiement spécifique',
    example: 'Payez avec Orange Money et recevez 500 FCFA de bonus',
    revenueModel: 'commission_percentage', // % sur chaque transaction
    defaultCommission: 3, // 3%
  },
  BANKING_REFERRAL: {
    id: 'banking_referral',
    name: 'Apport Bancaire',
    description: 'Commission sur ouverture de compte bancaire',
    example: 'Ouvrez un compte pro Afriland et obtenez 3 mois gratuits Pro',
    revenueModel: 'fixed_per_conversion', // Montant fixe par conversion
    defaultCommission: 10000, // 10 000 FCFA par compte
  },
  INSURANCE: {
    id: 'insurance',
    name: 'Assurance Produits',
    description: 'Assurance pour les produits vendus',
    example: 'Assurez vos produits contre la casse/vol',
    revenueModel: 'commission_percentage',
    defaultCommission: 15, // 15%
  },
  TRAINING_REFERRAL: {
    id: 'training_referral',
    name: 'Formation Entrepreneurs',
    description: 'Commission sur inscriptions formations',
    example: 'Formation CIPMEN: -20% pour membres PipoMarket',
    revenueModel: 'commission_percentage',
    defaultCommission: 20, // 20%
  },
  DELIVERY_SERVICE: {
    id: 'delivery_service',
    name: 'Service de Livraison',
    description: 'Partenariat avec service de livraison',
    example: 'Livraison DHL à tarif préférentiel',
    revenueModel: 'commission_percentage',
    defaultCommission: 10, // 10%
  },
  SUPPLIER_DEAL: {
    id: 'supplier_deal',
    name: 'Fournisseur Partenaire',
    description: 'Réductions fournisseurs pour startups',
    example: 'Matières premières -15% via notre partenaire',
    revenueModel: 'commission_percentage',
    defaultCommission: 5, // 5%
  },
};

/**
 * Créer un partenariat
 */
export const createPartnership = async (partnershipData) => {
  try {
    const {
      partnerName,
      partnerContact,
      partnerLogo,
      type,
      description,
      terms,
      commission,
      revenueModel,
      promoCode,
      startDate,
      endDate,
      targetAudience, // 'all', 'startups', 'buyers'
    } = partnershipData;

    const partnershipType = PARTNERSHIP_TYPES[type];
    if (!partnershipType) {
      throw new Error('Type de partenariat invalide');
    }

    const partnership = {
      partnerName,
      partnerContact,
      partnerLogo: partnerLogo || '🤝',
      type: partnershipType.id,
      typeName: partnershipType.name,
      description,
      terms,
      commission: commission || partnershipType.defaultCommission,
      revenueModel: revenueModel || partnershipType.revenueModel,
      promoCode: promoCode || null,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      targetAudience,
      status: 'active', // active, paused, completed
      stats: {
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const partnershipRef = await addDoc(collection(db, 'partnerships'), partnership);

    console.log('✅ Partenariat créé:', partnershipRef.id);
    return {
      success: true,
      partnershipId: partnershipRef.id,
      message: 'Partenariat créé avec succès',
    };
  } catch (error) {
    console.error('❌ Erreur création partenariat:', error);
    throw error;
  }
};

/**
 * Obtenir les partenariats actifs
 */
export const getActivePartnerships = async (targetAudience = null) => {
  try {
    const now = Timestamp.now();
    let q = query(
      collection(db, 'partnerships'),
      where('status', '==', 'active'),
      where('startDate', '<=', now),
      where('endDate', '>=', now)
    );

    if (targetAudience) {
      q = query(q, where('targetAudience', 'in', [targetAudience, 'all']));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('❌ Erreur récupération partenariats:', error);
    return [];
  }
};

/**
 * Obtenir un partenariat par code promo
 */
export const getPartnershipByPromoCode = async (promoCode) => {
  try {
    const q = query(
      collection(db, 'partnerships'),
      where('promoCode', '==', promoCode),
      where('status', '==', 'active')
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
    console.error('❌ Erreur recherche partenariat:', error);
    return null;
  }
};

/**
 * Tracker une vue de partenariat
 */
export const trackPartnershipView = async (partnershipId) => {
  try {
    const partnershipRef = doc(db, 'partnerships', partnershipId);
    await updateDoc(partnershipRef, {
      'stats.views': increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('❌ Erreur tracking vue partenariat:', error);
  }
};

/**
 * Tracker un clic sur partenariat
 */
export const trackPartnershipClick = async (partnershipId) => {
  try {
    const partnershipRef = doc(db, 'partnerships', partnershipId);
    await updateDoc(partnershipRef, {
      'stats.clicks': increment(1),
      updatedAt: serverTimestamp(),
    });

    // Enregistrer l'événement
    await addDoc(collection(db, 'partnershipEvents'), {
      partnershipId,
      type: 'click',
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('❌ Erreur tracking clic partenariat:', error);
  }
};

/**
 * Enregistrer une conversion (ex: compte ouvert, formation achetée)
 */
export const trackPartnershipConversion = async (partnershipId, conversionData) => {
  try {
    const {
      userId,
      amount, // Montant de la transaction (si applicable)
      type, // Type de conversion: 'account_opened', 'training_purchased', etc.
      metadata,
    } = conversionData;

    const partnershipDoc = await getDoc(doc(db, 'partnerships', partnershipId));
    if (!partnershipDoc.exists()) {
      throw new Error('Partenariat introuvable');
    }

    const partnership = partnershipDoc.data();
    let revenue = 0;

    // Calculer le revenu selon le modèle
    if (partnership.revenueModel === 'commission_percentage' && amount) {
      revenue = (amount * partnership.commission) / 100;
    } else if (partnership.revenueModel === 'fixed_per_conversion') {
      revenue = partnership.commission;
    }

    // Mettre à jour les stats
    await updateDoc(doc(db, 'partnerships', partnershipId), {
      'stats.conversions': increment(1),
      'stats.revenue': increment(revenue),
      updatedAt: serverTimestamp(),
    });

    // Enregistrer la conversion
    await addDoc(collection(db, 'partnershipConversions'), {
      partnershipId,
      userId,
      type,
      amount: amount || 0,
      revenue,
      metadata: metadata || {},
      timestamp: serverTimestamp(),
    });

    console.log('✅ Conversion partenariat enregistrée:', partnershipId);
    return {
      success: true,
      revenue,
      message: 'Conversion enregistrée',
    };
  } catch (error) {
    console.error('❌ Erreur enregistrement conversion:', error);
    throw error;
  }
};

/**
 * Appliquer une promotion de partenariat à une transaction
 */
export const applyPartnershipPromo = async (promoCode, transactionAmount) => {
  try {
    const partnership = await getPartnershipByPromoCode(promoCode);
    if (!partnership) {
      throw new Error('Code promo invalide');
    }

    let bonus = 0;
    let discount = 0;

    // Selon le type de partenariat
    if (partnership.type === 'payment_promo') {
      // Bonus fixe (ex: 500 FCFA)
      bonus = 500;
    } else if (partnership.revenueModel === 'commission_percentage') {
      // Réduction en %
      discount = (transactionAmount * partnership.commission) / 100;
    }

    // Tracker la conversion
    await trackPartnershipConversion(partnership.id, {
      userId: null, // À remplir avec l'ID utilisateur réel
      amount: transactionAmount,
      type: 'promo_applied',
      metadata: { promoCode, bonus, discount },
    });

    return {
      success: true,
      bonus,
      discount,
      partnerName: partnership.partnerName,
      message: bonus > 0
        ? `Vous recevez ${bonus} FCFA de bonus!`
        : `Réduction de ${discount} FCFA appliquée!`,
    };
  } catch (error) {
    console.error('❌ Erreur application promo partenariat:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques d'un partenariat
 */
export const getPartnershipStats = async (partnershipId) => {
  try {
    const partnershipDoc = await getDoc(doc(db, 'partnerships', partnershipId));
    if (!partnershipDoc.exists()) {
      throw new Error('Partenariat introuvable');
    }

    const partnership = partnershipDoc.data();
    const stats = partnership.stats || { views: 0, clicks: 0, conversions: 0, revenue: 0 };

    // Calculer le taux de conversion
    const conversionRate = stats.clicks > 0 ? (stats.conversions / stats.clicks) * 100 : 0;

    // Calculer le coût par conversion
    const costPerConversion = stats.conversions > 0 ? stats.revenue / stats.conversions : 0;

    return {
      views: stats.views,
      clicks: stats.clicks,
      conversions: stats.conversions,
      revenue: stats.revenue,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      costPerConversion: parseFloat(costPerConversion.toFixed(2)),
      ctr: stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(2) : 0,
    };
  } catch (error) {
    console.error('❌ Erreur stats partenariat:', error);
    return null;
  }
};

/**
 * Obtenir tous les partenariats (admin)
 */
export const getAllPartnerships = async (status = null) => {
  try {
    let q = collection(db, 'partnerships');

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('❌ Erreur récupération partenariats:', error);
    return [];
  }
};

/**
 * Mettre à jour le statut d'un partenariat
 */
export const updatePartnershipStatus = async (partnershipId, status) => {
  try {
    await updateDoc(doc(db, 'partnerships', partnershipId), {
      status,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: `Partenariat ${status === 'paused' ? 'mis en pause' : status === 'active' ? 'activé' : 'terminé'}`,
    };
  } catch (error) {
    console.error('❌ Erreur mise à jour statut partenariat:', error);
    throw error;
  }
};

/**
 * Calculer les revenus des partenariats
 */
export const getPartnershipsRevenue = async (startDate, endDate) => {
  try {
    const conversionsQuery = query(
      collection(db, 'partnershipConversions'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(conversionsQuery);

    let totalRevenue = 0;
    let conversionsCount = 0;
    const revenueByType = {};

    snapshot.forEach((doc) => {
      const conversion = doc.data();
      totalRevenue += conversion.revenue || 0;
      conversionsCount++;

      const type = conversion.type || 'unknown';
      revenueByType[type] = (revenueByType[type] || 0) + (conversion.revenue || 0);
    });

    return {
      totalRevenue,
      conversionsCount,
      averageRevenuePerConversion: conversionsCount > 0 ? totalRevenue / conversionsCount : 0,
      revenueByType,
    };
  } catch (error) {
    console.error('❌ Erreur calcul revenus partenariats:', error);
    return null;
  }
};

/**
 * Vérifier et marquer les partenariats expirés
 */
export const checkExpiredPartnerships = async () => {
  try {
    const now = Timestamp.now();
    const partnershipsQuery = query(
      collection(db, 'partnerships'),
      where('status', '==', 'active'),
      where('endDate', '<', now)
    );

    const snapshot = await getDocs(partnershipsQuery);
    const expiredPartnerships = [];

    for (const partnershipDoc of snapshot.docs) {
      await updateDoc(doc(db, 'partnerships', partnershipDoc.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      expiredPartnerships.push(partnershipDoc.id);
    }

    if (expiredPartnerships.length > 0) {
      console.log(`✅ ${expiredPartnerships.length} partenariats expirés marqués comme terminés`);
    }

    return expiredPartnerships;
  } catch (error) {
    console.error('❌ Erreur vérification partenariats expirés:', error);
    throw error;
  }
};

export default {
  PARTNERSHIP_TYPES,
  createPartnership,
  getActivePartnerships,
  getPartnershipByPromoCode,
  trackPartnershipView,
  trackPartnershipClick,
  trackPartnershipConversion,
  applyPartnershipPromo,
  getPartnershipStats,
  getAllPartnerships,
  updatePartnershipStatus,
  getPartnershipsRevenue,
  checkExpiredPartnerships,
};
