// utils/adminService.js - SERVICE ADMIN
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import notificationService from './notificationService';

// CODE SECRET ADMIN
const ADMIN_SECRET_CODE = 'PIPOMARKET_ADMIN_2025';

// NIVEAUX ADMIN ET PERMISSIONS
const ADMIN_LEVELS = {
  superadmin: {
    label: 'Super Admin',
    permissions: {
      manageStartups: true,
      manageProducts: true,
      manageOrders: true,
      manageUsers: true,
      managePromoCodes: true,
      manageAmbassadors: true,
      promoteAdmins: true,
      changeAdminLevels: true,
      deleteData: true,
      viewStats: true,
    },
  },
  admin: {
    label: 'Admin',
    permissions: {
      manageStartups: true,
      manageProducts: true,
      manageOrders: true,
      manageUsers: true,
      managePromoCodes: true,
      manageAmbassadors: false,
      promoteAdmins: false,
      changeAdminLevels: false,
      deleteData: true,
      viewStats: true,
    },
  },
  moderator: {
    label: 'Modérateur',
    permissions: {
      manageStartups: false,
      manageProducts: true,
      manageOrders: true,
      manageUsers: false,
      managePromoCodes: false,
      manageAmbassadors: false,
      promoteAdmins: false,
      changeAdminLevels: false,
      deleteData: false,
      viewStats: true,
    },
  },
};

// VÉRIFIER CODE ADMIN
export const verifyAdminCode = (code) => {
  return code === ADMIN_SECRET_CODE;
};

// CRÉER ADMIN
export const createAdmin = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      role: 'admin',
      adminLevel: 'admin',
      createdAt: new Date(),
      isAdmin: true,
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur création admin:', error);
    return { success: false, error: error.message };
  }
};

// VÉRIFIER SI USER EST ADMIN
export const isAdmin = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() && userDoc.data().role === 'admin';
  } catch (error) {
    console.error('Erreur vérification admin:', error);
    return false;
  }
};

// OBTENIR RÔLE USER
export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().role || 'client' : 'client';
  } catch (error) {
    console.error('Erreur récupération rôle:', error);
    return 'client';
  }
};

// OBTENIR TOUTES LES PERMISSIONS D'UN ADMIN
export const getAllPermissions = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return null;
    }

    const adminLevel = userDoc.data().adminLevel || 'admin';
    const levelConfig = ADMIN_LEVELS[adminLevel] || ADMIN_LEVELS.admin;

    return {
      ...levelConfig.permissions,
      level: adminLevel,
      label: levelConfig.label,
    };
  } catch (error) {
    console.error('Erreur récupération permissions:', error);
    return null;
  }
};

// PROMOUVOIR USER EN ADMIN
export const promoteToAdmin = async (userId, level = 'moderator') => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
      adminLevel: level,
      isAdmin: true,
      promotedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// CHANGER NIVEAU ADMIN
export const changeAdminLevel = async (userId, newLevel) => {
  try {
    if (!ADMIN_LEVELS[newLevel]) {
      return { success: false, error: 'Niveau invalide' };
    }

    await updateDoc(doc(db, 'users', userId), {
      adminLevel: newLevel,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// RÉTROGRADER ADMIN
export const demoteAdmin = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: 'client',
      adminLevel: null,
      isAdmin: false,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// STATISTIQUES GLOBALES
export const getGlobalStats = async () => {
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
};

// OBTENIR TOUTES LES STARTUPS
export const getAllStartups = async () => {
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
};

// OBTENIR TOUS LES PRODUITS
export const getAllProducts = async () => {
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
};

// OBTENIR TOUTES LES COMMANDES
export const getAllOrders = async () => {
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
};

// OBTENIR TOUS LES UTILISATEURS
export const getAllUsers = async () => {
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
};

// OBTENIR TOUS LES CODES PROMO
export const getAllPromoCodes = async () => {
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
};

// SUPPRIMER STARTUP (ADMIN)
export const deleteStartup = async (startupId) => {
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
};

// SUPPRIMER PRODUIT (ADMIN)
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// SUPPRIMER USER (ADMIN)
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// MODIFIER STATUT COMMANDE (ADMIN)
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    // Récupérer la commande pour avoir l'userId
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return { success: false, error: 'Commande introuvable' };
    }

    const orderData = orderDoc.data();

    // Mettre à jour le statut
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: new Date(),
      adminUpdated: true,
    });

    // ✅ ENVOYER NOTIFICATION AU CLIENT
    try {
      let notifTitle = '';
      let notifBody = '';

      switch (newStatus) {
        case 'processing':
          notifTitle = '🏭 Commande en préparation';
          notifBody = 'Votre commande est en cours de préparation.';
          break;
        case 'shipped':
          notifTitle = '🚚 Commande expédiée';
          notifBody = 'Votre commande a été expédiée !';
          break;
        case 'delivered':
          notifTitle = '✅ Commande livrée';
          notifBody = 'Votre commande a été livrée. Merci !';
          break;
        case 'cancelled':
          notifTitle = '❌ Commande annulée';
          notifBody = 'Votre commande a été annulée.';
          break;
        default:
          notifTitle = '📦 Mise à jour commande';
          notifBody = `Votre commande a été mise à jour: ${newStatus}`;
      }

      if (orderData.userId && notifTitle) {
        await notificationService.sendNotificationToUser(
          orderData.userId,
          notifTitle,
          notifBody,
          {
            type: 'order_status_admin',
            orderId: orderId,
            status: newStatus
          }
        );
        console.log(`✅ Notification admin envoyée au client pour commande ${orderId}`);
      }
    } catch (notifError) {
      console.error('⚠️ Erreur notification admin:', notifError);
      // Ne pas bloquer la mise à jour si notification échoue
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ACTIVER/DÉSACTIVER STARTUP
export const toggleStartupStatus = async (startupId, active) => {
  try {
    await updateDoc(doc(db, 'startups', startupId), {
      active: active,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ACTIVER/DÉSACTIVER PRODUIT
export const toggleProductStatus = async (productId, available) => {
  try {
    await updateDoc(doc(db, 'products', productId), {
      available: available,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Export par défaut pour compatibilité
export default {
  verifyAdminCode,
  createAdmin,
  isAdmin,
  getUserRole,
  getAllPermissions,
  promoteToAdmin,
  changeAdminLevel,
  demoteAdmin,
  getGlobalStats,
  getAllStartups,
  getAllProducts,
  getAllOrders,
  getAllUsers,
  getAllPromoCodes,
  deleteStartup,
  deleteProduct,
  deleteUser,
  updateOrderStatus,
  toggleStartupStatus,
  toggleProductStatus,
};