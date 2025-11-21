// utils/startupInviteService.js - SERVICE CODES INVITATION STARTUP
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

const startupInviteService = {

  // GÉNÉRER CODE INVITATION STARTUP
  generateInviteCode: async (adminId, adminName, expirationDays = 30, maxUses = 1, notes = '') => {
    try {
      // Générer code unique (format: STARTUP-XXXXX)
      const codeId = `STARTUP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      const codeData = {
        code: codeId,
        createdBy: adminId,
        createdByName: adminName,
        createdAt: new Date(),
        expiresAt: expirationDate,
        maxUses: maxUses,
        usedCount: 0,
        active: true,
        usedBy: [], // Array des startups qui ont utilisé ce code
        notes: notes,
      };

      await addDoc(collection(db, 'startupInviteCodes'), codeData);

      return {
        success: true,
        code: codeId,
        message: `Code ${codeId} créé avec succès`
      };
    } catch (error) {
      console.error('Erreur génération code startup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // VÉRIFIER VALIDITÉ CODE
  verifyInviteCode: async (code) => {
    try {
      if (!code || code.trim() === '') return false;

      console.log('Vérification code startup:', code.trim().toUpperCase());

      const q = query(
        collection(db, 'startupInviteCodes'),
        where('code', '==', code.trim().toUpperCase())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('Code startup non trouvé');
        return false;
      }

      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data();

      console.log('Code startup trouvé:', codeData);

      // Vérifier si actif
      if (!codeData.active) {
        console.log('Code startup inactif');
        return false;
      }

      // Vérifier expiration
      const now = new Date();
      const expiresAt = codeData.expiresAt?.toDate ? codeData.expiresAt.toDate() : new Date(codeData.expiresAt);

      console.log('Expiration:', expiresAt, 'Maintenant:', now);

      if (now > expiresAt) {
        console.log('Code startup expiré');
        return false;
      }

      // Vérifier utilisation max
      if (codeData.usedCount >= codeData.maxUses) {
        console.log('Code startup épuisé');
        return false;
      }

      console.log('Code startup valide!');
      return true;
    } catch (error) {
      console.error('Erreur vérification code startup:', error);
      return false;
    }
  },

  // UTILISER CODE (lors inscription startup)
  useInviteCode: async (code, startupId, startupName) => {
    try {
      const q = query(
        collection(db, 'startupInviteCodes'),
        where('code', '==', code.trim().toUpperCase())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Code invalide' };
      }

      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data();

      // Vérifier validité
      const isValid = await startupInviteService.verifyInviteCode(code);
      if (!isValid) {
        return { success: false, error: 'Code expiré ou déjà utilisé' };
      }

      // Incrémenter compteur et ajouter startup
      const updatedUsedBy = [...(codeData.usedBy || []), {
        startupId,
        startupName,
        usedAt: new Date(),
      }];

      await updateDoc(codeDoc.ref, {
        usedCount: codeData.usedCount + 1,
        usedBy: updatedUsedBy,
        lastUsedAt: new Date(),
      });

      return {
        success: true,
        message: 'Code validé avec succès'
      };
    } catch (error) {
      console.error('Erreur utilisation code startup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // OBTENIR TOUS LES CODES
  getAllCodes: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'startupInviteCodes'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur récupération codes startup:', error);
      return [];
    }
  },

  // ACTIVER/DÉSACTIVER CODE
  toggleCode: async (codeId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'startupInviteCodes', codeId), {
        active: !currentStatus,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // SUPPRIMER CODE
  deleteCode: async (codeId) => {
    try {
      await deleteDoc(doc(db, 'startupInviteCodes', codeId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // OBTENIR STATS CODES
  getCodesStats: async () => {
    try {
      const codes = await startupInviteService.getAllCodes();

      const totalCodes = codes.length;
      const activeCodes = codes.filter(c => c.active).length;
      const expiredCodes = codes.filter(c => {
        const now = new Date();
        const expiresAt = c.expiresAt?.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
        return now > expiresAt;
      }).length;
      const usedCodes = codes.filter(c => c.usedCount > 0).length;
      const totalUses = codes.reduce((sum, c) => sum + (c.usedCount || 0), 0);

      return {
        totalCodes,
        activeCodes,
        expiredCodes,
        usedCodes,
        totalUses,
      };
    } catch (error) {
      console.error('Erreur stats codes:', error);
      return null;
    }
  },
};

export default startupInviteService;