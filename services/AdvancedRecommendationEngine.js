// services/AdvancedRecommendationEngine.js - MOTEUR DE RECOMMANDATIONS AVANCÉ
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import UserProfileService from './UserProfileService';

class AdvancedRecommendationEngine {
  constructor() {
    this.productCache = [];
    this.userSimilarityMatrix = {};
    this.productSimilarityMatrix = {};
  }

  /**
   * Génère des recommandations personnalisées pour l'utilisateur
   */
  async getPersonalizedRecommendations(userId, allProducts = [], limit = 10) {
    try {
      const userProfile = await UserProfileService.getUserProfile(userId);
      if (!userProfile) {
        // Utilisateur non connecté - retourner les produits populaires
        return this.getPopularProducts(allProducts, limit);
      }

      const recommendations = [];

      // 1. Recommandations basées sur l'historique d'achat (30%)
      const purchaseBasedRecs = await this.getPurchaseBasedRecommendations(
        userProfile,
        allProducts
      );
      recommendations.push(...purchaseBasedRecs.slice(0, Math.ceil(limit * 0.3)));

      // 2. Recommandations basées sur les catégories préférées (25%)
      const categoryBasedRecs = this.getCategoryBasedRecommendations(
        userProfile,
        allProducts
      );
      recommendations.push(...categoryBasedRecs.slice(0, Math.ceil(limit * 0.25)));

      // 3. Filtrage collaboratif (20%)
      const collaborativeRecs = await this.getCollaborativeRecommendations(
        userId,
        userProfile,
        allProducts
      );
      recommendations.push(...collaborativeRecs.slice(0, Math.ceil(limit * 0.2)));

      // 4. Recommandations basées sur le budget (15%)
      const budgetBasedRecs = this.getBudgetBasedRecommendations(
        userProfile,
        allProducts
      );
      recommendations.push(...budgetBasedRecs.slice(0, Math.ceil(limit * 0.15)));

      // 5. Nouveautés et tendances (10%)
      const trendingRecs = this.getTrendingProducts(allProducts);
      recommendations.push(...trendingRecs.slice(0, Math.ceil(limit * 0.1)));

      // Dédupliquer et scorer
      const uniqueRecs = this.deduplicateAndScore(recommendations, userProfile);

      // Trier par score et retourner
      return uniqueRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ product, score, reason }) => ({
          ...product,
          recommendationScore: score,
          recommendationReason: reason
        }));
    } catch (error) {
      console.error('Erreur recommandations personnalisées:', error);
      return this.getPopularProducts(allProducts, limit);
    }
  }

  /**
   * Recommandations basées sur l'historique d'achat
   */
  async getPurchaseBasedRecommendations(userProfile, allProducts) {
    const recommendations = [];

    // Produits achetés par l'utilisateur
    const purchasedProductIds = new Set();
    userProfile.orders.forEach(order => {
      order.items?.forEach(item => {
        purchasedProductIds.add(item.productId);
      });
    });

    if (purchasedProductIds.size === 0) {
      return recommendations;
    }

    // Trouver des produits similaires (même catégorie, même startup, prix similaire)
    allProducts.forEach(product => {
      if (purchasedProductIds.has(product.id)) return; // Déjà acheté

      let similarityScore = 0;
      let reason = '';

      userProfile.orders.forEach(order => {
        order.items?.forEach(item => {
          const purchasedProduct = allProducts.find(p => p.id === item.productId);
          if (!purchasedProduct) return;

          // Même catégorie
          if (product.category === purchasedProduct.category) {
            similarityScore += 3;
            reason = `Similaire à "${purchasedProduct.name}"`;
          }

          // Même startup
          if (product.startupId === purchasedProduct.startupId) {
            similarityScore += 2;
            if (!reason) reason = `De la même startup que "${purchasedProduct.name}"`;
          }

          // Prix similaire (±30%)
          const priceDiff = Math.abs(product.price - purchasedProduct.price) / purchasedProduct.price;
          if (priceDiff < 0.3) {
            similarityScore += 1;
          }
        });
      });

      if (similarityScore > 0) {
        recommendations.push({
          product,
          score: similarityScore,
          reason: reason || 'Basé sur tes achats précédents'
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Recommandations basées sur les catégories préférées
   */
  getCategoryBasedRecommendations(userProfile, allProducts) {
    const recommendations = [];
    const preferences = userProfile.preferences;

    if (!preferences || !preferences.categories) {
      return recommendations;
    }

    // Obtenir les catégories favorites
    const favoriteCategories = Object.entries(preferences.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    // Trouver les meilleurs produits dans ces catégories
    allProducts.forEach(product => {
      if (favoriteCategories.includes(product.category)) {
        const categoryScore = preferences.categories[product.category] || 0;
        const ratingScore = (product.rating || 3) / 5 * 2;
        const salesScore = Math.min((product.sales || 0) / 10, 2);

        const score = categoryScore + ratingScore + salesScore;

        recommendations.push({
          product,
          score,
          reason: `Top produit dans ta catégorie favorite: ${product.category}`
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Filtrage collaboratif - "Les utilisateurs similaires ont aussi aimé"
   */
  async getCollaborativeRecommendations(userId, userProfile, allProducts) {
    const recommendations = [];

    try {
      // Trouver des utilisateurs similaires
      const similarUsers = await this.findSimilarUsers(userId, userProfile);

      if (similarUsers.length === 0) {
        return recommendations;
      }

      // Obtenir les produits achetés par des utilisateurs similaires
      const productScores = {};

      for (const similarUser of similarUsers) {
        for (const order of similarUser.orders) {
          order.items?.forEach(item => {
            if (!productScores[item.productId]) {
              productScores[item.productId] = {
                score: 0,
                count: 0
              };
            }
            productScores[item.productId].score += similarUser.similarity;
            productScores[item.productId].count++;
          });
        }
      }

      // Filtrer les produits déjà achetés par l'utilisateur
      const userPurchasedIds = new Set();
      userProfile.orders.forEach(order => {
        order.items?.forEach(item => userPurchasedIds.add(item.productId));
      });

      // Créer les recommandations
      Object.entries(productScores).forEach(([productId, data]) => {
        if (userPurchasedIds.has(productId)) return;

        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const avgScore = data.score / data.count;

        recommendations.push({
          product,
          score: avgScore * data.count, // Score pondéré
          reason: `${data.count} utilisateur${data.count > 1 ? 's' : ''} similaire${data.count > 1 ? 's' : ''} ${data.count > 1 ? 'ont' : 'a'} aimé ce produit`
        });
      });

      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Erreur filtrage collaboratif:', error);
      return recommendations;
    }
  }

  /**
   * Trouve des utilisateurs avec des préférences similaires
   */
  async findSimilarUsers(userId, userProfile, limit = 10) {
    try {
      // Récupérer tous les profils utilisateurs (optimisation possible avec indexation)
      const usersSnap = await getDocs(collection(db, 'userPreferences'));
      const similarUsers = [];

      for (const userDoc of usersSnap.docs) {
        if (userDoc.id === userId) continue;

        const otherPreferences = userDoc.data();
        const similarity = this.calculateUserSimilarity(
          userProfile.preferences,
          otherPreferences
        );

        if (similarity > 0.3) { // Seuil de similarité
          // Récupérer les commandes de cet utilisateur
          const orders = await UserProfileService.getUserOrders(userDoc.id);

          similarUsers.push({
            userId: userDoc.id,
            similarity,
            preferences: otherPreferences,
            orders
          });
        }
      }

      return similarUsers
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Erreur recherche utilisateurs similaires:', error);
      return [];
    }
  }

  /**
   * Calcule la similarité entre deux profils utilisateurs (cosine similarity)
   */
  calculateUserSimilarity(prefs1, prefs2) {
    if (!prefs1 || !prefs2) return 0;

    let similarity = 0;
    let totalWeight = 0;

    // Similarité des catégories (poids 40%)
    if (prefs1.categories && prefs2.categories) {
      const catSimilarity = this.calculateCategorySimilarity(
        prefs1.categories,
        prefs2.categories
      );
      similarity += catSimilarity * 0.4;
      totalWeight += 0.4;
    }

    // Similarité du budget (poids 30%)
    if (prefs1.priceRange && prefs2.priceRange) {
      const priceSimilarity = this.calculatePriceSimilarity(
        prefs1.priceRange,
        prefs2.priceRange
      );
      similarity += priceSimilarity * 0.3;
      totalWeight += 0.3;
    }

    // Similarité des startups (poids 20%)
    if (prefs1.startups && prefs2.startups) {
      const startupSimilarity = this.calculateObjectSimilarity(
        prefs1.startups,
        prefs2.startups
      );
      similarity += startupSimilarity * 0.2;
      totalWeight += 0.2;
    }

    // Similarité des mots-clés (poids 10%)
    if (prefs1.keywords && prefs2.keywords) {
      const keywordSimilarity = this.calculateObjectSimilarity(
        prefs1.keywords,
        prefs2.keywords
      );
      similarity += keywordSimilarity * 0.1;
      totalWeight += 0.1;
    }

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  /**
   * Calcule la similarité entre deux ensembles de catégories
   */
  calculateCategorySimilarity(cats1, cats2) {
    const keys1 = Object.keys(cats1);
    const keys2 = Object.keys(cats2);
    const commonKeys = keys1.filter(k => keys2.includes(k));

    if (commonKeys.length === 0) return 0;

    // Jaccard similarity
    const union = new Set([...keys1, ...keys2]);
    return commonKeys.length / union.size;
  }

  /**
   * Calcule la similarité de budget
   */
  calculatePriceSimilarity(range1, range2) {
    const pref1 = range1.preferred || 0;
    const pref2 = range2.preferred || 0;

    if (pref1 === 0 || pref2 === 0) return 0;

    const diff = Math.abs(pref1 - pref2);
    const max = Math.max(pref1, pref2);

    return 1 - (diff / max);
  }

  /**
   * Calcule la similarité entre deux objets de scores
   */
  calculateObjectSimilarity(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const commonKeys = keys1.filter(k => keys2.includes(k));

    if (commonKeys.length === 0) return 0;

    const union = new Set([...keys1, ...keys2]);
    return commonKeys.length / union.size;
  }

  /**
   * Recommandations basées sur le budget
   */
  getBudgetBasedRecommendations(userProfile, allProducts) {
    const recommendations = [];
    const preferredPrice = userProfile.spendingProfile?.averageOrderValue || 0;

    if (preferredPrice === 0) return recommendations;

    allProducts.forEach(product => {
      // Produits dans la gamme de prix préférée (±30%)
      const priceDiff = Math.abs(product.price - preferredPrice) / preferredPrice;

      if (priceDiff < 0.3) {
        const score = (1 - priceDiff) * 5; // Score inversement proportionnel à la différence

        recommendations.push({
          product,
          score,
          reason: `Dans ta gamme de prix habituelle (~${preferredPrice.toLocaleString()} XAF)`
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Produits tendances
   */
  getTrendingProducts(allProducts) {
    return allProducts
      .filter(p => (p.sales || 0) > 5 || (p.rating || 0) >= 4)
      .sort((a, b) => (b.sales || 0) - (a.sales || 0) || (b.rating || 0) - (a.rating || 0))
      .slice(0, 10)
      .map(product => ({
        product,
        score: ((product.sales || 0) / 10 + (product.rating || 0)),
        reason: 'Produit tendance sur PipoMarket'
      }));
  }

  /**
   * Produits populaires (fallback)
   */
  getPopularProducts(allProducts, limit = 10) {
    return allProducts
      .sort((a, b) => {
        const scoreA = (a.sales || 0) * 2 + (a.rating || 0) * 10;
        const scoreB = (b.sales || 0) * 2 + (b.rating || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(product => ({
        ...product,
        recommendationScore: (product.sales || 0) + (product.rating || 0) * 2,
        recommendationReason: 'Produit populaire'
      }));
  }

  /**
   * Déduplique et calcule le score final
   */
  deduplicateAndScore(recommendations, userProfile) {
    const productMap = new Map();

    recommendations.forEach(({ product, score, reason }) => {
      if (!product) return;

      if (productMap.has(product.id)) {
        // Produit déjà présent - augmenter le score
        const existing = productMap.get(product.id);
        existing.score += score;
        existing.reasons.push(reason);
      } else {
        productMap.set(product.id, {
          product,
          score,
          reasons: [reason]
        });
      }
    });

    return Array.from(productMap.values()).map(({ product, score, reasons }) => ({
      product,
      score,
      reason: reasons[0] // Prendre la première raison (la plus importante)
    }));
  }

  /**
   * Recommandations contextuelles basées sur les entités actuelles
   */
  getContextualRecommendations(entities, allProducts, limit = 5) {
    let filtered = [...allProducts];

    // Filtrer par catégorie si spécifiée
    if (entities.category) {
      filtered = filtered.filter(p => p.category === entities.category);
    }

    // Filtrer par budget si spécifié
    if (entities.maxBudget) {
      filtered = filtered.filter(p => p.price <= entities.maxBudget);
    }

    // Filtrer par localisation si spécifiée
    if (entities.location) {
      const locationProducts = filtered.filter(p =>
        p.city?.toLowerCase().includes(entities.location.toLowerCase())
      );
      if (locationProducts.length > 0) {
        filtered = locationProducts;
      }
    }

    // Filtrer par couleur si spécifiée
    if (entities.colors && entities.colors.length > 0) {
      const colorProducts = filtered.filter(p =>
        entities.colors.some(color =>
          p.name?.toLowerCase().includes(color) ||
          p.description?.toLowerCase().includes(color)
        )
      );
      if (colorProducts.length > 0) {
        filtered = colorProducts;
      }
    }

    // Trier selon la préférence
    if (entities.sortBy) {
      switch (entities.sortBy) {
        case 'price_asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'popularity':
          filtered.sort((a, b) => (b.sales || 0) - (a.sales || 0));
          break;
        case 'rating':
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'newest':
          filtered.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          break;
      }
    } else {
      // Par défaut: meilleur rapport qualité/prix
      filtered.sort((a, b) => {
        const scoreA = (a.rating || 3) / (a.price / 10000);
        const scoreB = (b.rating || 3) / (b.price / 10000);
        return scoreB - scoreA;
      });
    }

    return filtered.slice(0, limit).map(product => ({
      ...product,
      recommendationReason: this.generateContextualReason(entities)
    }));
  }

  /**
   * Génère une raison contextuelle
   */
  generateContextualReason(entities) {
    const reasons = [];

    if (entities.category) reasons.push(`Catégorie: ${entities.category}`);
    if (entities.maxBudget) reasons.push(`Budget: ${entities.maxBudget.toLocaleString()} XAF`);
    if (entities.location) reasons.push(`Disponible à ${entities.location}`);
    if (entities.colors) reasons.push(`Couleur: ${entities.colors.join(', ')}`);

    return reasons.length > 0 ? reasons.join(' • ') : 'Recommandé pour toi';
  }

  /**
   * Produits "Vous aimerez aussi" pour un produit spécifique
   */
  getSimilarProducts(productId, allProducts, limit = 5) {
    const targetProduct = allProducts.find(p => p.id === productId);
    if (!targetProduct) return [];

    const similar = [];

    allProducts.forEach(product => {
      if (product.id === productId) return;

      let similarity = 0;

      // Même catégorie
      if (product.category === targetProduct.category) similarity += 3;

      // Même startup
      if (product.startupId === targetProduct.startupId) similarity += 2;

      // Prix similaire (±30%)
      const priceDiff = Math.abs(product.price - targetProduct.price) / targetProduct.price;
      if (priceDiff < 0.3) similarity += 2;

      // Mots communs dans le nom
      const nameWords1 = targetProduct.name.toLowerCase().split(/\s+/);
      const nameWords2 = product.name.toLowerCase().split(/\s+/);
      const commonWords = nameWords1.filter(w => nameWords2.includes(w) && w.length > 3);
      similarity += commonWords.length;

      if (similarity > 0) {
        similar.push({ product, similarity });
      }
    });

    return similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(({ product }) => ({
        ...product,
        recommendationReason: 'Similaire à ce produit'
      }));
  }
}

export default new AdvancedRecommendationEngine();