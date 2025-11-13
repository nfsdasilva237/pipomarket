// utils/loyaltyUtils.js
// Fonctions utilitaires pour gérer les points de fidélité

import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculatePoints, loyaltyConfig } from '../config/loyaltyConfig';

/**
 * Attribuer des points après un achat
 * @param {string} userId - ID de l'utilisateur
 * @param {number} orderAmount - Montant de la commande en FCFA
 * @param {string} orderId - ID de la commande
 * @returns {Promise<Object>} - Points gagnés
 */
export const awardPointsForPurchase = async (userId, orderAmount, orderId) => {
  try {
    // Récupérer les points actuels de l'utilisateur
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentPoints = userDoc.data()?.loyaltyPoints || 0;

    // Calculer les points gagnés
    const pointsEarned = calculatePoints(orderAmount, currentPoints);

    // Mettre à jour les points de l'utilisateur
    await updateDoc(userRef, {
      loyaltyPoints: increment(pointsEarned.totalPoints),
      lastPointsUpdate: serverTimestamp(),
    });

    // Créer une entrée dans l'historique
    await addDoc(collection(db, 'pointsHistory'), {
      userId,
      orderId,
      type: 'earned',
      points: pointsEarned.totalPoints,
      basePoints: pointsEarned.basePoints,
      bonusPoints: pointsEarned.bonusPoints,
      level: pointsEarned.level,
      orderAmount,
      description: `Achat de ${orderAmount} FCFA`,
      createdAt: serverTimestamp(),
    });

    console.log(
      `✅ ${pointsEarned.totalPoints} points attribués à ${userId} (${pointsEarned.basePoints} base + ${pointsEarned.bonusPoints} bonus)`
    );

    return pointsEarned;
  } catch (error) {
    console.error('Erreur attribution points:', error);
    throw error;
  }
};

/**
 * Échanger des points contre une récompense
 * @param {string} userId - ID de l'utilisateur
 * @param {string} rewardId - ID de la récompense
 * @returns {Promise<Object>} - Récompense créée
 */
export const redeemReward = async (userId, rewardId) => {
  try {
    // Trouver la récompense
    const reward = loyaltyConfig.rewards.find((r) => r.id === rewardId);
    if (!reward) {
      throw new Error('Récompense introuvable');
    }

    // Vérifier les points de l'utilisateur
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentPoints = userDoc.data()?.loyaltyPoints || 0;

    if (currentPoints < reward.pointsCost) {
      throw new Error('Points insuffisants');
    }

    // Déduire les points
    await updateDoc(userRef, {
      loyaltyPoints: increment(-reward.pointsCost),
      lastPointsUpdate: serverTimestamp(),
    });

    // Créer la récompense pour l'utilisateur
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // Expire dans 90 jours

    const userRewardRef = await addDoc(collection(db, 'userRewards'), {
      userId,
      rewardId: reward.id,
      name: reward.name,
      description: reward.description,
      icon: reward.icon,
      type: reward.type,
      value: reward.value,
      used: false,
      createdAt: serverTimestamp(),
      expiresAt,
    });

    // Créer une entrée dans l'historique
    await addDoc(collection(db, 'pointsHistory'), {
      userId,
      type: 'redeemed',
      points: reward.pointsCost,
      rewardId: reward.id,
      description: `Échange: ${reward.name}`,
      createdAt: serverTimestamp(),
    });

    console.log(
      `✅ Récompense ${reward.name} échangée pour ${userId} (-${reward.pointsCost} points)`
    );

    return {
      id: userRewardRef.id,
      ...reward,
      expiresAt,
    };
  } catch (error) {
    console.error('Erreur échange récompense:', error);
    throw error;
  }
};

/**
 * Utiliser une récompense lors d'un achat
 * @param {string} userRewardId - ID de la récompense utilisateur
 * @param {string} orderId - ID de la commande
 * @returns {Promise<void>}
 */
export const useReward = async (userRewardId, orderId) => {
  try {
    const rewardRef = doc(db, 'userRewards', userRewardId);
    await updateDoc(rewardRef, {
      used: true,
      usedAt: serverTimestamp(),
      orderId,
    });

    console.log(`✅ Récompense ${userRewardId} utilisée pour commande ${orderId}`);
  } catch (error) {
    console.error('Erreur utilisation récompense:', error);
    throw error;
  }
};

/**
 * Appliquer une récompense au montant de la commande
 * @param {number} orderAmount - Montant original de la commande
 * @param {Object} reward - Récompense à appliquer
 * @returns {Object} - Nouveau montant et détails de la réduction
 */
export const applyRewardToOrder = (orderAmount, reward) => {
  if (!reward) {
    return {
      originalAmount: orderAmount,
      discount: 0,
      finalAmount: orderAmount,
      freeDelivery: false,
    };
  }

  let discount = 0;
  let freeDelivery = false;

  if (reward.type === 'discount') {
    discount = Math.round((orderAmount * reward.value) / 100);
  } else if (reward.type === 'free_delivery') {
    freeDelivery = true;
  }

  return {
    originalAmount: orderAmount,
    discount,
    finalAmount: orderAmount - discount,
    freeDelivery,
    rewardName: reward.name,
  };
};
