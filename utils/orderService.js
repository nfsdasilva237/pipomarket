// utils/orderService.js - ✅ AVEC COMMISSION AMBASSADEUR
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import ambassadorService from './ambassadorService'; // ✅ AJOUTÉ
import { notificationService } from './notificationService';

export const orderService = {
  // Créer une nouvelle commande
  createOrder: async (orderData) => {
    try {
      const { userId, items, total, deliveryInfo } = orderData;

      // Créer la commande (éviter les undefined)
      const orderRef = await addDoc(collection(db, 'orders'), {
        userId: userId || 'anonymous',
        items: items || [],
        total: total || 0,
        deliveryInfo: deliveryInfo || {},
        status: 'pending', // pending, processing, shipped, delivered, cancelled
        createdAt: new Date(),
      });

      // Grouper les items par startup
      const itemsByStartup = items.reduce((acc, item) => {
        if (!acc[item.startupId]) {
          acc[item.startupId] = [];
        }
        acc[item.startupId].push(item);
        return acc;
      }, {});

      // Notifier chaque startup
      await Promise.all(
        Object.entries(itemsByStartup).map(async ([startupId, startupItems]) => {
          const startupTotal = startupItems.reduce(
            (sum, item) => sum + item.price * item.quantity, 
            0
          );

          await notificationService.sendNotificationToStartup(
            startupId,
            '🛍️ Nouvelle commande !',
            `Vous avez reçu une nouvelle commande de ${startupTotal.toLocaleString('fr-FR')} FCFA`,
            {
              type: 'new_order',
              orderId: orderRef.id,
              total: startupTotal,
              itemCount: startupItems.length
            }
          );
        })
      );

      return { success: true, orderId: orderRef.id };
    } catch (error) {
      console.error('Erreur création commande:', error);
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour le statut d'une commande
  updateOrderStatus: async (orderId, newStatus, startupId = null) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        return { success: false, error: 'Commande introuvable' };
      }

      const orderData = orderDoc.data();
      const userId = orderData.userId;

      // Si startupId fourni, ne mettre à jour que les items de cette startup
      if (startupId) {
        const updatedItems = orderData.items.map(item => {
          if (item.startupId === startupId) {
            return { ...item, status: newStatus };
          }
          return item;
        });

        await updateDoc(orderRef, { 
          items: updatedItems,
          lastUpdated: new Date()
        });
      } else {
        await updateDoc(orderRef, { 
          status: newStatus,
          lastUpdated: new Date()
        });
      }

      // ✅ CRITIQUE: Enregistrer commission ambassadeur si commande livrée
      if (newStatus === 'delivered') {
        try {
          await ambassadorService.recordAmbassadorEarning(
            orderId,
            userId,
            orderData.total
          );
          console.log('✅ Commission ambassadeur enregistrée pour commande', orderId);
        } catch (commissionError) {
          // Ne pas bloquer la validation si erreur commission
          console.error('⚠️ Erreur enregistrement commission:', commissionError);
        }
      }

      // Préparer notification au client
      let notifTitle = '';
      let notifBody = '';
      let notifType = '';

      switch (newStatus) {
        case 'processing':
          notifTitle = '🏭 Commande en préparation';
          notifBody = 'Votre commande est en cours de préparation.';
          notifType = 'order_processing';
          break;
        case 'shipped':
          notifTitle = '🚚 Commande expédiée';
          notifBody = 'Votre commande a été expédiée !';
          notifType = 'order_shipped';
          break;
        case 'delivered':
          notifTitle = '✅ Commande livrée';
          notifBody = 'Votre commande a été livrée. Bonne dégustation !';
          notifType = 'order_delivered';
          break;
        case 'cancelled':
          notifTitle = '❌ Commande annulée';
          notifBody = 'Votre commande a été annulée.';
          notifType = 'order_cancelled';
          break;
      }

      // Si statut nécessite notification
      if (notifTitle) {
        await notificationService.sendNotificationToUser(
          userId,
          notifTitle,
          notifBody,
          {
            type: notifType,
            orderId,
            status: newStatus
          }
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour commande:', error);
      return { success: false, error: error.message };
    }
  },

  // Annuler une commande
  cancelOrder: async (orderId) => {
    try {
      return await orderService.updateOrderStatus(orderId, 'cancelled');
    } catch (error) {
      console.error('Erreur annulation commande:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtenir une commande
  getOrder: async (orderId) => {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        return { success: false, error: 'Commande introuvable' };
      }
      return { 
        success: true, 
        order: { id: orderDoc.id, ...orderDoc.data() } 
      };
    } catch (error) {
      console.error('Erreur récupération commande:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtenir les commandes d'un utilisateur
  getUserOrders: async (userId) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        where('status', '!=', 'cancelled')
      );
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, orders };
    } catch (error) {
      console.error('Erreur récupération commandes utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtenir les commandes d'une startup
  getStartupOrders: async (startupId) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('items.startupId', 'array-contains', startupId)
      );
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, orders };
    } catch (error) {
      console.error('Erreur récupération commandes startup:', error);
      return { success: false, error: error.message };
    }
  }
};

export default orderService;