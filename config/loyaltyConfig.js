// config/loyaltyConfig.js - ✅ VERSION FINALE CORRIGÉE

// NIVEAUX DE FIDÉLITÉ
export const loyaltyConfig = {
  // Règle de base: 1 point = 100 FCFA dépensés
  pointsPerFCFA: 100,

  // 🛡️ LIMITES DE SÉCURITÉ
  limits: {
    maxEligibleAmount: 10000, // Réduction sur max 10,000 FCFA
    maxDiscountPerOrder: 2000, // Max 2,000 FCFA de réduction
    maxCreditPerOrder: 5000, // Max 5,000 FCFA de crédit
    minOrderAmount: 3000, // Min 3,000 FCFA pour utiliser récompense
  },

  // NIVEAUX
  levels: [
    {
      name: 'Bronze',
      minPoints: 0,
      maxPoints: 999,
      icon: '🥉',
      color: '#CD7F32',
      bonus: 0,
      benefits: [
        'Accumulation de points',
        'Récompenses sur achats < 10,000 FCFA',
      ],
    },
    {
      name: 'Argent',
      minPoints: 1000,
      maxPoints: 4999,
      icon: '🥈',
      color: '#C0C0C0',
      bonus: 5,
      benefits: [
        '+5% de points bonus',
        'Récompenses plafonnées',
        'Support prioritaire',
      ],
    },
    {
      name: 'Or',
      minPoints: 5000,
      maxPoints: 9999,
      icon: '🥇',
      color: '#FFD700',
      bonus: 10,
      benefits: [
        '+10% de points bonus',
        'Livraison gratuite',
        'Accès ventes privées',
      ],
    },
    {
      name: 'Platine',
      minPoints: 10000,
      maxPoints: 24999,
      icon: '💎',
      color: '#E5E4E2',
      bonus: 15,
      benefits: [
        '+15% de points bonus',
        'Livraison gratuite illimitée',
        'Réductions majorées',
      ],
    },
    {
      name: 'Diamant',
      minPoints: 25000,
      maxPoints: Infinity,
      icon: '💠',
      color: '#B9F2FF',
      bonus: 20,
      benefits: [
        '+20% de points bonus',
        'Avantages VIP',
        'Concierge shopping',
      ],
    },
  ],

  // 🎁 RÉCOMPENSES
  rewards: [
    // 💰 CRÉDITS
    {
      id: 'credit_500',
      type: 'credit',
      name: '500 FCFA de crédit',
      pointsCost: 500,
      value: 500,
      icon: '💵',
      paidBy: 'pipomarket',
      description: 'Crédit limité à 5,000 FCFA par commande',
      category: 'credit',
      maxUsablePerOrder: 5000,
    },
    {
      id: 'credit_1000',
      type: 'credit',
      name: '1,000 FCFA de crédit',
      pointsCost: 1000,
      value: 1000,
      icon: '💰',
      paidBy: 'pipomarket',
      description: 'Crédit limité à 5,000 FCFA par commande',
      category: 'credit',
      maxUsablePerOrder: 5000,
    },
    {
      id: 'credit_2500',
      type: 'credit',
      name: '2,500 FCFA de crédit',
      pointsCost: 2500,
      value: 2500,
      icon: '💎',
      paidBy: 'pipomarket',
      description: 'Crédit limité à 5,000 FCFA par commande',
      category: 'credit',
      maxUsablePerOrder: 5000,
    },
    {
      id: 'credit_5000',
      type: 'credit',
      name: '5,000 FCFA de crédit',
      pointsCost: 5000,
      value: 5000,
      icon: '💍',
      paidBy: 'pipomarket',
      description: 'Crédit max par commande',
      category: 'credit',
      maxUsablePerOrder: 5000,
    },

    // 🎁 RÉDUCTIONS
    {
      id: 'discount_5',
      type: 'discount',
      name: '5% de réduction',
      pointsCost: 800,
      value: 5,
      icon: '🎁',
      paidBy: 'pipomarket',
      description: 'Max 2,000 FCFA de réduction',
      category: 'discount',
      maxDiscount: 2000,
      applicableOn: 'first_10k',
    },
    {
      id: 'discount_10',
      type: 'discount',
      name: '10% de réduction',
      pointsCost: 2000,
      value: 10,
      icon: '🎉',
      paidBy: 'pipomarket',
      description: 'Max 2,000 FCFA de réduction',
      category: 'discount',
      maxDiscount: 2000,
      applicableOn: 'first_10k',
    },
    {
      id: 'discount_15',
      type: 'discount',
      name: '15% de réduction',
      pointsCost: 3500,
      value: 15,
      icon: '🎊',
      paidBy: 'pipomarket',
      description: 'Max 2,000 FCFA de réduction',
      category: 'discount',
      maxDiscount: 2000,
      applicableOn: 'first_10k',
    },
    {
      id: 'discount_20',
      type: 'discount',
      name: '20% de réduction',
      pointsCost: 5000,
      value: 20,
      icon: '🌟',
      paidBy: 'pipomarket',
      description: 'Max 2,000 FCFA de réduction',
      category: 'discount',
      maxDiscount: 2000,
      applicableOn: 'first_10k',
    },

    // 🚚 LIVRAISON
    {
      id: 'free_delivery',
      type: 'delivery',
      name: 'Livraison gratuite',
      pointsCost: 500,
      value: 0,
      icon: '🚚',
      paidBy: 'pipomarket',
      description: 'Livraison offerte sans limite',
      freeDelivery: true,
      category: 'delivery',
    },
    {
      id: 'express_delivery',
      type: 'delivery',
      name: 'Livraison express gratuite',
      pointsCost: 1000,
      value: 0,
      icon: '🚀',
      paidBy: 'pipomarket',
      description: 'Livraison rapide offerte',
      freeDelivery: true,
      expressDelivery: true,
      category: 'delivery',
    },
  ],

  // 💰 COMMISSIONS
  commission: {
    standard: 5,
    premium: 3,
    loyaltyFundPercentage: 40,
  },
};

