// config/loyaltyConfig.js
// Configuration du système de points de fidélité

export const loyaltyConfig = {
  // Calcul des points
  pointsPerAmount: 100, // 1 point pour 100 FCFA dépensés
  
  // Niveaux de fidélité
  levels: [
    {
      name: 'Bronze',
      icon: '🥉',
      minPoints: 0,
      maxPoints: 499,
      bonus: 0, // +0% de points bonus
      color: '#CD7F32',
      benefits: [
        'Accumulez des points',
        'Historique des achats',
        'Notifications exclusives'
      ]
    },
    {
      name: 'Argent',
      icon: '🥈',
      minPoints: 500,
      maxPoints: 1999,
      bonus: 10, // +10% de points bonus
      color: '#C0C0C0',
      benefits: [
        'Tous les avantages Bronze',
        '+10% de points sur chaque achat',
        'Accès prioritaire aux promotions',
        'Support client prioritaire'
      ]
    },
    {
      name: 'Or',
      icon: '🥇',
      minPoints: 2000,
      maxPoints: Infinity,
      bonus: 20, // +20% de points bonus
      color: '#FFD700',
      benefits: [
        'Tous les avantages Argent',
        '+20% de points sur chaque achat',
        'Livraisons prioritaires',
        'Réductions exclusives',
        'Cadeaux d\'anniversaire'
      ]
    }
  ],
  
  // Récompenses échangeables (RÉÉQUILIBRÉ pour plus de valeur)
  rewards: [
    {
      id: 'discount_5',
      name: 'Réduction 5%',
      description: 'Économisez 5% sur votre prochaine commande',
      icon: '💰',
      pointsCost: 500,
      type: 'discount',
      value: 5 // 5% de réduction (50 000 FCFA d'achats)
    },
    {
      id: 'discount_10',
      name: 'Réduction 10%',
      description: 'Économisez 10% sur votre prochaine commande',
      icon: '🎁',
      pointsCost: 1000,
      type: 'discount',
      value: 10 // (100 000 FCFA d'achats)
    },
    {
      id: 'free_delivery',
      name: 'Livraison Gratuite',
      description: 'Livraison gratuite sur votre prochaine commande',
      icon: '🚚',
      pointsCost: 1500,
      type: 'free_delivery',
      value: true // (150 000 FCFA d'achats)
    },
    {
      id: 'discount_15',
      name: 'Réduction 15%',
      description: 'Économisez 15% sur votre prochaine commande',
      icon: '🎉',
      pointsCost: 2500,
      type: 'discount',
      value: 15 // (250 000 FCFA d'achats)
    },
    {
      id: 'discount_20',
      name: 'Réduction 20%',
      description: 'Économisez 20% sur votre prochaine commande',
      icon: '🌟',
      pointsCost: 5000,
      type: 'discount',
      value: 20 // (500 000 FCFA d'achats)
    }
  ]
};

// Calculer les points gagnés pour un montant
export const calculatePoints = (amount, currentPoints = 0) => {
  const basePoints = Math.floor(amount / loyaltyConfig.pointsPerAmount);
  
  // Trouver le niveau actuel
  const level = getUserLevel(currentPoints);
  
  // Appliquer le bonus du niveau
  const bonusPoints = Math.floor(basePoints * (level.bonus / 100));
  
  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    level: level.name
  };
};

// Obtenir le niveau d'un utilisateur
export const getUserLevel = (points) => {
  return loyaltyConfig.levels.find(
    level => points >= level.minPoints && points <= level.maxPoints
  ) || loyaltyConfig.levels[0];
};

// Calculer la progression vers le prochain niveau
export const getLevelProgress = (points) => {
  const currentLevel = getUserLevel(points);
  const currentIndex = loyaltyConfig.levels.indexOf(currentLevel);
  
  // Si dernier niveau
  if (currentIndex === loyaltyConfig.levels.length - 1) {
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      pointsToNext: 0,
      isMaxLevel: true
    };
  }
  
  const nextLevel = loyaltyConfig.levels[currentIndex + 1];
  const pointsInCurrentLevel = points - currentLevel.minPoints;
  const pointsNeededForNext = nextLevel.minPoints - currentLevel.minPoints;
  const progress = (pointsInCurrentLevel / pointsNeededForNext) * 100;
  const pointsToNext = nextLevel.minPoints - points;
  
  return {
    currentLevel,
    nextLevel,
    progress: Math.min(progress, 100),
    pointsToNext,
    isMaxLevel: false
  };
};

// Vérifier si l'utilisateur peut échanger une récompense
export const canRedeemReward = (userPoints, rewardId) => {
  const reward = loyaltyConfig.rewards.find(r => r.id === rewardId);
  if (!reward) return false;
  return userPoints >= reward.pointsCost;
};
