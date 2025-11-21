// utils/loyaltyPaymentService.js - ✅ VERSION SÉCURISÉE AVEC PLAFONDS

import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { loyaltyConfig } from '../config/loyaltyConfig';

/**
 * Calculer la répartition d'une commande avec récompense fidélité (SÉCURISÉE)
 */
export const calculateOrderWithLoyalty = async (order, appliedReward = null) => {
  try {
    const { items, deliveryFee = 0 } = order;
    const limits = loyaltyConfig.limits;

    // Calculer le sous-total
    let subtotal = 0;
    const startupBreakdown = {};

    items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      if (!startupBreakdown[item.startupId]) {
        startupBreakdown[item.startupId] = {
          startupId: item.startupId,
          startupName: item.startupName || 'Startup',
          items: [],
          subtotal: 0,
          receives: 0,
        };
      }

      startupBreakdown[item.startupId].items.push(item);
      startupBreakdown[item.startupId].subtotal += itemTotal;
      startupBreakdown[item.startupId].receives += itemTotal; // ✅ 100%
    });

    // 🛡️ VÉRIFICATIONS DE SÉCURITÉ
    const warnings = [];

    // Vérifier montant minimum
    if (subtotal < limits.minOrderAmount) {
      return {
        success: false,
        error: `Montant minimum requis: ${limits.minOrderAmount.toLocaleString()} FCFA`,
        warnings,
      };
    }

    // Initialiser
    let loyaltyDiscount = 0;
    let loyaltyCredit = 0;
    let deliveryDiscount = 0;
    let pipoPays = 0;
    let cappedAmount = 0; // Montant après plafonnement

    // APPLIQUER LA RÉCOMPENSE (AVEC LIMITES)
    if (appliedReward) {
      if (appliedReward.type === 'discount') {
        // 🎯 RÉDUCTION PLAFONNÉE
        
        // Montant éligible = min(subtotal, maxEligibleAmount)
        const eligibleAmount = Math.min(subtotal, limits.maxEligibleAmount);
        
        // Calculer réduction brute
        let discountAmount = Math.round((eligibleAmount * appliedReward.value) / 100);
        
        // Appliquer plafond de la récompense
        if (appliedReward.maxDiscount) {
          discountAmount = Math.min(discountAmount, appliedReward.maxDiscount);
        }
        
        // Appliquer plafond global
        discountAmount = Math.min(discountAmount, limits.maxDiscountPerOrder);
        
        loyaltyDiscount = discountAmount;
        cappedAmount = eligibleAmount;
        pipoPays += discountAmount;

        // ⚠️ AVERTISSEMENT SI PLAFONNÉE
        const theoreticalDiscount = Math.round((subtotal * appliedReward.value) / 100);
        if (discountAmount < theoreticalDiscount) {
          warnings.push({
            type: 'discount_capped',
            message: `Réduction plafonnée à ${discountAmount.toLocaleString()} FCFA`,
            theoretical: theoreticalDiscount,
            actual: discountAmount,
            reason: subtotal > limits.maxEligibleAmount 
              ? `Réduction applicable sur max ${limits.maxEligibleAmount.toLocaleString()} FCFA`
              : `Réduction max ${limits.maxDiscountPerOrder.toLocaleString()} FCFA`,
          });
        }

      } else if (appliedReward.type === 'credit') {
        // 💰 CRÉDIT PLAFONNÉ
        
        // Limite du crédit
        const maxCredit = Math.min(
          appliedReward.value,
          appliedReward.maxUsablePerOrder || limits.maxCreditPerOrder,
          subtotal // Pas plus que le montant de la commande
        );
        
        loyaltyCredit = maxCredit;
        pipoPays += maxCredit;

        // ⚠️ AVERTISSEMENT SI PLAFONNÉE
        if (maxCredit < appliedReward.value) {
          warnings.push({
            type: 'credit_capped',
            message: `Crédit limité à ${maxCredit.toLocaleString()} FCFA par commande`,
            available: appliedReward.value,
            used: maxCredit,
            remaining: appliedReward.value - maxCredit,
          });
        }

      } else if (appliedReward.type === 'delivery') {
        // 🚚 LIVRAISON (Pas de limite)
        deliveryDiscount = deliveryFee;
        pipoPays += deliveryFee;
      }
    }

    // CALCULS FINAUX
    const totalBeforeDiscount = subtotal + deliveryFee;
    const totalDiscount = loyaltyDiscount + loyaltyCredit + deliveryDiscount;
    const clientPays = totalBeforeDiscount - totalDiscount;
    const startupsReceiveTotal = subtotal;

    return {
      success: true,
      breakdown: {
        subtotal,
        deliveryFee,
        totalBeforeDiscount,

        // Réductions
        loyaltyDiscount,
        loyaltyCredit,
        deliveryDiscount,
        totalDiscount,

        // Paiements
        clientPays,
        pipoPays,
        startupsReceiveTotal,

        // Détails plafonnement
        cappedAmount, // Montant sur lequel la réduction a été calculée
        eligibleAmount: cappedAmount || subtotal,

        // Startups
        startups: Object.values(startupBreakdown),
      },
      appliedReward,
      warnings, // ⚠️ Avertissements à afficher
    };
  } catch (error) {
    console.error('❌ Erreur calcul fidélité:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enregistrer le paiement (inchangé)
 */
export const recordLoyaltyPayment = async (orderId, breakdown, userId) => {
  try {
    await addDoc(collection(db, 'loyaltyPayments'), {
      orderId,
      userId,
      pipoPays: breakdown.pipoPays,
      loyaltyDiscount: breakdown.loyaltyDiscount,
      loyaltyCredit: breakdown.loyaltyCredit,
      deliveryDiscount: breakdown.deliveryDiscount,
      totalDiscount: breakdown.totalDiscount,
      clientPays: breakdown.clientPays,
      startupsReceive: breakdown.startupsReceiveTotal,
      cappedAmount: breakdown.cappedAmount,
      eligibleAmount: breakdown.eligibleAmount,
      startupBreakdown: breakdown.startups.map((s) => ({
        startupId: s.startupId,
        receives: s.receives,
      })),
      createdAt: serverTimestamp(),
    });

    if (breakdown.pipoPays > 0) {
      await deductFromLoyaltyFund(breakdown.pipoPays, orderId);
    }

    console.log('✅ Paiement fidélité enregistré');
    console.log('💰 PipoMarket paie:', breakdown.pipoPays, 'FCFA');
    console.log('👥 Client paie:', breakdown.clientPays, 'FCFA');
    console.log('🏢 Startups reçoivent:', breakdown.startupsReceiveTotal, 'FCFA');

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur enregistrement paiement:', error);
    return { success: false, error: error.message };
  }
};

// ... (garder les autres fonctions fundLoyaltyFromCommission, etc.)

/**
 * Déduire du fond de fidélité
 */
const deductFromLoyaltyFund = async (amount, orderId) => {
  try {
    const settingsRef = doc(db, 'settings', 'loyaltyFund');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const currentFund = settingsDoc.data().totalFund || 0;
      const newFund = Math.max(0, currentFund - amount);

      await updateDoc(settingsRef, {
        totalFund: newFund,
        lastUpdated: serverTimestamp(),
        lastOrderId: orderId,
      });

      console.log(`✅ Fond fidélité: -${amount} FCFA (Reste: ${newFund} FCFA)`);

      if (newFund < 50000) {
        console.warn('⚠️ ALERTE: Fond de fidélité faible!', newFund, 'FCFA');
      }
    }
  } catch (error) {
    console.error('❌ Erreur déduction fond:', error);
  }
};

export default {
  calculateOrderWithLoyalty,
  recordLoyaltyPayment,
  fundLoyaltyFromCommission,
  getLoyaltyFundBalance,
};