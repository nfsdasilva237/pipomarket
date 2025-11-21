// utils/subscriptionService.js - ✅ VERSION FINALE CORRIGÉE
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// PACKAGES DISPONIBLES
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 5000,
    features: {
      maxProducts: 10,
      maxOrders: 100,
      photosPerProduct: 3,
      promoCodes: 0,
      badge: '🟢 STARTUP',
      featured: false,
      analytics: 'basic',
    },
    description: 'Pour les startups qui démarrent',
    color: '#34C759',
  },

  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 10000,
    features: {
      maxProducts: 50,
      maxOrders: 300,
      photosPerProduct: 500,
      promoCodes: 5,
      badge: '🔵 PRO ⭐',
      featured: true,
      featuredFrequency: '2x/week',
      analytics: 'advanced',
      recommendations: true,
    },
    description: 'Pour les startups en croissance',
    color: '#007AFF',
    popular: true,
  },

  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 20000,
    features: {
      maxProducts: 999999,
      maxOrders: 999999,
      photosPerProduct: 999,
      promoCodes: 999999,
      badge: '🟣 PREMIUM 💎',
      featured: true,
      featuredFrequency: 'top3',
      analytics: 'ai',
      recommendations: true,
      socialMedia: true,
      newsletter: true,
    },
    description: 'Pour les startups établies',
    color: '#AF52DE',
  },
};

