// utils/bdlOrderService.js - Service de gestion des commandes BDL Studio
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

class BDLOrderService {
  // Créer une nouvelle commande
  async createOrder(orderData) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les infos utilisateur
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      const order = {
        // Infos client
        userId,
        customerName: orderData.customerName || userData?.displayName || '',
        customerEmail: orderData.customerEmail || userData?.email || '',
        customerPhone: orderData.customerPhone || userData?.phone || '',

        // Infos service
        serviceId: orderData.serviceId,
        serviceName: orderData.serviceName,
        serviceIcon: orderData.serviceIcon,

        // Infos package
        packageId: orderData.packageId,
        packageName: orderData.packageName,
        packagePrice: orderData.packagePrice,
        packageFeatures: orderData.packageFeatures,

        // Détails projet
        projectDetails: orderData.projectDetails || '',

        // Paiement
        paymentMethod: orderData.paymentMethod, // 'mobile_money', 'card', 'cash'
        paymentStatus: 'pending', // 'pending', 'paid', 'failed'
        paymentPhone: orderData.paymentPhone || '',

        // Statut commande
        status: 'pending', // 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'

        // Dates
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Métadonnées
        totalAmount: orderData.packagePrice,
        currency: 'XAF',
      };

      const docRef = await addDoc(collection(db, 'bdl_orders'), order);

      return {
        success: true,
        orderId: docRef.id,
        order: { id: docRef.id, ...order }
      };
    } catch (error) {
      console.error('Erreur création commande BDL:', error);
      throw error;
    }
  }

  // Récupérer les commandes d'un utilisateur
  async getUserOrders(userId) {
    try {
      const q = query(
        collection(db, 'bdl_orders'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Trier par date décroissante
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return orders;
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      return [];
    }
  }

  // Récupérer une commande spécifique
  async getOrder(orderId) {
    try {
      const docRef = doc(db, 'bdl_orders', orderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur récupération commande:', error);
      return null;
    }
  }

  // Mettre à jour le statut de paiement
  async updatePaymentStatus(orderId, status) {
    try {
      const docRef = doc(db, 'bdl_orders', orderId);
      await updateDoc(docRef, {
        paymentStatus: status,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour paiement:', error);
      throw error;
    }
  }

  // Mettre à jour le statut de la commande
  async updateOrderStatus(orderId, status) {
    try {
      const docRef = doc(db, 'bdl_orders', orderId);
      await updateDoc(docRef, {
        status: status,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      throw error;
    }
  }

  // Récupérer toutes les commandes (admin)
  async getAllOrders() {
    try {
      const querySnapshot = await getDocs(collection(db, 'bdl_orders'));
      const orders = [];

      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });

      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return orders;
    } catch (error) {
      console.error('Erreur récupération toutes commandes:', error);
      return [];
    }
  }

  // Obtenir le statut en français
  getStatusLabel(status) {
    const labels = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'in_progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }

  // Obtenir le statut de paiement en français
  getPaymentStatusLabel(status) {
    const labels = {
      'pending': 'En attente',
      'paid': 'Payé',
      'failed': 'Échoué'
    };
    return labels[status] || status;
  }

  // Obtenir la couleur du statut
  getStatusColor(status) {
    const colors = {
      'pending': '#FF9800',
      'confirmed': '#2196F3',
      'in_progress': '#9C27B0',
      'completed': '#4CAF50',
      'cancelled': '#F44336'
    };
    return colors[status] || '#999';
  }
}

export default new BDLOrderService();
