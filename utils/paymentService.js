// utils/paymentService.js - VERSION DEBUG
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { notificationService } from './notificationService';
import subscriptionService from './subscriptionService';

export const paymentService = {
  
  getCommissionRate: async (startupId) => {
    try {
      const subResult = await subscriptionService.getSubscription(startupId);
      
      if (subResult.success && 
          subResult.subscription.planId === 'premium' &&
          ['trial', 'active'].includes(subResult.subscription.status)) {
        return 0.03;
      }
      
      return 0.05;
    } catch (error) {
      console.error('Erreur calcul commission:', error);
      return 0.05;
    }
  },

  calculateFees: async (startupId, amount) => {
    const commissionRate = await paymentService.getCommissionRate(startupId);
    const commission = Math.round(amount * commissionRate);
    const startupReceives = amount - commission;
    
    return {
      total: amount,
      commission,
      commissionRate: commissionRate * 100,
      startupReceives,
    };
  },
  
  generateMobileMoneyCode: (operator, phone, amount) => {
    const codes = {
      orange: `#150*1*1*${phone}*${amount}#`,
      mtn: `*126*1*1*${phone}*${amount}#`,
    };
    
    return codes[operator] || `#150*50*${phone}*${amount}#`;
  },

  // ✅ VERSION DEBUG
  createPayment: async (orderData) => {
    try {
      // 🔍 DEBUG 1: Vérifier l'authentification
      console.log('🔍 DEBUG - Current User:', auth.currentUser?.uid);
      console.log('🔍 DEBUG - User Email:', auth.currentUser?.email);
      
      if (!auth.currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // 🔍 DEBUG 2: Vérifier les données d'entrée
      console.log('🔍 DEBUG - Order Data:', JSON.stringify(orderData, null, 2));

      // Récupérer les informations de l'utilisateur
      const userDoc = await getDoc(doc(db, 'users', orderData.userId));
      
      if (!userDoc.exists()) {
        throw new Error('Utilisateur introuvable');
      }

      const userData = userDoc.data();

      // ✅ ESSAYER DE RÉCUPÉRER LA COMMANDE, MAIS NE PAS ÉCHOUER SI ELLE N'EXISTE PAS
      let orderDetails = null;
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderData.orderId));
        if (orderDoc.exists()) {
          orderDetails = orderDoc.data();
          console.log('✅ Commande trouvée');
        } else {
          console.log('⚠️ Commande non trouvée, on continue quand même');
        }
      } catch (error) {
        console.log('⚠️ Erreur récupération commande:', error.message);
      }

      // Calculer commission
      const fees = await paymentService.calculateFees(orderData.startupId, orderData.total);

      // ✅ DONNÉES SIMPLIFIÉES POUR DEBUG
      const paymentData = {
        orderId: orderData.orderId,
        startupId: orderData.startupId,
        userId: orderData.userId,
        amount: orderData.total,
        commission: fees.commission,
        commissionRate: fees.commissionRate,
        startupReceives: fees.startupReceives,
        status: 'pending',
        createdAt: new Date(),
        clientConfirmed: false,
        startupConfirmed: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        // Champs optionnels
        startupPhone: orderData.startupPhone || '',
        startupName: orderData.startupName || '',
        operator: orderData.operator || 'mtn',
        mobileMoneyCode: paymentService.generateMobileMoneyCode(
          orderData.operator || 'mtn',
          orderData.startupPhone,
          orderData.total
        ),
        userName: userData?.fullName || 'Client',
        userPhone: userData?.phone || '',
        items: orderDetails?.items?.filter(item => item.startupId === orderData.startupId) || [],
        deliveryInfo: orderDetails?.deliveryInfo || {},
      };

      // 🔍 DEBUG 3: Afficher les données avant création
      console.log('🔍 DEBUG - Payment Data:', JSON.stringify(paymentData, null, 2));

      // 🔍 DEBUG 4: Tester la création
      console.log('🔍 DEBUG - Tentative de création du paiement...');
      
      const paymentRef = await addDoc(collection(db, 'payments'), paymentData);
      
      console.log('✅ DEBUG - Paiement créé avec succès! ID:', paymentRef.id);
      
      return { success: true, paymentId: paymentRef.id, ...paymentData };
    } catch (error) {
      console.error('❌ ERREUR CRÉATION PAIEMENT:', error);
      console.error('❌ ERROR CODE:', error.code);
      console.error('❌ ERROR MESSAGE:', error.message);
      console.error('❌ ERROR STACK:', error.stack);
      return { success: false, error: error.message };
    }
  },

  clientConfirmPayment: async (paymentId, orderId) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      const paymentData = paymentDoc.data();

      await updateDoc(doc(db, 'payments', paymentId), {
        clientConfirmed: true,
        clientConfirmedAt: new Date(),
        status: 'client_paid',
      });

      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'client_paid',
        clientPaidAt: new Date(),
      });

      const formattedAmount = paymentData.amount.toLocaleString('fr-FR');
      
      await Promise.all([
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

  startupConfirmPayment: async (paymentId, orderId, ambassadorCode = null) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
      const paymentData = paymentDoc.data();

      await updateDoc(doc(db, 'payments', paymentId), {
        startupConfirmed: true,
        startupConfirmedAt: new Date(),
        status: 'confirmed',
      });

      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'confirmed',
        startupConfirmedAt: new Date(),
        status: 'processing',
      });

      const formattedAmount = paymentData.amount.toLocaleString('fr-FR');
      const commissionInfo = paymentData.commissionRate 
        ? `\n\n💰 Vous recevez ${paymentData.startupReceives.toLocaleString('fr-FR')} FCFA (commission ${paymentData.commissionRate}%)`
        : '';
      
      await Promise.all([
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

  creditAmbassador: async (orderId, ambassadorCode) => {
    try {
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

      const earningData = {
        ambassadorId: ambassadorId,
        orderId: orderId,
        amount: 25,
        status: 'pending',
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'ambassadorEarnings'), earningData);

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

  isPaymentExpired: (expiresAt) => {
    if (!expiresAt) return false;
    const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    return new Date() > expiry;
  },

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

  getStartupCommissionInfo: async (startupId) => {
    try {
      const rate = await paymentService.getCommissionRate(startupId);
      const subResult = await subscriptionService.getSubscription(startupId);
      
      return {
        success: true,
        commissionRate: rate * 100,
        isPremium: subResult.success && subResult.subscription.planId === 'premium',
        planName: subResult.success ? subResult.subscription.planId.toUpperCase() : 'STARTER',
        savings: rate === 0.03 ? 2 : 0,
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