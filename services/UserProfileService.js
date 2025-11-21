// services/UserProfileService.js - SERVICE DE PROFIL UTILISATEUR AVEC APPRENTISSAGE
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

class UserProfileService {
  constructor() {
    this.profileCache = null;
    this.lastUpdate = null;
  }

  /**
   * Convertit un timestamp Firestore en objet Date de manière sûre
   */
  safeToDate(timestamp) {
    if (!timestamp) return new Date();

    // Si c'est déjà un objet Date
    if (timestamp instanceof Date) return timestamp;

    // Si c'est un Timestamp Firestore avec la méthode toDate
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    // Si c'est un nombre (timestamp en millisecondes)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }

    // Si c'est une chaîne de caractères
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }

    // Par défaut, retourner la date actuelle
    return new Date();
  }

  /**
   * Récupère le profil complet de l'utilisateur avec toutes ses interactions
   */
  async getUserProfile(userId = null) {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return null;

    try {
      // Vérifier le cache (5 minutes)
      if (this.profileCache && this.lastUpdate && Date.now() - this.lastUpdate < 300000) {
        return this.profileCache;
      }

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();

      // Récupérer l'historique complet
      const [orders, bdlOrders, favorites, searchHistory, interactions] = await Promise.all([
        this.getUserOrders(uid),
        this.getUserBDLOrders(uid),
        this.getUserFavorites(uid),
        this.getSearchHistory(uid),
        this.getUserInteractions(uid)
      ]);

      const profile = {
        ...userData,
        userId: uid,
        orders,
        bdlOrders,
        favorites,
        searchHistory,
        interactions,
        preferences: await this.analyzePreferences(uid, orders, favorites, searchHistory, interactions),
        behaviorProfile: await this.analyzeBehavior(orders, interactions),
        spendingProfile: this.analyzeSpending(orders, bdlOrders),
        engagementScore: this.calculateEngagementScore(orders, bdlOrders, favorites, interactions)
      };

      // Mettre en cache
      this.profileCache = profile;
      this.lastUpdate = Date.now();

      return profile;
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      return null;
    }
  }

  /**
   * Récupère les commandes de l'utilisateur
   */
  async getUserOrders(userId) {
    try {
      const ordersSnap = await getDocs(
        query(collection(db, 'orders'), where('userId', '==', userId))
      );
      return ordersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: this.safeToDate(doc.data().createdAt)
      }));
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      return [];
    }
  }

  /**
   * Récupère les commandes BDL
   */
  async getUserBDLOrders(userId) {
    try {
      const bdlSnap = await getDocs(
        query(collection(db, 'bdlServiceOrders'), where('userId', '==', userId))
      );
      return bdlSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: this.safeToDate(doc.data().createdAt)
      }));
    } catch (error) {
      console.error('Erreur récupération commandes BDL:', error);
      return [];
    }
  }

  /**
   * Récupère les favoris
   */
  async getUserFavorites(userId) {
    try {
      const localFavorites = await AsyncStorage.getItem(`favorites_${userId}`);
      if (localFavorites) {
        return JSON.parse(localFavorites);
      }
      return [];
    } catch (error) {
      console.error('Erreur récupération favoris:', error);
      return [];
    }
  }

  /**
   * Récupère l'historique de recherche
   */
  async getSearchHistory(userId) {
    try {
      const history = await AsyncStorage.getItem(`search_history_${userId}`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Récupère les interactions utilisateur (vues produits, clics, etc.)
   */
  async getUserInteractions(userId) {
    try {
      const interactionsSnap = await getDocs(
        query(collection(db, 'userInteractions'), where('userId', '==', userId))
      );
      return interactionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: this.safeToDate(doc.data().timestamp || doc.data().createdAt)
      }));
    } catch (error) {
      console.error('Erreur récupération interactions:', error);
      return [];
    }
  }

  /**
   * Analyse les préférences utilisateur
   */
  async analyzePreferences(userId, orders, favorites, searchHistory, interactions) {
    const preferences = {
      categories: {},
      priceRange: { min: 0, max: Infinity, preferred: 0 },
      brands: {},
      startups: {},
      locations: {},
      keywords: {},
      styles: [],
      colors: [],
      updatedAt: new Date()
    };

    // Analyser les catégories préférées
    [...orders, ...favorites, ...interactions].forEach(item => {
      if (item.category) {
        preferences.categories[item.category] = (preferences.categories[item.category] || 0) + 1;
      }
      if (item.startupId) {
        preferences.startups[item.startupId] = (preferences.startups[item.startupId] || 0) + 1;
      }
      if (item.city) {
        preferences.locations[item.city] = (preferences.locations[item.city] || 0) + 1;
      }
    });

    // Analyser la gamme de prix préférée
    const prices = orders
      .filter(o => o.totalAmount)
      .map(o => o.totalAmount);

    if (prices.length > 0) {
      preferences.priceRange.min = Math.min(...prices);
      preferences.priceRange.max = Math.max(...prices);
      preferences.priceRange.preferred = prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    // Analyser les mots-clés de recherche
    searchHistory.forEach(search => {
      const words = search.query?.toLowerCase().split(/\s+/) || [];
      words.forEach(word => {
        if (word.length > 3) {
          preferences.keywords[word] = (preferences.keywords[word] || 0) + 1;
        }
      });
    });

    // Sauvegarder les préférences
    try {
      await setDoc(doc(db, 'userPreferences', userId), preferences, { merge: true });
    } catch (error) {
      console.error('Erreur sauvegarde préférences:', error);
    }

    return preferences;
  }

  /**
   * Analyse le comportement d'achat
   */
  async analyzeBehavior(orders, interactions) {
    const now = new Date();
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const recentOrders = orders.filter(o => o.timestamp > last30Days);
    const quarterOrders = orders.filter(o => o.timestamp > last90Days);

    // Analyser la fréquence d'achat
    const purchaseFrequency = orders.length > 1
      ? this.calculateAverageDaysBetweenOrders(orders)
      : null;

    // Analyser le temps de décision moyen
    const decisionTime = this.analyzeDecisionTime(interactions, orders);

    // Détecter les patterns temporels
    const temporalPattern = this.detectTemporalPatterns(orders);

    return {
      purchaseFrequency,
      decisionTime,
      temporalPattern,
      recentActivity: {
        last30Days: recentOrders.length,
        last90Days: quarterOrders.length
      },
      conversionRate: this.calculateConversionRate(interactions, orders),
      averageCartSize: orders.length > 0
        ? orders.reduce((sum, o) => sum + (o.items?.length || 0), 0) / orders.length
        : 0,
      repeatPurchaseRate: this.calculateRepeatPurchaseRate(orders),
      preferredShoppingTime: this.getPreferredShoppingTime(orders, interactions)
    };
  }

  /**
   * Analyse les dépenses
   */
  analyzeSpending(orders, bdlOrders) {
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalBDL = bdlOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalLifetimeValue: totalSpent + totalBDL,
      productSpending: totalSpent,
      serviceSpending: totalBDL,
      averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
      largestPurchase: orders.length > 0 ? Math.max(...orders.map(o => o.totalAmount || 0)) : 0,
      spendingTrend: this.calculateSpendingTrend(orders),
      category: this.categorizeSpender(totalSpent + totalBDL, orders.length)
    };
  }

  /**
   * Calcule le score d'engagement
   */
  calculateEngagementScore(orders, bdlOrders, favorites, interactions) {
    let score = 0;

    // Points pour les commandes (max 40)
    score += Math.min(orders.length * 5, 40);

    // Points pour les services BDL (max 20)
    score += Math.min(bdlOrders.length * 10, 20);

    // Points pour les favoris (max 15)
    score += Math.min(favorites.length * 2, 15);

    // Points pour les interactions (max 15)
    score += Math.min(interactions.length * 0.5, 15);

    // Points pour l'activité récente (max 10)
    const recentActivity = [...orders, ...bdlOrders, ...interactions]
      .filter(item => {
        const itemDate = this.safeToDate(item.timestamp || item.createdAt);
        return itemDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }).length;
    score += Math.min(recentActivity * 2, 10);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Enregistre une interaction utilisateur
   */
  async trackInteraction(type, data) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const interaction = {
        userId,
        type, // 'view', 'click', 'search', 'add_to_cart', 'favorite', etc.
        ...data,
        timestamp: new Date()
      };

      await setDoc(doc(collection(db, 'userInteractions')), interaction);

      // Invalider le cache
      this.profileCache = null;
    } catch (error) {
      console.error('Erreur tracking interaction:', error);
    }
  }

  /**
   * Enregistre une recherche
   */
  async trackSearch(query, results) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const history = await this.getSearchHistory(userId);
      history.unshift({
        query,
        resultCount: results.length,
        timestamp: new Date().toISOString()
      });

      // Garder seulement les 100 dernières recherches
      const trimmed = history.slice(0, 100);
      await AsyncStorage.setItem(`search_history_${userId}`, JSON.stringify(trimmed));

      // Invalider le cache
      this.profileCache = null;
    } catch (error) {
      console.error('Erreur tracking search:', error);
    }
  }

  /**
   * Met à jour les préférences explicites
   */
  async updatePreferences(preferences) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      await setDoc(doc(db, 'userPreferences', userId), {
        ...preferences,
        updatedAt: new Date()
      }, { merge: true });

      // Invalider le cache
      this.profileCache = null;
    } catch (error) {
      console.error('Erreur update préférences:', error);
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  calculateAverageDaysBetweenOrders(orders) {
    if (orders.length < 2) return null;

    const sorted = [...orders].sort((a, b) => a.timestamp - b.timestamp);
    let totalDays = 0;

    for (let i = 1; i < sorted.length; i++) {
      const days = (sorted[i].timestamp - sorted[i - 1].timestamp) / (1000 * 60 * 60 * 24);
      totalDays += days;
    }

    return totalDays / (sorted.length - 1);
  }

  analyzeDecisionTime(interactions, orders) {
    // Calculer le temps moyen entre la première vue d'un produit et l'achat
    const times = [];

    orders.forEach(order => {
      order.items?.forEach(item => {
        const firstView = interactions.find(i =>
          i.type === 'view' &&
          i.productId === item.productId &&
          i.timestamp < order.timestamp
        );

        if (firstView) {
          const decisionTime = (order.timestamp - firstView.timestamp) / (1000 * 60 * 60); // heures
          times.push(decisionTime);
        }
      });
    });

    return times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : null;
  }

  detectTemporalPatterns(orders) {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);

    orders.forEach(order => {
      const date = order.timestamp;
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    return {
      peakHour,
      peakDay,
      peakDayName: dayNames[peakDay],
      isWeekendShopper: dayCounts[0] + dayCounts[6] > dayCounts.slice(1, 6).reduce((a, b) => a + b, 0),
      isNightShopper: hourCounts.slice(22, 24).concat(hourCounts.slice(0, 6)).reduce((a, b) => a + b, 0) > hourCounts.slice(6, 22).reduce((a, b) => a + b, 0)
    };
  }

  calculateConversionRate(interactions, orders) {
    const productViews = interactions.filter(i => i.type === 'view').length;
    if (productViews === 0) return 0;

    const purchases = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    return (purchases / productViews) * 100;
  }

  calculateRepeatPurchaseRate(orders) {
    if (orders.length === 0) return 0;

    const productPurchases = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        productPurchases[item.productId] = (productPurchases[item.productId] || 0) + 1;
      });
    });

    const repeatPurchases = Object.values(productPurchases).filter(count => count > 1).length;
    const totalProducts = Object.keys(productPurchases).length;

    return totalProducts > 0 ? (repeatPurchases / totalProducts) * 100 : 0;
  }

  getPreferredShoppingTime(orders, interactions) {
    const allEvents = [...orders, ...interactions];
    const hours = allEvents.map(e => this.safeToDate(e.timestamp || e.createdAt).getHours());

    if (hours.length === 0) return null;

    const hourFreq = {};
    hours.forEach(h => hourFreq[h] = (hourFreq[h] || 0) + 1);

    const mostFrequentHour = Object.entries(hourFreq)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      hour: parseInt(mostFrequentHour),
      period: parseInt(mostFrequentHour) < 12 ? 'matin' :
              parseInt(mostFrequentHour) < 18 ? 'après-midi' : 'soir'
    };
  }

  calculateSpendingTrend(orders) {
    if (orders.length < 2) return 'stable';

    const sorted = [...orders].sort((a, b) => a.timestamp - b.timestamp);
    const mid = Math.floor(sorted.length / 2);

    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avgFirst = firstHalf.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / secondHalf.length;

    const change = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (change > 20) return 'increasing';
    if (change < -20) return 'decreasing';
    return 'stable';
  }

  categorizeSpender(totalSpent, orderCount) {
    if (totalSpent === 0) return 'new';
    if (totalSpent < 50000) return 'occasional';
    if (totalSpent < 200000) return 'regular';
    if (totalSpent < 500000) return 'loyal';
    return 'vip';
  }

  /**
   * Vide le cache
   */
  clearCache() {
    this.profileCache = null;
    this.lastUpdate = null;
  }
}

export default new UserProfileService();