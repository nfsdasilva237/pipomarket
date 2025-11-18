// utils/adminService.js - SERVICE ADMIN AVEC INVITATIONS SÉCURISÉES
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy, addDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import * as Crypto from 'expo-crypto';

// Générer un code d'invitation sécurisé
const generateSecureInviteCode = async () => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const hexString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `ADMIN_${hexString.toUpperCase()}`;
};

// Hash un code pour stockage sécurisé
const hashCode = async (code) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    code
  );
};

export const adminService = {

  // CRÉER UNE INVITATION ADMIN (par un admin existant)
  createAdminInvitation: async (creatorAdminId, inviteeEmail) => {
    try {
      // Vérifier que le créateur est bien admin
      const isCreatorAdmin = await adminService.isAdmin(creatorAdminId);
      if (!isCreatorAdmin) {
        return { success: false, error: 'Seuls les admins peuvent créer des invitations' };
      }

      // Générer code unique
      const inviteCode = await generateSecureInviteCode();
      const hashedCode = await hashCode(inviteCode);

      // Expiration dans 24h
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Sauvegarder l'invitation
      await addDoc(collection(db, 'adminInvitations'), {
        hashedCode: hashedCode,
        inviteeEmail: inviteeEmail.toLowerCase(),
        createdBy: creatorAdminId,
        createdAt: new Date(),
        expiresAt: expiresAt,
        used: false,
        usedBy: null,
        usedAt: null,
      });

      return {
        success: true,
        inviteCode: inviteCode,
        expiresAt: expiresAt,
        message: `Code d'invitation créé pour ${inviteeEmail}. Expire dans 24h.`
      };
    } catch (error) {
      console.error('Erreur création invitation admin:', error);
      return { success: false, error: error.message };
    }
  },

  // VÉRIFIER ET UTILISER UN CODE D'INVITATION
  verifyAndUseInvitation: async (inviteCode, userEmail, userId) => {
    try {
      const hashedCode = await hashCode(inviteCode);

      // Chercher l'invitation
      const q = query(
        collection(db, 'adminInvitations'),
        where('hashedCode', '==', hashedCode),
        where('used', '==', false)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Code d\'invitation invalide ou déjà utilisé' };
      }

      const invitationDoc = snapshot.docs[0];
      const invitation = invitationDoc.data();

      // Vérifier l'email
      if (invitation.inviteeEmail !== userEmail.toLowerCase()) {
        return { success: false, error: 'Ce code est réservé à une autre adresse email' };
      }

      // Vérifier expiration
      if (invitation.expiresAt.toDate() < new Date()) {
        return { success: false, error: 'Code d\'invitation expiré' };
      }

      // Marquer comme utilisé
      await updateDoc(doc(db, 'adminInvitations', invitationDoc.id), {
        used: true,
        usedBy: userId,
        usedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur vérification invitation:', error);
      return { success: false, error: error.message };
    }
  },

  // CRÉER ADMIN AVEC INVITATION
  createAdminWithInvitation: async (userId, userData, inviteCode) => {
    try {
      // Vérifier et utiliser l'invitation
      const inviteResult = await adminService.verifyAndUseInvitation(
        inviteCode,
        userData.email,
        userId
      );

      if (!inviteResult.success) {
        return inviteResult;
      }

      // Créer le compte admin
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        role: 'admin',
        createdAt: new Date(),
        isAdmin: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur création admin:', error);
      return { success: false, error: error.message };
    }
  },

  // CRÉER LE PREMIER ADMIN (Bootstrap - une seule fois)
  // Utiliser uniquement via Firebase Console ou script sécurisé
  createFirstAdmin: async (userId, userData, masterKey) => {
    try {
      // Le master key doit être configuré côté serveur/Firebase Functions
      // Pour l'instant, on vérifie qu'il n'y a pas d'admin existant

      const stats = await adminService.getGlobalStats();
      if (stats && stats.admins > 0) {
        return {
          success: false,
          error: 'Des admins existent déjà. Utilisez le système d\'invitation.'
        };
      }

      // Vérifier le master key (stocké en variable d'environnement)
      // En production, ceci devrait être vérifié via Firebase Functions
      const expectedHash = 'YOUR_MASTER_KEY_HASH_HERE'; // À configurer
      const providedHash = await hashCode(masterKey);

      if (providedHash !== expectedHash) {
        return { success: false, error: 'Master key invalide' };
      }

      await setDoc(doc(db, 'users', userId), {
        ...userData,
        role: 'admin',
        createdAt: new Date(),
        isAdmin: true,
        isFirstAdmin: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur création premier admin:', error);
      return { success: false, error: error.message };
    }
  },

  // LISTE DES INVITATIONS ACTIVES (pour admin)
  getActiveInvitations: async () => {
    try {
      const q = query(
        collection(db, 'adminInvitations'),
        where('used', '==', false),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const now = new Date();

      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          expiresAt: doc.data().expiresAt?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
        }))
        .filter(inv => inv.expiresAt > now); // Filtrer les expirés
    } catch (error) {
      console.error('Erreur récupération invitations:', error);
      return [];
    }
  },

  // RÉVOQUER UNE INVITATION
  revokeInvitation: async (invitationId) => {
    try {
      await deleteDoc(doc(db, 'adminInvitations', invitationId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // VÉRIFIER SI USER EST ADMIN
  isAdmin: async (userId) => {
    try {
      if (!userId) {
        return false;
      }
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() && userDoc.data().role === 'admin';
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      return false;
    }
  },

  // OBTENIR RÔLE USER
  getUserRole: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data().role || 'client' : 'client';
    } catch (error) {
      console.error('Erreur récupération rôle:', error);
      return 'client';
    }
  },

  // PROMOUVOIR USER EN ADMIN
  promoteToAdmin: async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin',
        isAdmin: true,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // RÉTROGRADER ADMIN
  demoteAdmin: async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'client',
        isAdmin: false,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // STATISTIQUES GLOBALES
  getGlobalStats: async () => {
    try {
      // Vérifier que auth existe et que l'utilisateur est authentifié
      if (!auth || !auth.currentUser) {
        console.error('Erreur stats globales: Utilisateur non authentifié');
        return {
          totalStartups: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalUsers: 0,
          clients: 0,
          startupUsers: 0,
          admins: 0,
          totalPromos: 0,
        };
      }

      // Compter startups
      const startupsSnap = await getDocs(collection(db, 'startups'));
      const totalStartups = startupsSnap.size;

      // Compter produits
      const productsSnap = await getDocs(collection(db, 'products'));
      const totalProducts = productsSnap.size;

      // Compter commandes
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const totalOrders = ordersSnap.size;

      // Calculer revenus totaux
      let totalRevenue = 0;
      ordersSnap.forEach(doc => {
        const order = doc.data();
        totalRevenue += order.total || 0;
      });

      // Compter utilisateurs
      const usersSnap = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnap.size;

      let clients = 0, startupUsers = 0, admins = 0;
      usersSnap.forEach(doc => {
        const role = doc.data().role || 'client';
        if (role === 'admin') admins++;
        else if (role === 'startup') startupUsers++;
        else clients++;
      });

      // Compter codes promo
      const promosSnap = await getDocs(collection(db, 'promoCodes'));
      const totalPromos = promosSnap.size;

      return {
        totalStartups,
        totalProducts,
        totalOrders,
        totalRevenue,
        totalUsers,
        clients,
        startupUsers,
        admins,
        totalPromos,
      };
    } catch (error) {
      console.error('Erreur stats globales:', error);
      // Retourner des stats vides en cas d'erreur de permissions
      return {
        totalStartups: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        clients: 0,
        startupUsers: 0,
        admins: 0,
        totalPromos: 0,
      };
    }
  },

  // OBTENIR TOUTES LES STARTUPS
  getAllStartups: async () => {
    try {
      const q = query(collection(db, 'startups'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération startups:', error);
      return [];
    }
  },

  // OBTENIR TOUS LES PRODUITS
  getAllProducts: async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      return [];
    }
  },

  // OBTENIR TOUTES LES COMMANDES
  getAllOrders: async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      return [];
    }
  },

  // OBTENIR TOUS LES UTILISATEURS
  getAllUsers: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération users:', error);
      return [];
    }
  },

  // OBTENIR TOUS LES CODES PROMO
  getAllPromoCodes: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'promoCodes'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur récupération codes promo:', error);
      return [];
    }
  },

  // SUPPRIMER STARTUP (ADMIN)
  deleteStartup: async (startupId) => {
    try {
      // Supprimer startup
      await deleteDoc(doc(db, 'startups', startupId));

      // Supprimer produits associés
      const productsQ = query(collection(db, 'products'), where('startupId', '==', startupId));
      const productsSnap = await getDocs(productsQ);

      const deletePromises = productsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression startup:', error);
      return { success: false, error: error.message };
    }
  },

  // SUPPRIMER PRODUIT (ADMIN)
  deleteProduct: async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // SUPPRIMER USER (ADMIN)
  deleteUser: async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // MODIFIER STATUT COMMANDE (ADMIN)
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ACTIVER/DÉSACTIVER STARTUP
  toggleStartupStatus: async (startupId, active) => {
    try {
      await updateDoc(doc(db, 'startups', startupId), {
        active: active,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ACTIVER/DÉSACTIVER PRODUIT
  toggleProductStatus: async (productId, available) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        available: available,
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default adminService;
