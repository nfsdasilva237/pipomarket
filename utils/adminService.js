// utils/adminService.js - SERVICE ADMIN
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// CODE SECRET ADMIN
const ADMIN_SECRET_CODE = 'PIPOMARKET_ADMIN_2025';

export const adminService = {
  
  // VÉRIFIER CODE ADMIN
  verifyAdminCode: (code) => {
    return code === ADMIN_SECRET_CODE;
  },

  // CRÉER ADMIN
  createAdmin: async (userId, userData) => {
    try {
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

  // VÉRIFIER SI USER EST ADMIN
  isAdmin: async (userId) => {
    try {
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
      return null;
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
