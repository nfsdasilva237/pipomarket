// utils/ambassadorService.js - ✅ VERSION COMPLÈTE AMÉLIORÉE
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export const ambassadorService = {
  
  // VÉRIFIER CODE INVITATION AMBASSADEUR
  verifyAmbassadorCode: async (code) => {
    try {
    // ✅ NOUVEAU: Accepte lettres ET chiffres
    if (!code || !code.match(/^AMB-[A-Z0-9]{5}$/)) {
      return false;
    }

      const codesRef = collection(db, 'ambassadorInviteCodes');
      const q = query(codesRef, where('code', '==', code), where('used', '==', false));
      const snapshot = await getDocs(q);

      return !snapshot.empty;
    } catch (error) {
      console.error('Erreur vérification code ambassadeur:', error);
      return false;
    }
  },
  
  // GÉNÉRER CODE AMBASSADEUR UNIQUE
generateAmbassadorCode: () => {
  const prefix = 'AMB';
  // ✅ NOUVEAU: Génère avec lettres
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return `${prefix}-${random}`;
},
  // ✅ MARQUER CODE INVITATION COMME UTILISÉ
  markInviteCodeAsUsed: async (code, userId, userEmail) => {
    try {
      const codesRef = collection(db, 'ambassadorInviteCodes');
      const q = query(codesRef, where('code', '==', code));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const codeDoc = snapshot.docs[0];
        await updateDoc(codeDoc.ref, {
          used: true,
          usedBy: userId,
          usedByEmail: userEmail,
          usedAt: new Date(),
        });
        return { success: true };
      }
      
      return { success: false, error: 'Code non trouvé' };
    } catch (error) {
      console.error('Erreur marquage code:', error);
      return { success: false, error: error.message };
    }
  },

  // CRÉER AMBASSADEUR
  createAmbassador: async (userId, userData) => {
    try {
      const existingQ = query(
        collection(db, 'ambassadors'),
        where('userId', '==', userId)
      );
      const existingSnap = await getDocs(existingQ);

      if (!existingSnap.empty) {
        return { success: false, error: 'Vous êtes déjà ambassadeur' };
      }

      let code = ambassadorService.generateAmbassadorCode();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const codeQ = query(
          collection(db, 'ambassadors'),
          where('code', '==', code)
        );
        const codeSnap = await getDocs(codeQ);
        
        if (codeSnap.empty) {
          isUnique = true;
        } else {
          code = ambassadorService.generateAmbassadorCode();
          attempts++;
        }
      }

      if (!isUnique) {
        return { success: false, error: 'Impossible de générer un code unique' };
      }

      const ambassadorData = {
        userId: userId,
        code: code,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        totalEarnings: 0,
        totalOrders: 0,
        totalReferrals: 0,
        pendingPayment: 0,
        paidOut: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ambassadorRef = await addDoc(collection(db, 'ambassadors'), ambassadorData);

      await updateDoc(doc(db, 'users', userId), {
        isAmbassador: true,
        ambassadorCode: code,
        ambassadorId: ambassadorRef.id,
      });

      return { success: true, ambassadorId: ambassadorRef.id, code: code };
    } catch (error) {
      console.error('Erreur création ambassadeur:', error);
      return { success: false, error: error.message };
    }
  },

  // VÉRIFIER CODE PROMO
  verifyPromoCode: async (code) => {
    try {
      const q = query(
        collection(db, 'ambassadors'),
        where('code', '==', code.toUpperCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, valid: false, error: 'Code invalide' };
      }

      const ambassadorDoc = snapshot.docs[0];
      const ambassadorData = ambassadorDoc.data();

      if (!ambassadorData.active) {
        return { success: false, valid: false, error: 'Code inactif' };
      }

      return {
        success: true,
        valid: true,
        ambassadorId: ambassadorDoc.id,
        code: ambassadorData.code,
        name: ambassadorData.name,
      };
    } catch (error) {
      return { success: false, valid: false, error: error.message };
    }
  },

  // LIER CODE PROMO À USER
  linkPromoCodeToUser: async (userId, promoCode) => {
    try {
      const verification = await ambassadorService.verifyPromoCode(promoCode);
      
      if (!verification.valid) {
        return { success: false, error: verification.error };
      }

      await updateDoc(doc(db, 'users', userId), {
        promoCode: promoCode.toUpperCase(),
        ambassadorReferralId: verification.ambassadorId,
        promoCodeLinkedAt: new Date(),
      });

      // ✅ Incrémenter nombre de filleuls
      const ambassadorRef = doc(db, 'ambassadors', verification.ambassadorId);
      const ambassadorDoc = await getDoc(ambassadorRef);
      if (ambassadorDoc.exists()) {
        await updateDoc(ambassadorRef, {
          totalReferrals: (ambassadorDoc.data().totalReferrals || 0) + 1,
          updatedAt: new Date(),
        });
      }

      return { success: true, ambassadorId: verification.ambassadorId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ✅ ENREGISTRER GAIN AMBASSADEUR (APPELÉ QUAND COMMANDE VALIDÉE)
  recordAmbassadorEarning: async (orderId, userId, orderAmount) => {
    try {
      // Récupérer user pour voir son code parrain
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      const userData = userDoc.data();
      const ambassadorReferralId = userData.ambassadorReferralId;

      if (!ambassadorReferralId) {
        // Pas de parrain, pas de commission
        return { success: true, noReferral: true };
      }

      // Vérifier que la commande n'a pas déjà été comptée
      const existingQ = query(
        collection(db, 'ambassadorEarnings'),
        where('orderId', '==', orderId)
      );
      const existingSnap = await getDocs(existingQ);

      if (!existingSnap.empty) {
        return { success: false, error: 'Commission déjà enregistrée' };
      }

      // Commission fixe: 25 FCFA par commande validée
      const COMMISSION = 25;

      // Créer earning
      const earningData = {
        ambassadorId: ambassadorReferralId,
        userId: userId,
        orderId: orderId,
        amount: COMMISSION,
        orderAmount: orderAmount,
        status: 'pending',
        createdAt: new Date(),
        paidAt: null,
      };

      await addDoc(collection(db, 'ambassadorEarnings'), earningData);

      // Mettre à jour stats ambassadeur
      const ambassadorRef = doc(db, 'ambassadors', ambassadorReferralId);
      const ambassadorDoc = await getDoc(ambassadorRef);

      if (ambassadorDoc.exists()) {
        const ambassadorData = ambassadorDoc.data();
        await updateDoc(ambassadorRef, {
          totalEarnings: (ambassadorData.totalEarnings || 0) + COMMISSION,
          totalOrders: (ambassadorData.totalOrders || 0) + 1,
          pendingPayment: (ambassadorData.pendingPayment || 0) + COMMISSION,
          lastEarningAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true, amount: COMMISSION };
    } catch (error) {
      console.error('Erreur enregistrement gain:', error);
      return { success: false, error: error.message };
    }
  },

  // OBTENIR INFOS AMBASSADEUR
  getAmbassadorByUserId: async (userId) => {
    try {
      const q = query(
        collection(db, 'ambassadors'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Ambassadeur non trouvé' };
      }

      const ambassadorDoc = snapshot.docs[0];
      return {
        success: true,
        ambassador: {
          id: ambassadorDoc.id,
          ...ambassadorDoc.data()
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ✅ OBTENIR FILLEULS AMBASSADEUR
  getAmbassadorReferrals: async (ambassadorId) => {
    try {
      const q = query(
        collection(db, 'users'),
        where('ambassadorReferralId', '==', ambassadorId)
      );
      const snapshot = await getDocs(q);

      const referrals = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        joinedAt: doc.data().promoCodeLinkedAt,
      }));

      return { success: true, referrals };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // OBTENIR GAINS AMBASSADEUR
  getAmbassadorEarnings: async (ambassadorId) => {
    try {
      const q = query(
        collection(db, 'ambassadorEarnings'),
        where('ambassadorId', '==', ambassadorId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const earnings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, earnings };
    } catch (error) {
      console.error('Erreur récupération gains:', error);
      return { success: false, error: error.message, earnings: [] };
    }
  },

  // PAYER AMBASSADEUR (ADMIN)
  payAmbassador: async (ambassadorId, amount) => {
    try {
      const ambassadorDoc = await getDoc(doc(db, 'ambassadors', ambassadorId));
      
      if (!ambassadorDoc.exists()) {
        return { success: false, error: 'Ambassadeur non trouvé' };
      }

      const ambassadorData = ambassadorDoc.data();

      // Mettre à jour ambassadeur
      await updateDoc(doc(db, 'ambassadors', ambassadorId), {
        pendingPayment: Math.max(0, (ambassadorData.pendingPayment || 0) - amount),
        paidOut: (ambassadorData.paidOut || 0) + amount,
        lastPaidAt: new Date(),
        updatedAt: new Date(),
      });

      // Marquer gains comme payés
      const earningsQ = query(
        collection(db, 'ambassadorEarnings'),
        where('ambassadorId', '==', ambassadorId),
        where('status', '==', 'pending')
      );
      const earningsSnap = await getDocs(earningsQ);

      let paidAmount = 0;
      for (const earningDoc of earningsSnap.docs) {
        if (paidAmount + 25 <= amount) {
          await updateDoc(earningDoc.ref, {
            status: 'paid',
            paidAt: new Date(),
          });
          paidAmount += 25;
        }
      }

      // Créer log paiement
      await addDoc(collection(db, 'ambassadorPayments'), {
        ambassadorId: ambassadorId,
        ambassadorName: ambassadorData.name,
        amount: amount,
        paidAt: new Date(),
        method: 'manual',
        paidBy: 'admin',
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur paiement ambassadeur:', error);
      return { success: false, error: error.message };
    }
  },

  // OBTENIR TOUS AMBASSADEURS (ADMIN)
  getAllAmbassadors: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'ambassadors'));
      const ambassadors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Trier par gains pending décroissant
      ambassadors.sort((a, b) => (b.pendingPayment || 0) - (a.pendingPayment || 0));

      return { success: true, ambassadors };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // OBTENIR TOUS LES CODES D'INVITATION (ADMIN)
  getAllInviteCodes: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'ambassadorInviteCodes'));
      const codes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return codes;
    } catch (error) {
      console.error('Erreur récupération codes:', error);
      throw error;
    }
  },

  // SUPPRIMER UN CODE D'INVITATION (ADMIN)
  deleteInviteCode: async (codeId) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'ambassadorInviteCodes', codeId));
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression code:', error);
      return { success: false, error: error.message };
    }
  },

  // ACTIVER/DÉSACTIVER UN CODE D'INVITATION (ADMIN)
  toggleInviteCode: async (codeId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'ambassadorInviteCodes', codeId), {
        disabled: !currentStatus,
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur toggle code:', error);
      return { success: false, error: error.message };
    }
  },

  // GÉNÉRER UN NOUVEAU CODE D'INVITATION (ADMIN)
  generateInviteCode: async () => {
    try {
      let code = ambassadorService.generateAmbassadorCode();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const codeQ = query(
          collection(db, 'ambassadorInviteCodes'),
          where('code', '==', code)
        );
        const codeSnap = await getDocs(codeQ);
        
        if (codeSnap.empty) {
          isUnique = true;
        } else {
          code = ambassadorService.generateAmbassadorCode();
          attempts++;
        }
      }

      if (!isUnique) {
        return { success: false, error: 'Impossible de générer un code unique' };
      }

      const inviteCodeData = {
        code: code,
        used: false,
        disabled: false,
        createdAt: new Date(),
        usedBy: null,
        usedByEmail: null,
        usedAt: null
      };

      await addDoc(collection(db, 'ambassadorInviteCodes'), inviteCodeData);

      return { success: true, code: code };
    } catch (error) {
      console.error('Erreur génération code invitation:', error);
      return { success: false, error: error.message };
    }
  },

  // STATS GLOBALES AMBASSADEURS (ADMIN)
  getGlobalAmbassadorStats: async () => {
    try {
      const ambassadorsSnap = await getDocs(collection(db, 'ambassadors'));
      
      let totalAmbassadors = 0;
      let activeAmbassadors = 0;
      let totalEarnings = 0;
      let pendingPayments = 0;
      let totalOrders = 0;
      let totalReferrals = 0;

      ambassadorsSnap.forEach(doc => {
        const data = doc.data();
        totalAmbassadors++;
        if (data.active) activeAmbassadors++;
        totalEarnings += data.totalEarnings || 0;
        pendingPayments += data.pendingPayment || 0;
        totalOrders += data.totalOrders || 0;
        totalReferrals += data.totalReferrals || 0;
      });

      return {
        success: true,
        stats: {
          totalAmbassadors,
          activeAmbassadors,
          totalEarnings,
          pendingPayments,
          totalOrders,
          totalReferrals,
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ✅ TOP AMBASSADEURS
  getTopAmbassadors: async (limitCount = 10) => {
    try {
      const snapshot = await getDocs(collection(db, 'ambassadors'));
      const ambassadors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Trier par total earnings
      ambassadors.sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0));

      return {
        success: true,
        ambassadors: ambassadors.slice(0, limitCount)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default ambassadorService;