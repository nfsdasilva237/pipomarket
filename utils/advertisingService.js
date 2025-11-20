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
  increment
} from 'firebase/firestore';

// Emplacements publicitaires disponibles
export const AD_PLACEMENTS = {
  HOME_BANNER: {
    id: 'home_banner',
    name: 'Bannière Accueil',
    price: 50000,
    description: 'Bannière principale sur la page d\'accueil',
    dimensions: { width: 350, height: 120 },
    maxAds: 2, // Maximum 2 annonceurs en rotation
    impressionsEstimated: 50000, // Par mois
  },
  CATEGORY_BANNER: {
    id: 'category_banner',
    name: 'Bannière Catégorie',
    price: 30000,
    description: 'Bannière sur page catégorie spécifique',
    dimensions: { width: 350, height: 100 },
    maxAds: 1,
    impressionsEstimated: 15000, // Par mois par catégorie
  },
  SPONSORED_STORY: {
    id: 'sponsored_story',
    name: 'Story Sponsorisée',
    price: 20000, // Par semaine
    description: 'Story mise en avant dans section dédiée',
    dimensions: { width: 350, height: 180 },
    maxAds: 3,
    impressionsEstimated: 30000,
    duration: 7 * 24 * 60 * 60 * 1000, // 1 semaine
  },
  SEARCH_BANNER: {
    id: 'search_banner',
    name: 'Bannière Recherche',
    price: 25000,
    description: 'Apparaît dans les résultats de recherche',
    dimensions: { width: 350, height: 80 },
    maxAds: 1,
    impressionsEstimated: 20000,
  },
};

/**
 * Créer une campagne publicitaire
 */
