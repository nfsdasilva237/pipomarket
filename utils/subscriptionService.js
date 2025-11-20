// utils/subscriptionService.js - SERVICE ABONNEMENTS STARTUPS
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
      support: '48h',
      commission: 5,
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
      maxOrders: 500,
      photosPerProduct: 999,
      promoCodes: 10,
      badge: '🔵 PRO ⭐',
      featured: true,
      featuredFrequency: '2x/week',
      analytics: 'advanced',
      support: '24h',
      commission: 5,
      recommendations: true,
    },
    description: 'Pour les startups en croissance',
    color: '#007AFF',
    popular: true,
  },
  
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 15000,
    features: {
      maxProducts: 999999,
      maxOrders: 999999,
      photosPerProduct: 999,
      promoCodes: 999999,
      badge: '🟣 PREMIUM 💎',
      featured: true,
      featuredFrequency: 'top3',
      analytics: 'ai',
      support: '2h',
      commission: 3,
      recommendations: true,
      customization: true,
      socialMedia: true,
      newsletter: true,
    },
    description: 'Pour les startups établies',
    color: '#AF52DE',
  },
};

export const subscriptionService = {
  
  // CRÉER ABONNEMENT (1 MOIS GRATUIT)
  createSubscription: async (startupId, planId) => {
    try {
      const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
      if (!plan) {
        throw new Error('Plan invalide');
      }

      // Vérifier si startup existe
      const startupDoc = await getDoc(doc(db, 'startups', startupId));
      if (!startupDoc.exists()) {
        throw new Error('Startup introuvable');
      }

      // Calculer dates (1 mois gratuit)
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours
      const nextBillingDate = new Date(trialEndDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours après trial

      const subscriptionData = {
        startupId,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        features: plan.features,
        status: 'trial', // trial, active, expired, cancelled
        trialEndDate,
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndDate,
        nextBillingDate,
        autoRenew: true,
        createdAt: now,
        updatedAt: now,
      };

      const subscriptionRef = await addDoc(collection(db, 'subscriptions'), subscriptionData);

      // Mettre à jour startup avec info abonnement
      await updateDoc(doc(db, 'startups', startupId), {
        subscriptionId: subscriptionRef.id,
        subscriptionPlan: plan.id,
        subscriptionStatus: 'trial',
        subscriptionBadge: plan.features.badge,
        updatedAt: now,
      });

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
      const subscriptionData = subscriptionDoc.data();

      // Support ancien système (planId/planName) ET nouveau système (selectedPlanId/currentPlanName)
      const planKey = subscriptionData.selectedPlanId || subscriptionData.planId || 'starter';
      const plan = SUBSCRIPTION_PLANS[planKey.toUpperCase()];

      const subscription = {
        id: subscriptionDoc.id,
        ...subscriptionData,
        // Propriétés calculées pour compatibilité
        currentPlanName: subscriptionData.currentPlanName || subscriptionData.planName || plan.name,
        selectedPlanName: subscriptionData.selectedPlanName || subscriptionData.planName || plan.name,
        selectedPlanId: subscriptionData.selectedPlanId || subscriptionData.planId || planKey,
        currentFeatures: subscriptionData.currentFeatures || subscriptionData.features || plan.features,
        isActive: subscriptionData.isActive !== undefined ? subscriptionData.isActive : (subscriptionData.status === 'trial' || subscriptionData.status === 'active'),
      };

      // Vérifier si abonnement expiré
      const now = new Date();
      const endDate = subscription.currentPeriodEnd?.toDate ? subscription.currentPeriodEnd.toDate() : new Date();

      if (now > endDate && subscription.status !== 'expired') {
        await subscriptionService.expireSubscription(subscription.id);
        subscription.status = 'expired';
        subscription.isActive = false;
      }

      return { success: true, subscription };
    } catch (error) {
      console.error('Erreur récupération abonnement:', error);
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
      
      if (subscription.status === 'expired' || subscription.status === 'cancelled') {
        return { allowed: false, reason: 'Abonnement expiré' };
      }

      // Compter produits actuels
      const productsQ = query(
        collection(db, 'products'),
        where('startupId', '==', startupId)
      );
      const productsSnapshot = await getDocs(productsQ);
      const currentProducts = productsSnapshot.size;

      const maxProducts = subscription.currentFeatures?.maxProducts || subscription.features?.maxProducts || 10;
      
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
      
      if (subscription.status === 'expired' || subscription.status === 'cancelled') {
        return { allowed: false, reason: 'Abonnement expiré' };
      }

      // Compter commandes du mois actuel
      const periodStart = subscription.currentPeriodStart?.toDate ? subscription.currentPeriodStart.toDate() : new Date();
      const ordersQ = query(
        collection(db, 'orders'),
        where('startupId', '==', startupId),
        where('createdAt', '>=', periodStart)
      );
      const ordersSnapshot = await getDocs(ordersQ);
      const currentOrders = ordersSnapshot.size;

      const maxOrders = subscription.currentFeatures?.maxOrders || subscription.features?.maxOrders || 100;
      
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

  // PAYER ABONNEMENT (RENOUVELLEMENT)
  paySubscription: async (subscriptionId, paymentMethod = 'mobile_money') => {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      
      if (!subscriptionDoc.exists()) {
        throw new Error('Abonnement introuvable');
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();
      const newPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours

      // Créer paiement
      const paymentData = {
        subscriptionId,
        startupId: subscription.startupId,
        amount: subscription.price,
        paymentMethod,
        status: 'pending',
        planName: subscription.planName,
        periodStart: now,
        periodEnd: newPeriodEnd,
        createdAt: now,
      };

      const paymentRef = await addDoc(collection(db, 'subscriptionPayments'), paymentData);

      return {
        success: true,
        paymentId: paymentRef.id,
        amount: subscription.price,
        payment: paymentData,
      };
    } catch (error) {
      console.error('Erreur paiement abonnement:', error);
      return { success: false, error: error.message };
    }
  },

  // CONFIRMER PAIEMENT ABONNEMENT
  confirmSubscriptionPayment: async (paymentId) => {
    try {
      const paymentDoc = await getDoc(doc(db, 'subscriptionPayments', paymentId));
      
      if (!paymentDoc.exists()) {
        throw new Error('Paiement introuvable');
      }

      const payment = paymentDoc.data();
      const now = new Date();

      // Mettre à jour paiement
      await updateDoc(doc(db, 'subscriptionPayments', paymentId), {
        status: 'confirmed',
        confirmedAt: now,
      });

      // Mettre à jour abonnement
      await updateDoc(doc(db, 'subscriptions', payment.subscriptionId), {
        status: 'active',
        currentPeriodStart: payment.periodStart,
        currentPeriodEnd: payment.periodEnd,
        nextBillingDate: new Date(payment.periodEnd.getTime() + 30 * 24 * 60 * 60 * 1000),
        lastPaymentDate: now,
        updatedAt: now,
      });

      // Mettre à jour startup
      await updateDoc(doc(db, 'startups', payment.startupId), {
        subscriptionStatus: 'active',
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur confirmation paiement:', error);
      return { success: false, error: error.message };
    }
  },

  // EXPIRER ABONNEMENT
  expireSubscription: async (subscriptionId) => {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
      
      if (!subscriptionDoc.exists()) {
        throw new Error('Abonnement introuvable');
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'expired',
        expiredAt: now,
        updatedAt: now,
      });

      await updateDoc(doc(db, 'startups', subscription.startupId), {
        subscriptionStatus: 'expired',
        updatedAt: now,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur expiration abonnement:', error);
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
        autoRenew: false,
        cancelledAt: now,
        updatedAt: now,
      });

      await updateDoc(doc(db, 'startups', subscription.startupId), {
        subscriptionStatus: 'cancelled',
        updatedAt: now,
      });

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

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        planId: newPlan.id,
        planName: newPlan.name,
        price: newPlan.price,
        features: newPlan.features,
        updatedAt: now,
      });

      await updateDoc(doc(db, 'startups', subscription.startupId), {
        subscriptionPlan: newPlan.id,
        subscriptionBadge: newPlan.features.badge,
        updatedAt: now,
      });

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

      // Compter commandes du mois
      const periodStart = subscription.currentPeriodStart?.toDate ? subscription.currentPeriodStart.toDate() : new Date();
      const ordersQ = query(
        collection(db, 'orders'),
        where('startupId', '==', startupId),
        where('createdAt', '>=', periodStart)
      );
      const ordersSnapshot = await getDocs(ordersQ);
      const ordersCount = ordersSnapshot.size;

      // Calculer jours restants
      const now = new Date();
      const endDate = subscription.currentPeriodEnd?.toDate ? subscription.currentPeriodEnd.toDate() : new Date();
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

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
          daysRemaining,
          trialEndDate: subscription.trialEndDate,
          currentPeriodEnd: subscription.currentPeriodEnd,
          nextBillingDate: subscription.nextBillingDate?.toDate ? subscription.nextBillingDate.toDate() : null,
        },
      };
    } catch (error) {
      console.error('Erreur stats abonnement:', error);
      return { success: false, error: error.message };
    }
  },
};

export default subscriptionService;
