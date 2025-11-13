// utils/paymentService.js - ✅ PHASE 2: COMMISSION DIFFÉRENCIÉE
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationService } from './notificationService';
import subscriptionService from './subscriptionService';

export const paymentService = {
  
  // ✅ PHASE 2: OBTENIR TAUX DE COMMISSION SELON ABONNEMENT
  getCommissionRate: async (startupId) => {
    try {
      const subResult = await subscriptionService.getSubscription(startupId);
      
      if (subResult.success && 
          subResult.subscription.planId === 'premium' &&
          ['trial', 'active'].includes(subResult.subscription.status)) {
        return 0.03; // 3% pour Premium
      }
      
      return 0.05; // 5% pour tous les autres (Starter, Pro, ou sans abo)
    } catch (error) {
      console.error('Erreur calcul commission:', error);
      return 0.05; // Par défaut 5%
    }
  },

  // ✅ PHASE 2: CALCULER FRAIS AVEC COMMISSION
  calculateFees: async (startupId, amount) => {
    const commissionRate = await paymentService.getCommissionRate(startupId);
    const commission = Math.round(amount * commissionRate);
    const startupReceives = amount - commission;
    
    return {
      total: amount,
      commission,
      commissionRate: commissionRate * 100, // Pour afficher "3%" ou "5%"
      startupReceives,
    };
  },
  
  // GÉNÉRER CODE MOBILE MONEY
  generateMobileMoneyCode: (operator, phone, amount) => {
    // Format selon l'opérateur
    const codes = {
      orange: `#150*1*1*${phone}*${amount}#`,
      mtn: `#150*50*${phone}*${amount}#`,
      moov: `#222*1*${phone}*${amount}#`,
    };
    
    return codes[operator] || `#150*50*${phone}*${amount}#`;
  },

  // CRÉER PAIEMENT
  createPayment: async (orderData) => {
    try {
      // Récupérer les informations de l'utilisateur et de la commande
      const [userDoc, orderDoc] = await Promise.all([
        getDoc(doc(db, 'users', orderData.userId)),
        getDoc(doc(db, 'orders', orderData.orderId))
      ]);
      
      const userData = userDoc.data();
      const orderDetails = orderDoc.data();

      // ✅ PHASE 2: Calculer commission
      const fees = await paymentService.calculateFees(orderData.startupId, orderData.total);

      const paymentData = {
        orderId: orderData.orderId,
        startupId: orderData.startupId,
        userId: orderData.userId,
        amount: orderData.total,
        // ✅ PHASE 2: Ajouter infos commission
        commission: fees.commission,
        commissionRate: fees.commissionRate,
        startupReceives: fees.startupReceives,
        startupPhone: orderData.startupPhone,
        startupName: orderData.startupName,
        operator: orderData.operator || 'mtn',
        mobileMoneyCode: paymentService.generateMobileMoneyCode(
          orderData.operator || 'mtn',
          orderData.startupPhone,
          orderData.total
        ),
        status: 'pending', // pending, client_paid, confirmed, cancelled
        clientConfirmed: false,
        startupConfirmed: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        createdAt: new Date(),
        userName: userData?.fullName || 'Client',
        userPhone: userData?.phone || 'N° non disponible',
        items: orderDetails?.items?.filter(item => item.startupId === orderData.startupId) || [],
        deliveryInfo: orderDetails?.deliveryInfo || {},
      };

      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);
      
      return { success: true, paymentId: paymentRef.id, ...paymentData };
    } catch (error) {
      console.error('Erreur création paiement:', error);
      return { success: false, error: error.message };
    }
  },

  // CLIENT CONFIRME PAIEMENT
  clientConfirmPayment: async (paymentId, orderId) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      const paymentData = paymentDoc.data();

      // Mettre à jour paiement
      await updateDoc(doc(db, 'payments', paymentId), {
        clientConfirmed: true,
        clientConfirmedAt: new Date(),
        status: 'client_paid',
      });

      // Mettre à jour commande
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'client_paid',
        clientPaidAt: new Date(),
      });

      // Envoyer notifications
      const formattedAmount = paymentData.amount.toLocaleString('fr-FR');
      
      await Promise.all([
        // Notification à la startup
        notificationService.sendNotificationToStartup(
          paymentData.startupId,
          '💰 Nouveau paiement reçu !',
          `${paymentData.userName} a confirmé le paiement de ${formattedAmount} FCFA.`,
          {
            type: 'payment_received',
            paymentId,
            orderId,
            amount: paymentData.amount,
            userName: paymentData.userName
          }
        ),
        // Notification au client
        notificationService.sendNotificationToUser(
          paymentData.userId,
          '✅ Paiement envoyé',
          `Votre paiement de ${formattedAmount} FCFA a bien été envoyé à ${paymentData.startupName}. En attente de confirmation.`,
          {
            type: 'payment_sent',
            paymentId,
            orderId,
            amount: paymentData.amount,
            startupName: paymentData.startupName
          }
        )
      ]);

      return { success: true };
    } catch (error) {
      console.error('Erreur confirmation client:', error);
      return { success: false, error: error.message };
    }
  },

  // STARTUP CONFIRME RÉCEPTION
  startupConfirmPayment: async (paymentId, orderId, ambassadorCode = null) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      const paymentData = paymentDoc.data();

      // Mettre à jour paiement
      await updateDoc(doc(db, 'payments', paymentId), {
        startupConfirmed: true,
        startupConfirmedAt: new Date(),
        status: 'confirmed',
      });

      // Mettre à jour commande
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'confirmed',
        startupConfirmedAt: new Date(),
        status: 'processing',
      });

      // Envoyer notifications
      const formattedAmount = paymentData.amount.toLocaleString('fr-FR');
      // ✅ PHASE 2: Montrer commission dans notification
      const commissionInfo = paymentData.commissionRate 
        ? `\n\n💰 Vous recevez ${paymentData.startupReceives.toLocaleString('fr-FR')} FCFA (commission ${paymentData.commissionRate}%)`
        : '';
      
      await Promise.all([
        // Notification au client
        notificationService.sendNotificationToUser(
          paymentData.userId,
          '✅ Paiement confirmé',
          `${paymentData.startupName} a confirmé la réception de votre paiement de ${formattedAmount} FCFA. Votre commande est en cours de préparation.`,
          {
            type: 'payment_confirmed',
            paymentId,
            orderId,
            amount: paymentData.amount,
            startupName: paymentData.startupName
          }
        ),
        // Notification à la startup (pour l'historique)
        notificationService.sendNotificationToStartup(
          paymentData.startupId,
          '✅ Paiement vérifié',
          `Vous avez confirmé la réception du paiement de ${formattedAmount} FCFA de ${paymentData.userName}.${commissionInfo}`,
          {
            type: 'payment_confirmed',
            paymentId,
            orderId,
            amount: paymentData.amount,
            userName: paymentData.userName,
            commission: paymentData.commission,
            commissionRate: paymentData.commissionRate
          }
        )
      ]);

      // Si code promo ambassadeur, créditer 25F et notifier
      if (ambassadorCode) {
        const ambassadorResult = await paymentService.creditAmbassador(orderId, ambassadorCode);
        if (ambassadorResult.success) {
          await notificationService.sendNotificationToUser(
            ambassadorResult.ambassadorUserId,
            '💰 Commission reçue !',
            `Vous avez gagné 25 FCFA de commission sur une commande avec votre code promo.`,
            {
              type: 'ambassador_commission',
              orderId,
              amount: 25
            }
          );
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur confirmation startup:', error);
      return { success: false, error: error.message };
    }
  },

  // CRÉDITER AMBASSADEUR
  creditAmbassador: async (orderId, ambassadorCode) => {
    try {
      // Trouver ambassadeur par code
      const ambassadorQ = query(
        collection(db, 'ambassadors'),
        where('code', '==', ambassadorCode)
      );
      const ambassadorSnap = await getDocs(ambassadorQ);

      if (ambassadorSnap.empty) {
        console.log('Ambassadeur non trouvé:', ambassadorCode);
        return { success: false };
      }

      const ambassadorDoc = ambassadorSnap.docs[0];
      const ambassadorId = ambassadorDoc.id;
      const ambassadorData = ambassadorDoc.data();

      // Créer gain
      const earningData = {
        ambassadorId: ambassadorId,
        orderId: orderId,
        amount: 25,
        status: 'pending', // pending, paid
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'ambassadorEarnings'), earningData);

      // Mettre à jour totaux ambassadeur
      await updateDoc(doc(db, 'ambassadors', ambassadorId), {
        totalEarnings: (ambassadorData.totalEarnings || 0) + 25,
        totalOrders: (ambassadorData.totalOrders || 0) + 1,
        pendingPayment: (ambassadorData.pendingPayment || 0) + 25,
      });

      return { 
        success: true,
        ambassadorUserId: ambassadorData.userId 
      };
    } catch (error) {
      console.error('Erreur crédit ambassadeur:', error);
      return { success: false, error: error.message };
    }
  },

  // ANNULER PAIEMENT
  cancelPayment: async (paymentId, orderId) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      const paymentData = paymentDoc.data();

      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'cancelled',
        cancelledAt: new Date(),
      });
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
      });

      // Notifier la startup et le client
      await Promise.all([
        notificationService.sendNotificationToStartup(
          paymentData.startupId,
          '❌ Paiement annulé',
          `Le paiement de ${paymentData.amount.toLocaleString('fr-FR')} FCFA a été annulé.`,
          {
            type: 'payment_cancelled',
            paymentId,
            orderId
          }
        ),
        notificationService.sendNotificationToUser(
          paymentData.userId,
          '❌ Paiement annulé',
          `Votre paiement de ${paymentData.amount.toLocaleString('fr-FR')} FCFA a été annulé.`,
          {
            type: 'payment_cancelled',
            paymentId,
            orderId
          }
        )
      ]);

      return { success: true };
    } catch (error) {
      console.error('Erreur annulation paiement:', error);
      return { success: false, error: error.message };
    }
  },

  // VÉRIFIER EXPIRATION
  isPaymentExpired: (expiresAt) => {
    if (!expiresAt) return false;
    const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    return new Date() > expiry;
  },

  // OBTENIR PAIEMENT
  getPayment: async (paymentId) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      if (paymentDoc.exists()) {
        return { success: true, payment: { id: paymentDoc.id, ...paymentDoc.data() } };
      }
      return { success: false, error: 'Paiement introuvable' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // OBTENIR PAIEMENTS STARTUP (EN ATTENTE)
  getStartupPendingPayments: async (startupId) => {
    try {
      const q = query(
        collection(db, 'payments'),
        where('startupId', '==', startupId),
        where('status', '==', 'client_paid')
      );
      
      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, payments };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ✅ PHASE 2: OBTENIR INFOS COMMISSION STARTUP
  getStartupCommissionInfo: async (startupId) => {
    try {
      const rate = await paymentService.getCommissionRate(startupId);
      const subResult = await subscriptionService.getSubscription(startupId);
      
      return {
        success: true,
        commissionRate: rate * 100,
        isPremium: subResult.success && subResult.subscription.planId === 'premium',
        planName: subResult.success ? subResult.subscription.planId.toUpperCase() : 'STARTER',
        savings: rate === 0.03 ? 2 : 0, // % économisé vs plan normal
      };
    } catch (error) {
      return {
        success: false,
        commissionRate: 5,
        isPremium: false,
        planName: 'STARTER',
        savings: 0,
      };
    }
  },
};

export default paymentService;