// ✅ OBTENIR NIVEAU UTILISATEUR
export const getUserLevel = (points = 0) => {
  const level = loyaltyConfig.levels.find(
    (l) => points >= l.minPoints && points <= l.maxPoints
  );
  return level || loyaltyConfig.levels[0];
};

// ✅ CALCULER POINTS GAGNÉS
export const calculatePoints = (orderAmount, currentPoints = 0) => {
  const level = getUserLevel(currentPoints);
  const basePoints = Math.floor(orderAmount / loyaltyConfig.pointsPerFCFA);
  const bonusPoints = Math.floor((basePoints * level.bonus) / 100);

  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    level: level.name,
  };
};

// ✅ PROGRESSION VERS NIVEAU SUIVANT
export const getLevelProgress = (currentPoints = 0) => {
  const currentLevel = getUserLevel(currentPoints);
  const currentLevelIndex = loyaltyConfig.levels.findIndex(
    (l) => l.name === currentLevel.name
  );

  // Niveau maximum atteint
  if (currentLevelIndex === loyaltyConfig.levels.length - 1) {
    return {
      progress: 100,
      pointsToNext: 0,
      isMaxLevel: true,
      currentLevel,
      nextLevel: null,
    };
  }

  const nextLevel = loyaltyConfig.levels[currentLevelIndex + 1];
  const pointsInCurrentLevel = currentPoints - currentLevel.minPoints;
  const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
  const progress = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;

  return {
    progress: Math.min(Math.max(progress, 0), 100),
    pointsToNext: Math.max(0, nextLevel.minPoints - currentPoints),
    nextLevel,
    currentLevel,
    isMaxLevel: false,
  };
};

// ✅ EXPORTER PAR DÉFAUT
export default loyaltyConfig;