export const createAdCampaign = async (campaignData) => {
  try {
    const {
      advertiserName,
      advertiserContact,
      placement,
      category, // Pour category_banner
      imageUrl,
      linkUrl,
      title,
      description,
      startDate,
      endDate,
      budget,
    } = campaignData;

    const placementConfig = AD_PLACEMENTS[placement];
    if (!placementConfig) {
      throw new Error('Emplacement publicitaire invalide');
    }

    const campaign = {
      advertiserName,
      advertiserContact,
      placement: placementConfig.id,
      placementName: placementConfig.name,
      category: category || null,
      imageUrl,
      linkUrl,
      title,
      description,
      price: placementConfig.price,
      budget,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      status: 'pending', // pending, active, paused, completed, rejected
      stats: {
        impressions: 0,
        clicks: 0,
        ctr: 0, // Click-through rate
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const campaignRef = await addDoc(collection(db, 'adCampaigns'), campaign);

    // Créer la transaction de paiement
    await addDoc(collection(db, 'payments'), {
      type: 'advertising',
      campaignId: campaignRef.id,
      advertiserName,
      amount: placementConfig.price,
      status: 'pending',
      description: `Publicité - ${placementConfig.name}`,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Campagne publicitaire créée:', campaignRef.id);
    return {
      success: true,
      campaignId: campaignRef.id,
      message: 'Campagne créée avec succès. En attente d\'approbation.',
    };
  } catch (error) {
    console.error('❌ Erreur création campagne:', error);
    throw error;
  }
};

/**
 * Obtenir les publicités actives pour un emplacement
 */
export const getActiveAds = async (placement, category = null) => {
  try {
    const now = Timestamp.now();
    let q = query(
      collection(db, 'adCampaigns'),
      where('placement', '==', placement),
      where('status', '==', 'active'),
      where('startDate', '<=', now),
      where('endDate', '>=', now)
    );

    // Si c'est une bannière de catégorie, filtrer par catégorie
    if (placement === 'category_banner' && category) {
      q = query(q, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    const ads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Rotation aléatoire des publicités
    return shuffleArray(ads);
  } catch (error) {
    console.error('❌ Erreur récupération publicités:', error);
    return [];
  }
};

/**
 * Enregistrer une impression (vue) de publicité
 */
export const trackImpression = async (campaignId) => {
  try {
    const campaignRef = doc(db, 'adCampaigns', campaignId);
    await updateDoc(campaignRef, {
      'stats.impressions': increment(1),
      updatedAt: serverTimestamp(),
    });

    // Mettre à jour le CTR
    await updateCTR(campaignId);
  } catch (error) {
    console.error('❌ Erreur tracking impression:', error);
  }
};

/**
 * Enregistrer un clic sur publicité
 */
export const trackClick = async (campaignId) => {
  try {
    const campaignRef = doc(db, 'adCampaigns', campaignId);
    await updateDoc(campaignRef, {
      'stats.clicks': increment(1),
      updatedAt: serverTimestamp(),
    });

    // Enregistrer l'événement de clic
    await addDoc(collection(db, 'adEvents'), {
      campaignId,
      type: 'click',
      timestamp: serverTimestamp(),
    });

    // Mettre à jour le CTR
    await updateCTR(campaignId);
  } catch (error) {
    console.error('❌ Erreur tracking clic:', error);
  }
};

/**
 * Mettre à jour le taux de clic (CTR)
 */
const updateCTR = async (campaignId) => {
  try {
    const campaignDoc = await getDoc(doc(db, 'adCampaigns', campaignId));
    if (!campaignDoc.exists()) return;

    const campaign = campaignDoc.data();
    const impressions = campaign.stats?.impressions || 0;
    const clicks = campaign.stats?.clicks || 0;

    if (impressions > 0) {
      const ctr = (clicks / impressions) * 100;
      await updateDoc(doc(db, 'adCampaigns', campaignId), {
        'stats.ctr': parseFloat(ctr.toFixed(2)),
      });
    }
  } catch (error) {
    console.error('❌ Erreur mise à jour CTR:', error);
  }
};

/**
 * Approuver une campagne publicitaire (admin)
 */
export const approveCampaign = async (campaignId) => {
  try {
    await updateDoc(doc(db, 'adCampaigns', campaignId), {
      status: 'active',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Campagne approuvée:', campaignId);
    return { success: true, message: 'Campagne approuvée et activée' };
  } catch (error) {
    console.error('❌ Erreur approbation campagne:', error);
    throw error;
  }
};

/**
 * Rejeter une campagne publicitaire (admin)
 */
export const rejectCampaign = async (campaignId, reason) => {
  try {
    await updateDoc(doc(db, 'adCampaigns', campaignId), {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Campagne rejetée:', campaignId);
    return { success: true, message: 'Campagne rejetée' };
  } catch (error) {
    console.error('❌ Erreur rejet campagne:', error);
    throw error;
  }
};

/**
 * Mettre en pause une campagne
 */
export const pauseCampaign = async (campaignId) => {
  try {
    await updateDoc(doc(db, 'adCampaigns', campaignId), {
      status: 'paused',
      pausedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Campagne mise en pause' };
  } catch (error) {
    console.error('❌ Erreur mise en pause campagne:', error);
    throw error;
  }
};

/**
 * Reprendre une campagne en pause
 */
export const resumeCampaign = async (campaignId) => {
  try {
    await updateDoc(doc(db, 'adCampaigns', campaignId), {
      status: 'active',
      resumedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Campagne reprise' };
  } catch (error) {
    console.error('❌ Erreur reprise campagne:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques d'une campagne
 */
export const getCampaignStats = async (campaignId) => {
  try {
    const campaignDoc = await getDoc(doc(db, 'adCampaigns', campaignId));
    if (!campaignDoc.exists()) {
      throw new Error('Campagne introuvable');
    }

    const campaign = campaignDoc.data();
    const stats = campaign.stats || { impressions: 0, clicks: 0, ctr: 0 };

    // Calculer le coût par clic (CPC)
    const cpc = stats.clicks > 0 ? campaign.price / stats.clicks : 0;

    // Calculer le coût par mille impressions (CPM)
    const cpm = stats.impressions > 0 ? (campaign.price / stats.impressions) * 1000 : 0;

    return {
      impressions: stats.impressions,
      clicks: stats.clicks,
      ctr: stats.ctr,
      cpc: parseFloat(cpc.toFixed(2)),
      cpm: parseFloat(cpm.toFixed(2)),
      budget: campaign.budget,
      spent: campaign.price,
      remaining: campaign.budget - campaign.price,
    };
  } catch (error) {
    console.error('❌ Erreur stats campagne:', error);
    return null;
  }
};

/**
 * Obtenir toutes les campagnes (admin)
 */
export const getAllCampaigns = async (status = null) => {
  try {
    let q = collection(db, 'adCampaigns');

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('❌ Erreur récupération campagnes:', error);
    return [];
  }
};

/**
 * Calculer les revenus publicitaires
 */
export const getAdvertisingRevenue = async (startDate, endDate) => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('type', '==', 'advertising'),
      where('status', '==', 'completed'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(paymentsQuery);

    let totalRevenue = 0;
    let campaignCount = 0;
    const revenueByPlacement = {};

    snapshot.forEach((doc) => {
      const payment = doc.data();
      totalRevenue += payment.amount;
      campaignCount++;

      const placement = payment.description?.split(' - ')[1] || 'Unknown';
      revenueByPlacement[placement] = (revenueByPlacement[placement] || 0) + payment.amount;
    });

    return {
      totalRevenue,
      campaignCount,
      averageCampaignValue: campaignCount > 0 ? totalRevenue / campaignCount : 0,
      revenueByPlacement,
    };
  } catch (error) {
    console.error('❌ Erreur calcul revenus publicitaires:', error);
    return null;
  }
};

/**
 * Utilitaire: Mélanger un tableau
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Vérifier et marquer les campagnes expirées
 */
export const checkExpiredCampaigns = async () => {
  try {
    const now = Timestamp.now();
    const campaignsQuery = query(
      collection(db, 'adCampaigns'),
      where('status', '==', 'active'),
      where('endDate', '<', now)
    );

    const snapshot = await getDocs(campaignsQuery);
    const expiredCampaigns = [];

    for (const campaignDoc of snapshot.docs) {
      await updateDoc(doc(db, 'adCampaigns', campaignDoc.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      expiredCampaigns.push(campaignDoc.id);
    }

    if (expiredCampaigns.length > 0) {
      console.log(`✅ ${expiredCampaigns.length} campagnes expirées marquées comme terminées`);
    }

    return expiredCampaigns;
  } catch (error) {
    console.error('❌ Erreur vérification campagnes expirées:', error);
    throw error;
  }
};

export default {
  AD_PLACEMENTS,
  createAdCampaign,
  getActiveAds,
  trackImpression,
  trackClick,
  approveCampaign,
  rejectCampaign,
  pauseCampaign,
  resumeCampaign,
  getCampaignStats,
  getAllCampaigns,
  getAdvertisingRevenue,
  checkExpiredCampaigns,
};
