// utils/partnershipsService.js - SERVICE COMPLET PARTENARIATS

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
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types de partenariats
export const PARTNERSHIP_TYPES = {
  PAYMENT_INTEGRATION: {
    id: 'payment_integration',
    name: 'Intégration Paiement',
    icon: '💳',
  },
  DELIVERY_SERVICE: {
    id: 'delivery_service',
    name: 'Service de Livraison',
    icon: '🚚',
  },
  MARKETING_PARTNERSHIP: {
    id: 'marketing_partnership',
    name: 'Partenariat Marketing',
    icon: '📢',
  },
  DATA_PROVIDER: {
    id: 'data_provider',
    name: 'Fournisseur de Données',
    icon: '📊',
  },
  TECHNOLOGY_PARTNER: {
    id: 'technology_partner',
    name: 'Partenaire Technologique',
    icon: '⚙️',
  },
  FINANCIAL_INSTITUTION: {
    id: 'financial_institution',
    name: 'Institution Financière',
    icon: '🏦',
  },
};

/**
 * Créer un nouveau partenariat
 */
export async function createPartnership(partnershipData) {
  try {
    const {
      partnerName,
      partnerEmail,
      partnerPhone,
      type,
      commissionRate,
      description,
    } = partnershipData;

    const partnership = {
      partnerName,
      partnerEmail,
      partnerPhone: partnerPhone || '',
      type,
      commissionRate,
      description: description || '',
      active: true,
      transactionCount: 0,
      totalRevenue: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'partnerships'), partnership);

    console.log('✅ Partenariat créé:', docRef.id);
    return { success: true, partnershipId: docRef.id };
  } catch (error) {
    console.error('❌ Erreur création partenariat:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer tous les partenariats
 */
export async function getAllPartnerships() {
  try {
    const querySnapshot = await getDocs(collection(db, 'partnerships'));
    const partnerships = [];

    querySnapshot.forEach((doc) => {
      partnerships.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Trier par date de création (plus récent en premier)
    partnerships.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return partnerships;
  } catch (error) {
    console.error('❌ Erreur récupération partenariats:', error);
    return [];
  }
}

/**
 * Récupérer les partenariats actifs
 */
export async function getActivePartnerships() {
  try {
    const q = query(
      collection(db, 'partnerships'),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const partnerships = [];

    querySnapshot.forEach((doc) => {
      partnerships.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return partnerships;
  } catch (error) {
    console.error('❌ Erreur récupération partenariats actifs:', error);
    return [];
  }
}

/**
 * Enregistrer une transaction pour un partenariat
 */
export async function recordPartnershipTransaction(partnershipId, amount) {
  try {
    const partnershipRef = doc(db, 'partnerships', partnershipId);
    const partnershipDoc = await getDoc(partnershipRef);

    if (!partnershipDoc.exists()) {
      return { success: false, error: 'Partenariat non trouvé' };
    }

    const partnership = partnershipDoc.data();
    const commission = (amount * partnership.commissionRate) / 100;

    await updateDoc(partnershipRef, {
      transactionCount: increment(1),
      totalRevenue: increment(commission),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Transaction enregistrée pour partenariat:', partnershipId);
    return { success: true, commission };
  } catch (error) {
    console.error('❌ Erreur enregistrement transaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Activer/Désactiver un partenariat
 */
export async function togglePartnershipStatus(partnershipId, newStatus) {
  try {
    const partnershipRef = doc(db, 'partnerships', partnershipId);
    
    await updateDoc(partnershipRef, {
      active: newStatus,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Partenariat ${newStatus ? 'activé' : 'désactivé'}:`, partnershipId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur toggle partenariat:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Supprimer un partenariat
 */
export async function deletePartnership(partnershipId) {
  try {
    await deleteDoc(doc(db, 'partnerships', partnershipId));
    
    console.log('✅ Partenariat supprimé:', partnershipId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression partenariat:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtenir les statistiques des partenariats
 */
export async function getPartnershipsStats() {
  try {
    const partnerships = await getAllPartnerships();

    const stats = {
      totalPartnerships: partnerships.length,
      activePartnerships: partnerships.filter(p => p.active).length,
      totalTransactions: partnerships.reduce((sum, p) => sum + (p.transactionCount || 0), 0),
      totalRevenue: partnerships.reduce((sum, p) => sum + (p.totalRevenue || 0), 0),
      byType: {},
    };

    // Grouper par type
    Object.values(PARTNERSHIP_TYPES).forEach(type => {
      const partnershipsOfType = partnerships.filter(p => p.type === type.id);
      stats.byType[type.id] = {
        count: partnershipsOfType.length,
        revenue: partnershipsOfType.reduce((sum, p) => sum + (p.totalRevenue || 0), 0),
      };
    });

    return stats;
  } catch (error) {
    console.error('❌ Erreur stats partenariats:', error);
    return null;
  }
}