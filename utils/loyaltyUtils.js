// utils/loyaltyUtils.js - ✅ MIS À JOUR

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
 */
export const awardPointsForPurchase = async (userId, orderAmount, orderId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentPoints = userDoc.data()?.loyaltyPoints || 0;

    // Calculer points gagnés
    const pointsEarned = calculatePoints(orderAmount, currentPoints);

    // Mettre à jour les points
    await updateDoc(userRef, {
      loyaltyPoints: increment(pointsEarned.totalPoints),
      lastPointsUpdate: serverTimestamp(),
    });

    // Historique
    await addDoc(collection(db, 'pointsHistory'), {
      userId,
      orderId,
      type: 'earned',
      points: pointsEarned.totalPoints,
      basePoints: pointsEarned.basePoints,
      bonusPoints: pointsEarned.bonusPoints,
      level: pointsEarned.level,
      orderAmount,
      description: `Achat de ${orderAmount.toLocaleString()} FCFA`,
      createdAt: serverTimestamp(),
    });

    console.log(`✅ ${pointsEarned.totalPoints} points attribués`);

    return pointsEarned;
  } catch (error) {
    console.error('❌ Erreur attribution points:', error);
    throw error;
  }
};

/**
 * Échanger des points contre une récompense
 */
export const redeemReward = async (userId, rewardId) => {
  try {
    const reward = loyaltyConfig.rewards.find((r) => r.id === rewardId);
    if (!reward) throw new Error('Récompense introuvable');

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

    // Créer la récompense
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const userRewardRef = await addDoc(collection(db, 'userRewards'), {
      userId,
      rewardId: reward.id,
      rewardName: reward.name,
      rewardType: reward.type,
      rewardValue: reward.value,
      pointsSpent: reward.pointsCost,
      icon: reward.icon,
      paidBy: reward.paidBy,
      used: false,
      redeemedAt: serverTimestamp(),
      expiresAt,
    });

    // Historique
    await addDoc(collection(db, 'pointsHistory'), {
      userId,
      type: 'redeemed',
      points: reward.pointsCost,
      rewardId: reward.id,
      description: `Échange: ${reward.name}`,
      createdAt: serverTimestamp(),
    });

    console.log(`✅ Récompense ${reward.name} échangée`);

    return {
      id: userRewardRef.id,
      ...reward,
      expiresAt,
    };
  } catch (error) {
    console.error('❌ Erreur échange récompense:', error);
    throw error;
  }
};

/**
 * Utiliser une récompense
 */
export const useReward = async (userRewardId, orderId) => {
  try {
    const rewardRef = doc(db, 'userRewards', userRewardId);
    await updateDoc(rewardRef, {
      used: true,
      usedAt: serverTimestamp(),
      orderId,
    });

    console.log(`✅ Récompense utilisée`);
  } catch (error) {
    console.error('❌ Erreur utilisation récompense:', error);
    throw error;
  }
};

export default {
  awardPointsForPurchase,
  redeemReward,
  useReward,
};