// utils/promoCodeService.js - SERVICE CODES PROMO
import { collection, doc, getDoc, getDocs, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export const promoCodeService = {
  
  // VALIDER UN CODE PROMO
  validatePromoCode: async (code, cartTotal, startupIds = []) => {
    try {
      // Chercher le code dans Firestore
      const promoQuery = query(
        collection(db, 'promoCodes'),
        where('code', '==', code.toUpperCase()),
        where('active', '==', true)
      );
      
      const snapshot = await getDocs(promoQuery);
      
      if (snapshot.empty) {
        return { valid: false, error: 'Code promo invalide' };
      }
      
      const promoDoc = snapshot.docs[0];
      const promo = { id: promoDoc.id, ...promoDoc.data() };
      
      // VÉRIFICATIONS
      
      // 1. Dates
      const now = new Date();
      const startDate = promo.startDate?.toDate();
      const endDate = promo.endDate?.toDate();
      
      if (startDate && now < startDate) {
        return { valid: false, error: 'Ce code n\'est pas encore actif' };
      }
      
      if (endDate && now > endDate) {
        return { valid: false, error: 'Ce code a expiré' };
      }
      
      // 2. Nombre d'utilisations
      if (promo.maxUses && promo.currentUses >= promo.maxUses) {
        return { valid: false, error: 'Ce code a atteint sa limite d\'utilisation' };
      }
      
      // 3. Montant minimum
      if (promo.minOrderAmount && cartTotal < promo.minOrderAmount) {
        return { 
          valid: false, 
          error: `Montant minimum requis: ${promo.minOrderAmount.toLocaleString('fr-FR')} FCFA` 
        };
      }
      
      // 4. Startup spécifique
      if (promo.startupId && !startupIds.includes(promo.startupId)) {
        return { valid: false, error: 'Ce code ne s\'applique pas à ces produits' };
      }
      
      // 5. Première commande uniquement
      if (promo.firstOrderOnly) {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', userId)
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          
          if (!ordersSnapshot.empty) {
            return { valid: false, error: 'Ce code est réservé aux nouveaux clients' };
          }
        }
      }
      
      // 6. Utilisation unique par utilisateur
      const userId = auth.currentUser?.uid;
      if (userId && promo.usedBy && promo.usedBy.includes(userId)) {
        return { valid: false, error: 'Vous avez déjà utilisé ce code' };
      }
      
      // CODE VALIDE !
      return { 
        valid: true, 
        promo: promo,
        message: `Code "${code}" appliqué avec succès !`
      };
      
    } catch (error) {
      console.error('Erreur validation code promo:', error);
      return { valid: false, error: 'Erreur lors de la validation' };
    }
  },
  
  // CALCULER LA RÉDUCTION
  calculateDiscount: (promo, cartTotal, shippingCost = 0) => {
    let discount = 0;
    let discountType = '';
    let freeShipping = false;
    
    switch (promo.type) {
      case 'percentage':
        discount = (cartTotal * promo.value) / 100;
        discountType = `${promo.value}%`;
        
        // Limiter à maxDiscountAmount si défini
        if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
          discount = promo.maxDiscountAmount;
        }
        break;
        
      case 'fixed':
        discount = promo.value;
        discountType = `${promo.value.toLocaleString('fr-FR')} FCFA`;
        
        // Ne pas dépasser le montant du panier
        if (discount > cartTotal) {
          discount = cartTotal;
        }
        break;
        
      case 'free_shipping':
        discount = shippingCost;
        freeShipping = true;
        discountType = 'Livraison gratuite';
        break;
        
      default:
        discount = 0;
    }
    
    return {
      amount: Math.round(discount),
      type: discountType,
      freeShipping: freeShipping
    };
  },
  
  // APPLIQUER LE CODE (après commande validée)
  applyPromoCode: async (promoId, userId) => {
    try {
      const promoRef = doc(db, 'promoCodes', promoId);
      const promoSnap = await getDoc(promoRef);
      
      if (!promoSnap.exists()) return false;
      
      const promo = promoSnap.data();
      
      // Incrémenter currentUses et ajouter userId
      await updateDoc(promoRef, {
        currentUses: (promo.currentUses || 0) + 1,
        usedBy: [...(promo.usedBy || []), userId],
        lastUsedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Erreur application code promo:', error);
      return false;
    }
  },
  
  // CRÉER UN CODE PROMO (pour startup)
  createPromoCode: async (promoData) => {
    try {
      const startupId = auth.currentUser?.uid;
      
      // Vérifier si le code existe déjà
      const existingQuery = query(
        collection(db, 'promoCodes'),
        where('code', '==', promoData.code.toUpperCase())
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        return { success: false, error: 'Ce code existe déjà' };
      }
      
      // Créer le code
      const newPromo = {
        code: promoData.code.toUpperCase(),
        type: promoData.type,
        value: parseFloat(promoData.value),
        active: true,
        
        startDate: promoData.startDate || new Date(),
        endDate: promoData.endDate || null,
        
        maxUses: parseInt(promoData.maxUses) || null,
        currentUses: 0,
        minOrderAmount: parseFloat(promoData.minOrderAmount) || 0,
        maxDiscountAmount: parseFloat(promoData.maxDiscountAmount) || null,
        
        startupId: startupId,
        categories: promoData.categories || [],
        firstOrderOnly: promoData.firstOrderOnly || false,
        
        usedBy: [],
        createdAt: serverTimestamp(),
        createdBy: startupId
      };
      
      const docRef = await addDoc(collection(db, 'promoCodes'), newPromo);
      
      return { success: true, promoId: docRef.id };
      
    } catch (error) {
      console.error('Erreur création code promo:', error);
      return { success: false, error: 'Erreur lors de la création' };
    }
  },
  
  // LISTER LES CODES D'UNE STARTUP
  getStartupPromoCodes: async (startupId) => {
    try {
      const promosQuery = query(
        collection(db, 'promoCodes'),
        where('startupId', '==', startupId)
      );
      
      const snapshot = await getDocs(promosQuery);
      
      const promos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return promos;
      
    } catch (error) {
      console.error('Erreur récupération codes promo:', error);
      return [];
    }
  },
  
  // DÉSACTIVER UN CODE
  deactivatePromoCode: async (promoId) => {
    try {
      await updateDoc(doc(db, 'promoCodes', promoId), {
        active: false
      });
      return true;
    } catch (error) {
      console.error('Erreur désactivation code promo:', error);
      return false;
    }
  }
};

export default promoCodeService;
