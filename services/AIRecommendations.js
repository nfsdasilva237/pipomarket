// services/AIRecommendations.js - Système de recommandations IA
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

class AIRecommendationsService {
  /**
   * Obtenir des recommandations basées sur un produit
   * "Les clients qui ont acheté X ont aussi aimé Y"
   */
  static async getProductRecommendations(productId, productCategory, maxResults = 6) {
    try {
      const recommendations = [];

      // 1. Produits de la même catégorie
      const categoryQuery = query(
        collection(db, 'products'),
        where('category', '==', productCategory),
        where('id', '!=', productId),
        orderBy('views', 'desc'),
        limit(maxResults)
      );

      const categorySnapshot = await getDocs(categoryQuery);
      categorySnapshot.forEach(doc => {
        recommendations.push({
          ...doc.data(),
          id: doc.id,
          reason: 'Même catégorie',
        });
      });

      return recommendations;
    } catch (error) {
      console.error('Erreur recommandations produit:', error);
      return [];
    }
  }

  /**
   * Recommandations personnalisées basées sur l'historique
   */
  static async getPersonalizedRecommendations(userId, maxResults = 8) {
    try {
      // 1. Récupérer l'historique des commandes
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const purchasedCategories = new Set();
      const purchasedStartups = new Set();

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        order.items?.forEach(item => {
          if (item.category) purchasedCategories.add(item.category);
          if (item.startupId) purchasedStartups.add(item.startupId);
        });
      });

      // 2. Recommander des produits similaires
      const recommendations = [];

      // Produits des mêmes catégories
      for (const category of Array.from(purchasedCategories).slice(0, 3)) {
        const categoryQuery = query(
          collection(db, 'products'),
          where('category', '==', category),
          where('isActive', '==', true),
          orderBy('rating', 'desc'),
          limit(3)
        );

        const snapshot = await getDocs(categoryQuery);
        snapshot.forEach(doc => {
          recommendations.push({
            ...doc.data(),
            id: doc.id,
            reason: `Basé sur vos achats en ${category}`,
          });
        });
      }

      // Produits des mêmes startups
      for (const startupId of Array.from(purchasedStartups).slice(0, 2)) {
        const startupQuery = query(
          collection(db, 'products'),
          where('startupId', '==', startupId),
          where('isActive', '==', true),
          limit(2)
        );

        const snapshot = await getDocs(startupQuery);
        snapshot.forEach(doc => {
          recommendations.push({
            ...doc.data(),
            id: doc.id,
            reason: 'D\'une startup que vous aimez',
          });
        });
      }

      // Limiter et dédupliquer
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
      return uniqueRecommendations.slice(0, maxResults);

    } catch (error) {
      console.error('Erreur recommandations personnalisées:', error);
      return [];
    }
  }

  /**
   * Recommandations "Nouveautés pour vous"
   */
  static async getNewForYouRecommendations(userId, maxResults = 6) {
    try {
      // Récupérer les catégories préférées de l'utilisateur
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('id', '==', userId), limit(1))
      );

      let preferredCategories = [];
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        preferredCategories = userData.preferredCategories || [];
      }

      // Produits récents dans les catégories préférées
      const recommendations = [];
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const category of preferredCategories.slice(0, 3)) {
        const newQuery = query(
          collection(db, 'products'),
          where('category', '==', category),
          where('createdAt', '>=', oneWeekAgo),
          orderBy('createdAt', 'desc'),
          limit(2)
        );

        const snapshot = await getDocs(newQuery);
        snapshot.forEach(doc => {
          recommendations.push({
            ...doc.data(),
            id: doc.id,
            reason: '🆕 Nouveau',
            isNew: true,
          });
        });
      }

      return recommendations.slice(0, maxResults);
    } catch (error) {
      console.error('Erreur nouveautés:', error);
      return [];
    }
  }

  /**
   * Recommandations "Populaires près de vous"
   */
  static async getLocalPopularRecommendations(userCity, maxResults = 8) {
    try {
      const popularQuery = query(
        collection(db, 'products'),
        where('city', '==', userCity),
        where('isActive', '==', true),
        orderBy('sales', 'desc'),
        limit(maxResults)
      );

      const snapshot = await getDocs(popularQuery);
      const recommendations = [];

      snapshot.forEach(doc => {
        recommendations.push({
          ...doc.data(),
          id: doc.id,
          reason: `🔥 Populaire à ${userCity}`,
        });
      });

      return recommendations;
    } catch (error) {
      console.error('Erreur populaires locaux:', error);
      return [];
    }
  }

  /**
   * Bundle intelligent - produits qui vont bien ensemble
   */
  static getBundleSuggestions(productCategory) {
    const bundles = {
      'Pâtisserie': [
        { category: 'Boissons', reason: '🥤 Parfait avec' },
        { category: 'Décoration', reason: '🎉 Pour la fête' },
      ],
      'Beauté': [
        { category: 'Parfums', reason: '✨ Complétez votre look' },
        { category: 'Accessoires', reason: '💄 Va bien avec' },
      ],
      'Technologie': [
        { category: 'Accessoires Tech', reason: '🔌 Accessoire utile' },
        { category: 'Logiciels', reason: '💿 Logiciels compatibles' },
      ],
      'Sport': [
        { category: 'Vêtements Sport', reason: '👕 Tenue assortie' },
        { category: 'Nutrition', reason: '💪 Pour la performance' },
      ],
      'Mode': [
        { category: 'Chaussures', reason: '👟 Assortir avec' },
        { category: 'Accessoires', reason: '👜 Compléter le style' },
      ],
    };

    return bundles[productCategory] || [];
  }

  /**
   * Score de similarité entre produits (algorithme simple)
   */
  static calculateSimilarityScore(product1, product2) {
    let score = 0;

    // Même catégorie = +40 points
    if (product1.category === product2.category) score += 40;

    // Même startup = +30 points
    if (product1.startupId === product2.startupId) score += 30;

    // Prix similaire (±20%) = +20 points
    const priceDiff = Math.abs(product1.price - product2.price) / product1.price;
    if (priceDiff <= 0.2) score += 20;

    // Tags communs = +10 points par tag
    const commonTags = product1.tags?.filter(tag => 
      product2.tags?.includes(tag)
    ) || [];
    score += commonTags.length * 10;

    return score;
  }

  /**
   * Dédupliquer et trier les recommandations
   */
  static deduplicateRecommendations(recommendations) {
    const seen = new Set();
    const unique = [];

    for (const rec of recommendations) {
      if (!seen.has(rec.id)) {
        seen.add(rec.id);
        unique.push(rec);
      }
    }

    return unique;
  }

  /**
   * Prédire la probabilité d'achat (algorithme simple)
   */
  static predictPurchaseProbability(product, userHistory) {
    let probability = 0.5; // Base 50%

    // L'utilisateur a déjà acheté dans cette catégorie
    const categoryPurchases = userHistory.filter(
      item => item.category === product.category
    );
    if (categoryPurchases.length > 0) {
      probability += 0.2;
    }

    // Produit populaire (bonnes ventes)
    if (product.sales > 100) probability += 0.1;

    // Bonne note
    if (product.rating >= 4.5) probability += 0.1;

    // Prix dans la moyenne des achats de l'utilisateur
    const avgPurchasePrice = userHistory.reduce((sum, item) => 
      sum + (item.price || 0), 0
    ) / userHistory.length;

    if (Math.abs(product.price - avgPurchasePrice) < avgPurchasePrice * 0.3) {
      probability += 0.1;
    }

    return Math.min(probability, 1.0); // Max 100%
  }
}

export default AIRecommendationsService;
