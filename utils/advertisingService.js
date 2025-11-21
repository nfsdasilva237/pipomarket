// utils/advertisingService.js - SERVICE COMPLET BANNIÈRES PUBLICITAIRES

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types de placement disponibles
export const PLACEMENT_TYPES = {
  HOME_BANNER: {
    id: 'home_banner',
    name: 'Bannière Accueil',
    price: 5000, // FCFA/jour
    dimensions: '1200x400',
  },
  CATEGORY_BANNER: {
    id: 'category_banner',
    name: 'Bannière Catégorie',
    price: 3000,
    dimensions: '1200x300',
  },
  SPONSORED_STORY: {
    id: 'sponsored_story',
    name: 'Story Sponsorisée',
    price: 4000,
    dimensions: '1080x1920',
  },
  SEARCH_BANNER: {
    id: 'search_banner',
    name: 'Bannière Recherche',
    price: 3500,
    dimensions: '1200x200',
  },
};

/**
 * Créer une nouvelle campagne publicitaire
 */
export async function createCampaign(campaignData) {
  try {
    const {
      advertiserName,
      advertiserEmail,
      placement,
      imageUrl,
      targetUrl,
      price,
      startDate,
      endDate,
    } = campaignData;

    const campaign = {
      advertiserName,
      advertiserEmail,
      placement,
      imageUrl,
      targetUrl,
      price,
      startDate: startDate instanceof Date ? Timestamp.fromDate(startDate) : Timestamp.now(),
      endDate: endDate instanceof Date ? Timestamp.fromDate(endDate) : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      active: true,
      impressions: 0,
      clicks: 0,
      revenue: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'advertising_campaigns'), campaign);

    console.log('✅ Campagne créée:', docRef.id);
    return { success: true, campaignId: docRef.id };
  } catch (error) {
    console.error('❌ Erreur création campagne:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer toutes les campagnes
 */
export async function getAllCampaigns() {
  try {
    const querySnapshot = await getDocs(collection(db, 'advertising_campaigns'));
    const campaigns = [];

    querySnapshot.forEach((doc) => {
      campaigns.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Trier par date de création (plus récent en premier)
    campaigns.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return campaigns;
  } catch (error) {
    console.error('❌ Erreur récupération campagnes:', error);
    return [];
  }
}

/**
 * Récupérer une campagne active pour un placement donné
 */
export async function getActiveCampaignForPlacement(placement) {
  try {
    const now = Timestamp.now();

    const q = query(
      collection(db, 'advertising_campaigns'),
      where('placement', '==', placement),
      where('active', '==', true),
      where('startDate', '<=', now),
      where('endDate', '>=', now)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Prendre la première campagne active
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error('❌ Erreur récupération campagne active:', error);
    return null;
  }
}

/**
 * ✅ FONCTION PRINCIPALE: getActiveAds
 * Récupère les publicités actives (TOUJOURS retourne un tableau)
 * Compatible avec BannerAd.js qui attend un tableau
 */
export async function getActiveAds(placement = null, category = null) {
  try {
    const now = Timestamp.now();

    // Construire la requête de base
    let q = query(
      collection(db, 'advertising_campaigns'),
      where('active', '==', true),
      where('startDate', '<=', now),
      where('endDate', '>=', now)
    );

    // Filtrer par placement si spécifié
    if (placement) {
      q = query(
        collection(db, 'advertising_campaigns'),
        where('placement', '==', placement),
        where('active', '==', true),
        where('startDate', '<=', now),
        where('endDate', '>=', now)
      );
    }

    const querySnapshot = await getDocs(q);

    let ads = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrer par catégorie si nécessaire (pour category_banner)
    if (category && placement === 'category_banner') {
      ads = ads.filter(ad => ad.category === category);
    }

    // Rotation aléatoire des publicités
    return shuffleArray(ads);

  } catch (error) {
    console.error('❌ Erreur getActiveAds:', error);
    return []; // ✅ TOUJOURS retourner un tableau vide en cas d'erreur
  }
}

/**
 * Mélanger un tableau (pour rotation aléatoire)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Enregistrer une impression (affichage)
 */
export async function trackImpression(campaignId) {
  try {
    const campaignRef = doc(db, 'advertising_campaigns', campaignId);

    await updateDoc(campaignRef, {
      impressions: increment(1),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur tracking impression:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enregistrer un clic
 */
export async function trackClick(campaignId) {
  try {
    const campaignRef = doc(db, 'advertising_campaigns', campaignId);

    await updateDoc(campaignRef, {
      clicks: increment(1),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur tracking clic:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Activer/Désactiver une campagne
 */
export async function toggleCampaignStatus(campaignId, newStatus) {
  try {
    const campaignRef = doc(db, 'advertising_campaigns', campaignId);

    await updateDoc(campaignRef, {
      active: newStatus,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Campagne ${newStatus ? 'activée' : 'désactivée'}:`, campaignId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur toggle campagne:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Supprimer une campagne
 */
export async function deleteCampaign(campaignId) {
  try {
    await deleteDoc(doc(db, 'advertising_campaigns', campaignId));

    console.log('✅ Campagne supprimée:', campaignId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression campagne:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculer le revenu total d'une campagne
 */
export async function calculateCampaignRevenue(campaignId) {
  try {
    const campaignRef = doc(db, 'advertising_campaigns', campaignId);
    const campaignDoc = await getDoc(campaignRef);

    if (!campaignDoc.exists()) {
      return { success: false, error: 'Campagne non trouvée' };
    }

    const campaign = campaignDoc.data();
    const startDate = campaign.startDate?.toDate() || new Date();
    const endDate = campaign.endDate?.toDate() || new Date();
    const pricePerDay = campaign.price || 0;

    // Calculer le nombre de jours
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const revenue = daysDiff * pricePerDay;

    // Mettre à jour le revenu
    await updateDoc(campaignRef, {
      revenue,
      updatedAt: serverTimestamp(),
    });

    return { success: true, revenue };
  } catch (error) {
    console.error('❌ Erreur calcul revenu:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtenir les statistiques globales des campagnes
 */
export async function getAdvertisingStats() {
  try {
    const campaigns = await getAllCampaigns();

    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.active).length,
      totalImpressions: campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
      totalClicks: campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0),
      averageCTR: 0,
    };

    // Calculer le CTR moyen (Click-Through Rate)
    if (stats.totalImpressions > 0) {
      stats.averageCTR = (stats.totalClicks / stats.totalImpressions) * 100;
    }

    return stats;
  } catch (error) {
    console.error('❌ Erreur stats publicités:', error);
    return null;
  }
}

export default {
  PLACEMENT_TYPES,
  createCampaign,
  getAllCampaigns,
  getActiveCampaignForPlacement,
  getActiveAds,
  trackImpression,
  trackClick,
  toggleCampaignStatus,
  deleteCampaign,
  calculateCampaignRevenue,
  getAdvertisingStats,
};