export const subscriptionService = {

  // ✨ CRÉER ABONNEMENT (1 MOIS PREMIUM GRATUIT POUR TOUS)
  createSubscription: async (startupId, planId) => {
    try {
      const selectedPlan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
      if (!selectedPlan) {
        throw new Error('Plan invalide');
      }

      // Vérifier si startup existe
      const startupDoc = await getDoc(doc(db, 'startups', startupId));
      if (!startupDoc.exists()) {
        throw new Error('Startup introuvable');
      }

      // Calculer dates
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours
      const reminderDate = new Date(trialEndDate.getTime() - 5 * 24 * 60 * 60 * 1000); // -5 jours avant fin

      // ✨ STRATÉGIE: Donner PREMIUM gratuit pendant 1 mois, peu importe le plan choisi
      const premiumPlan = SUBSCRIPTION_PLANS.PREMIUM;

      const subscriptionData = {
        startupId,

        // Plan CHOISI (ce que la startup paiera après l'essai)
        selectedPlanId: selectedPlan.id,
        selectedPlanName: selectedPlan.name,
        selectedPrice: selectedPlan.price,
        selectedFeatures: selectedPlan.features,

        // Plan ACTUEL (PREMIUM pendant l'essai gratuit)
        currentPlanId: premiumPlan.id,
        currentPlanName: premiumPlan.name,
        currentPrice: 0, // Gratuit
        currentFeatures: premiumPlan.features,

        status: 'trial', // trial, pending_payment, active, expired, cancelled, suspended
        trialEndDate,
        reminderDate,
        reminderSent: false,

        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndDate,

        isActive: true, // Page startup visible
        autoRenew: true,

        createdAt: now,
        updatedAt: now,
      };

      const subscriptionRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);

      // Mettre à jour startup avec PREMIUM
      await updateDoc(doc(db, 'startups', startupId), {
        subscriptionId: subscriptionRef.id,
        subscriptionPlan: premiumPlan.id, // PREMIUM pendant essai
        subscriptionStatus: 'trial',
        subscriptionBadge: premiumPlan.features.badge, // Badge PREMIUM
        isActive: true,
        updatedAt: now,
      });

      console.log(`✅ Abonnement créé: PREMIUM gratuit 1 mois → ${selectedPlan.name} après`);

      return {
        success: true,
        subscriptionId: subscriptionRef.id,
        subscription: subscriptionData,
      };
    } catch (error) {
      console.error('Erreur création abonnement:', error);
      return { success: false, error: error.message };
    }
  },

  // OBTENIR ABONNEMENT STARTUP
  getSubscription: async (startupId) => {
    try {
      const q = query(
        collection(db, 'subscriptions'),
        where('startupId', '==', startupId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Aucun abonnement trouvé' };
      }

      const subscriptionDoc = snapshot.docs[0];
      const subscription = {
        id: subscriptionDoc.id,
        ...subscriptionDoc.data(),
      };

      const now = new Date();

      // 🔧 Réparer les fonctionnalités manquantes si nécessaire
      if (!subscription.currentFeatures) {
        console.warn('⚠️ Réparation de l\'abonnement:', subscription.id);
        const fallbackFeatures = subscription.selectedFeatures || SUBSCRIPTION_PLANS.PREMIUM.features;
        subscription.currentFeatures = fallbackFeatures;

        // Réparer le document dans la base de données
        try {
          await updateDoc(doc(db, 'subscriptions', subscription.id), {
            currentFeatures: fallbackFeatures,
            updatedAt: new Date(),
          });
          console.log('✅ Abonnement réparé:', subscription.id);
        } catch (repairError) {
          console.error('Erreur réparation abonnement:', repairError);
        }
      }

      // 🔍 Vérifier si la période d'essai est terminée
      if (subscription.status === 'trial' && subscription.trialEndDate) {
        const endDate = subscription.trialEndDate.toDate ? subscription.trialEndDate.toDate() : new Date(subscription.trialEndDate);

        if (now > endDate) {
          console.log('⏰ Période d\'essai terminée → passage en attente de paiement');
          await subscriptionService.endTrial(subscription.id);
          subscription.status = 'pending_payment';
          subscription.isActive = false;
        }
      }

      // 🔍 Vérifier si abonnement payant est expiré
      if (subscription.status === 'active' && subscription.currentPeriodEnd) {
        const endDate = subscription.currentPeriodEnd.toDate ? subscription.currentPeriodEnd.toDate() : new Date(subscription.currentPeriodEnd);

        if (now > endDate) {
          console.log('⏰ Abonnement expiré → suspension');
          await subscriptionService.suspendSubscription(subscription.id);
          subscription.status = 'suspended';
          subscription.isActive = false;
        }
      }

      return { success: true, subscription };
    } catch (error) {
      console.error('Erreur récupération abonnement:', error);
      return { success: false, error: error.message };
    }
  },

  // 🔚 TERMINER L'ESSAI → Passer au plan choisi et attendre paiement
  endTrial: async (subscriptionId) => {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        throw new Error('Abonnement introuvable');
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();

      // Passer au plan CHOISI (plus PREMIUM)
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'pending_payment',
        currentPlanId: subscription.selectedPlanId,
        currentPlanName: subscription.selectedPlanName,
        currentPrice: subscription.selectedPrice,
        currentFeatures: subscription.selectedFeatures,
        isActive: false, // DÉSACTIVER la page
        trialEndedAt: now,
        updatedAt: now,
      });

      // Vérifier si la startup existe avant de la mettre à jour
      const startupDoc = await getDoc(doc(db, 'startups', subscription.startupId));
      if (startupDoc.exists()) {
        // DÉSACTIVER la startup
        await updateDoc(doc(db, 'startups', subscription.startupId), {
          subscriptionStatus: 'pending_payment',
          subscriptionPlan: subscription.selectedPlanId,
          subscriptionBadge: subscription.selectedFeatures.badge,
          isActive: false, // PAGE DÉSACTIVÉE
          updatedAt: now,
        });
        console.log('🔴 Startup désactivée → en attente de paiement');
      } else {
        console.warn('⚠️ Essai terminé mais startup introuvable:', subscription.startupId);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur fin essai:', error);
      return { success: false, error: error.message };
    }
  },

  // 🔴 SUSPENDRE ABONNEMENT (non payé)
  suspendSubscription: async (subscriptionId) => {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        throw new Error('Abonnement introuvable');
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'suspended',
        isActive: false,
        suspendedAt: now,
        updatedAt: now,
      });

      // Vérifier si la startup existe avant de la mettre à jour
      const startupDoc = await getDoc(doc(db, 'startups', subscription.startupId));
      if (startupDoc.exists()) {
        // DÉSACTIVER la startup
        await updateDoc(doc(db, 'startups', subscription.startupId), {
          subscriptionStatus: 'suspended',
          isActive: false, // PAGE DÉSACTIVÉE
          updatedAt: now,
        });
        console.log('🔴 Startup suspendue pour non-paiement');
      } else {
        console.warn('⚠️ Abonnement suspendu mais startup introuvable:', subscription.startupId);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur suspension abonnement:', error);
      return { success: false, error: error.message };
    }
  },

  // ✅ ACTIVER ABONNEMENT (ADMIN après paiement)
  activateSubscription: async (subscriptionId, activatedByAdminId) => {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        throw new Error('Abonnement introuvable');
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours
      const reminderDate = new Date(periodEnd.getTime() - 5 * 24 * 60 * 60 * 1000); // -5 jours avant fin

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'active',
        isActive: true,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        reminderDate,
        reminderSent: false,
        lastPaymentDate: now,
        activatedByAdminId,
        updatedAt: now,
      });

      // Vérifier si la startup existe avant de la mettre à jour
      const startupDoc = await getDoc(doc(db, 'startups', subscription.startupId));
      if (startupDoc.exists()) {
        // ACTIVER la startup
        await updateDoc(doc(db, 'startups', subscription.startupId), {
          subscriptionStatus: 'active',
          isActive: true, // PAGE ACTIVÉE
          updatedAt: now,
        });
        console.log('✅ Startup activée par admin:', activatedByAdminId);
      } else {
        console.warn('⚠️ Abonnement activé mais startup introuvable:', subscription.startupId);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur activation abonnement:', error);
      return { success: false, error: error.message };
    }
  },

  // ✅ PROLONGER ABONNEMENT (ADMIN)
  extendSubscription: async (subscriptionId, days = 30) => {
    try {
      const subRef = doc(db, 'subscriptions', subscriptionId);
      const subDoc = await getDoc(subRef);
      
      if (!subDoc.exists()) {
        return { success: false, error: 'Abonnement introuvable' };
      }

      const subData = subDoc.data();
      const currentEndDate = subData.currentPeriodEnd?.toDate ? subData.currentPeriodEnd.toDate() : new Date(subData.currentPeriodEnd);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      // Recalculer date de rappel
      const newReminderDate = new Date(newEndDate);
      newReminderDate.setDate(newReminderDate.getDate() - 5);

      await updateDoc(subRef, {
        currentPeriodEnd: newEndDate,
        reminderDate: newReminderDate,
        reminderSent: false,
        updatedAt: new Date(),
        extendedBy: 'admin',
        extendedAt: new Date(),
      });

      console.log(`✅ Abonnement prolongé de ${days} jours`);

      return { success: true };
    } catch (error) {
      console.error('Erreur prolongation:', error);
      return { success: false, error: error.message };
    }
  },

  // 🔔 VÉRIFIER ET ENVOYER RAPPELS (à appeler quotidiennement)
  checkAndSendReminders: async () => {
    try {
      const now = new Date();

      // Trouver abonnements qui ont besoin de rappel
      const q = query(
        collection(db, 'subscriptions'),
        where('reminderSent', '==', false),
        where('status', 'in', ['trial', 'active'])
      );

      const snapshot = await getDocs(q);
      const reminders = [];

      for (const docSnap of snapshot.docs) {
        const subscription = { id: docSnap.id, ...docSnap.data() };
        const reminderDate = subscription.reminderDate?.toDate ? subscription.reminderDate.toDate() : new Date(subscription.reminderDate);

        // Si on est 5 jours avant la fin
        if (now >= reminderDate && !subscription.reminderSent) {
          reminders.push({
            subscriptionId: subscription.id,
            startupId: subscription.startupId,
            planName: subscription.currentPlanName,
            price: subscription.currentPrice,
            endDate: subscription.currentPeriodEnd,
            status: subscription.status,
          });

          // Marquer comme envoyé
          await updateDoc(doc(db, 'subscriptions', subscription.id), {
            reminderSent: true,
            reminderSentAt: now,
          });
        }
      }

      console.log(`🔔 ${reminders.length} rappels envoyés`);

      return { success: true, reminders };
    } catch (error) {
      console.error('Erreur vérification rappels:', error);
      return { success: false, error: error.message };
    }
  },

  // VÉRIFIER LIMITE PRODUITS
  canAddProduct: async (startupId) => {
    try {
      const subResult = await subscriptionService.getSubscription(startupId);

      if (!subResult.success) {
        return { allowed: false, reason: 'Aucun abonnement' };
      }

      const { subscription } = subResult;

      if (!subscription.isActive) {
        return { allowed: false, reason: 'Abonnement inactif - paiement requis' };
      }

      // Compter produits actuels
      const productsQ = query(
        collection(db, 'products'),
        where('startupId', '==', startupId)
      );
      const productsSnapshot = await getDocs(productsQ);
      const currentProducts = productsSnapshot.size;

      const maxProducts = subscription.currentFeatures.maxProducts;

      if (currentProducts >= maxProducts) {
        return {
          allowed: false,
          reason: `Limite atteinte (${currentProducts}/${maxProducts})`,
          current: currentProducts,
          max: maxProducts,
        };
      }

      return {
        allowed: true,
        current: currentProducts,
        max: maxProducts,
      };
    } catch (error) {
      console.error('Erreur vérification limite produits:', error);
      return { allowed: false, reason: error.message };
    }
  },

  // VÉRIFIER LIMITE COMMANDES
  canAcceptOrder: async (startupId) => {
    try {
      const subResult = await subscriptionService.getSubscription(startupId);

      if (!subResult.success) {
        return { allowed: false, reason: 'Aucun abonnement' };
      }

      const { subscription } = subResult;

      if (!subscription.isActive) {
        return { allowed: false, reason: 'Abonnement inactif - paiement requis' };
      }

      // Compter commandes du mois actuel
      const periodStart = subscription.currentPeriodStart?.toDate ? subscription.currentPeriodStart.toDate() : new Date(subscription.currentPeriodStart);
      const ordersQ = query(
        collection(db, 'orders'),
        where('startupId', '==', startupId),
        where('createdAt', '>=', periodStart)
      );
      const ordersSnapshot = await getDocs(ordersQ);
      const currentOrders = ordersSnapshot.size;

      const maxOrders = subscription.currentFeatures.maxOrders;

      if (currentOrders >= maxOrders) {
        return {
          allowed: false,
          reason: `Limite commandes atteinte (${currentOrders}/${maxOrders})`,
          current: currentOrders,
          max: maxOrders,
        };
      }

      return {
        allowed: true,
        current: currentOrders,
        max: maxOrders,
      };
    } catch (error) {
      console.error('Erreur vérification limite commandes:', error);
      return { allowed: false, reason: error.message };
    }
  },

  // CRÉER DEMANDE DE PAIEMENT
  createPaymentRequest: async (subscriptionId) => {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        throw new Error('Abonnement introuvable');
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();

      const paymentData = {
        subscriptionId,
        startupId: subscription.startupId,
        amount: subscription.selectedPrice || subscription.currentPrice,
        planName: subscription.selectedPlanName || subscription.currentPlanName,
        status: 'pending', // pending, confirmed, rejected
        paymentMethod: 'mobile_money',
        createdAt: now,
      };

      const paymentRef = await addDoc(collection(db, 'subscriptionPayments'), paymentData);

      return {
        success: true,
        paymentId: paymentRef.id,
        amount: paymentData.amount,
        payment: paymentData,
      };
    } catch (error) {
      console.error('Erreur création paiement:', error);
      return { success: false, error: error.message };
    }
  },

  // ANNULER ABONNEMENT
  cancelSubscription: async (subscriptionId) => {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        throw new Error('Abonnement introuvable');
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'cancelled',
        isActive: false,
        autoRenew: false,
        cancelledAt: now,
        updatedAt: now,
      });

      // Vérifier si la startup existe avant de la mettre à jour
      const startupDoc = await getDoc(doc(db, 'startups', subscription.startupId));
      if (startupDoc.exists()) {
        await updateDoc(doc(db, 'startups', subscription.startupId), {
          subscriptionStatus: 'cancelled',
          isActive: false,
          updatedAt: now,
        });
      } else {
        console.warn('⚠️ Abonnement annulé mais startup introuvable:', subscription.startupId);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur annulation abonnement:', error);
      return { success: false, error: error.message };
    }
  },

  // CHANGER DE PLAN
  changePlan: async (subscriptionId, newPlanId) => {
    try {
      const newPlan = SUBSCRIPTION_PLANS[newPlanId.toUpperCase()];
      if (!newPlan) {
        throw new Error('Plan invalide');
      }

      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      if (!subscriptionDoc.exists()) {
        throw new Error('Abonnement introuvable');
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();

      // Si en trial, changer le plan CHOISI (pas le plan actuel PREMIUM)
      if (subscription.status === 'trial') {
        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
          selectedPlanId: newPlan.id,
          selectedPlanName: newPlan.name,
          selectedPrice: newPlan.price,
          selectedFeatures: newPlan.features,
          updatedAt: now,
        });
      } else {
        // Si actif, changer directement
        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
          selectedPlanId: newPlan.id,
          selectedPlanName: newPlan.name,
          selectedPrice: newPlan.price,
          selectedFeatures: newPlan.features,
          currentPlanId: newPlan.id,
          currentPlanName: newPlan.name,
          currentPrice: newPlan.price,
          currentFeatures: newPlan.features,
          updatedAt: now,
        });

        // Vérifier si la startup existe avant de la mettre à jour
        const startupDoc = await getDoc(doc(db, 'startups', subscription.startupId));
        if (startupDoc.exists()) {
          await updateDoc(doc(db, 'startups', subscription.startupId), {
            subscriptionPlan: newPlan.id,
            subscriptionBadge: newPlan.features.badge,
            updatedAt: now,
          });
        } else {
          console.warn('⚠️ Plan changé mais startup introuvable:', subscription.startupId);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur changement plan:', error);
      return { success: false, error: error.message };
    }
  },

  // OBTENIR STATISTIQUES ABONNEMENT
  getSubscriptionStats: async (startupId) => {
    try {
      const subResult = await subscriptionService.getSubscription(startupId);

      if (!subResult.success) {
        return { success: false, error: 'Aucun abonnement' };
      }

      const { subscription } = subResult;

      // Compter produits
      const productsQ = query(
        collection(db, 'products'),
        where('startupId', '==', startupId)
      );
      const productsSnapshot = await getDocs(productsQ);
      const productsCount = productsSnapshot.size;

      // Vérifier que les fonctionnalités sont définies
      if (!subscription.currentFeatures) {
        console.error('currentFeatures non défini pour l\'abonnement:', subscription.id);
        // Utiliser selectedFeatures comme fallback ou PREMIUM par défaut
        subscription.currentFeatures = subscription.selectedFeatures || SUBSCRIPTION_PLANS.PREMIUM.features;
      }

      // Compter commandes du mois
      const periodStart = subscription.currentPeriodStart?.toDate ? subscription.currentPeriodStart.toDate() : new Date(subscription.currentPeriodStart);
      const ordersQ = query(
        collection(db, 'orders'),
        where('startupId', '==', startupId),
        where('createdAt', '>=', periodStart)
      );
      const ordersSnapshot = await getDocs(ordersQ);
      const ordersCount = ordersSnapshot.size;

      // Calculer jours restants
      const now = new Date();
      const endDate = subscription.currentPeriodEnd?.toDate ? subscription.currentPeriodEnd.toDate() : new Date(subscription.currentPeriodEnd);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      return {
        success: true,
        stats: {
          currentPlan: subscription.currentPlanName,
          selectedPlan: subscription.selectedPlanName,
          status: subscription.status,
          isActive: subscription.isActive,
          isTrial: subscription.status === 'trial',
          productsUsed: productsCount,
          productsMax: subscription.currentFeatures.maxProducts,
          productsPercentage: (productsCount / subscription.currentFeatures.maxProducts) * 100,
          ordersUsed: ordersCount,
          ordersMax: subscription.currentFeatures.maxOrders,
          ordersPercentage: (ordersCount / subscription.currentFeatures.maxOrders) * 100,
          daysRemaining: Math.max(0, daysRemaining),
          trialEndDate: subscription.trialEndDate,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      };
    } catch (error) {
      console.error('Erreur stats abonnement:', error);
      return { success: false, error: error.message };
    }
  },

  // 📋 OBTENIR TOUS LES ABONNEMENTS (ADMIN)
  getAllSubscriptions: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'subscriptions'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur récupération abonnements:', error);
      return [];
    }
  },

  // 📋 OBTENIR PAIEMENTS EN ATTENTE (ADMIN)
  getPendingPayments: async () => {
    try {
      const q = query(
        collection(db, 'subscriptionPayments'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Erreur récupération paiements:', error);
      return [];
    }
  },
};

export default subscriptionService;