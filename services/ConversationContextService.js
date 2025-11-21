// services/ConversationContextService.js - GESTIONNAIRE DE CONTEXTE CONVERSATIONNEL
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

class ConversationContextService {
  constructor() {
    this.context = {
      conversationId: null,
      messages: [],
      currentTopic: null,
      entities: {}, // Entités extraites (produits, catégories, prix, etc.)
      userIntent: null,
      lastIntent: null,
      sessionStarted: null,
      followUpContext: null, // Pour les questions de suivi
      disambiguationNeeded: false,
      waitingForUserInput: null
    };
  }

  /**
   * Initialise une nouvelle conversation
   */
  async initConversation() {
    const userId = auth.currentUser?.uid || 'guest';
    this.context = {
      conversationId: `${userId}_${Date.now()}`,
      messages: [],
      currentTopic: null,
      entities: {},
      userIntent: null,
      lastIntent: null,
      sessionStarted: new Date(),
      followUpContext: null,
      disambiguationNeeded: false,
      waitingForUserInput: null,
      userMood: 'neutral',
      questionsAsked: 0,
      productsDiscussed: [],
      servicesDiscussed: []
    };

    await this.saveContext();
  }

  /**
   * Ajoute un message à l'historique
   */
  async addMessage(message, isBot = false) {
    this.context.messages.push({
      text: message,
      isBot,
      timestamp: new Date(),
      intent: isBot ? null : this.context.userIntent,
      entities: { ...this.context.entities }
    });

    // Garder seulement les 50 derniers messages
    if (this.context.messages.length > 50) {
      this.context.messages = this.context.messages.slice(-50);
    }

    await this.saveContext();
  }

  /**
   * Met à jour le contexte avec les nouvelles entités extraites
   */
  updateEntities(newEntities) {
    this.context.entities = {
      ...this.context.entities,
      ...newEntities,
      lastUpdated: new Date()
    };
  }

  /**
   * Extrait les entités d'un message utilisateur
   */
  extractEntities(message, products = [], categories = [], startups = []) {
    const entities = {};
    const normalized = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Extraire les prix mentionnés
    const priceMatches = message.match(/(\d+(?:[.,]\d+)?)\s*(?:xaf|fcfa|f|francs?)/gi);
    if (priceMatches) {
      entities.priceRange = priceMatches.map(m => {
        const num = parseFloat(m.replace(/[^\d.,]/g, '').replace(',', '.'));
        return num;
      });
      entities.maxBudget = Math.max(...entities.priceRange);
      entities.minBudget = Math.min(...entities.priceRange);
    }

    // Extraire les quantités
    const quantityMatches = message.match(/(\d+)\s*(?:unites?|pieces?|exemplaires?|produits?)/gi);
    if (quantityMatches) {
      entities.quantity = parseInt(quantityMatches[0].match(/\d+/)[0]);
    }

    // Extraire les couleurs
    const colors = ['rouge', 'bleu', 'vert', 'jaune', 'noir', 'blanc', 'orange', 'rose', 'violet', 'gris', 'marron'];
    colors.forEach(color => {
      if (normalized.includes(color)) {
        entities.colors = entities.colors || [];
        entities.colors.push(color);
      }
    });

    // Extraire les tailles
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'petit', 'moyen', 'grand'];
    sizes.forEach(size => {
      if (normalized.includes(size)) {
        entities.sizes = entities.sizes || [];
        entities.sizes.push(size);
      }
    });

    // Extraire les villes
    const cities = ['yaounde', 'yaoundé', 'douala', 'bafoussam', 'bamenda'];
    cities.forEach(city => {
      if (normalized.includes(city)) {
        entities.location = city;
      }
    });

    // Détecter les produits mentionnés
    products.forEach(product => {
      const productName = product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(productName) || this.fuzzyMatch(productName, normalized) > 0.8) {
        entities.products = entities.products || [];
        entities.products.push(product.id);
        this.context.productsDiscussed.push(product.id);
      }
    });

    // Détecter les catégories mentionnées
    categories.forEach(category => {
      const catName = (category.name || category.id).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(catName)) {
        entities.category = category.id;
      }
    });

    // Détecter les startups mentionnées
    startups.forEach(startup => {
      const startupName = startup.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(startupName) || this.fuzzyMatch(startupName, normalized) > 0.8) {
        entities.startup = startup.id;
      }
    });

    // Détecter les préférences de tri
    if (/moins.*cher|bon.*marche|economique|abordable|pas.*cher/i.test(message)) {
      entities.sortBy = 'price_asc';
    } else if (/cher|haut.*gamme|premium|luxe|qualite/i.test(message)) {
      entities.sortBy = 'price_desc';
    } else if (/populaire|tendance|best|top|meilleures?.*vente/i.test(message)) {
      entities.sortBy = 'popularity';
    } else if (/nouveau|recent|dernier/i.test(message)) {
      entities.sortBy = 'newest';
    } else if (/note|avis|etoiles?|rating/i.test(message)) {
      entities.sortBy = 'rating';
    }

    // Détecter les comparaisons
    if (/compar|difference.*entre|mieux.*que|versus|vs|plutot/i.test(message)) {
      entities.isComparison = true;
    }

    // Détecter l'urgence
    if (/urgent|rapide|vite|maintenant|aujourd.?hui|immediatement/i.test(message)) {
      entities.urgency = 'high';
    }

    this.updateEntities(entities);
    return entities;
  }

  /**
   * Détermine si le message actuel est une suite de la conversation
   */
  isFollowUp(message) {
    if (this.context.messages.length < 2) return false;

    const followUpIndicators = [
      /^(et|aussi|en plus|puis|ensuite|apres|alors)/i,
      /^(oui|non|ok|d.?accord|bien|super|cool)/i,
      /^(ca|cela|celui|celle|ceux|celles|le|la|les)/i,
      /^(combien|quel|quelle|quels|quelles|comment|pourquoi)/i,
      /^(montre|affiche|donne|dis|trouve)/i,
      /autre|different|similaire|comme|pareil/i
    ];

    return followUpIndicators.some(pattern => pattern.test(message.trim()));
  }

  /**
   * Résout les références dans le contexte (anaphores)
   */
  resolveReferences(message) {
    const resolved = { ...this.context.entities };

    // Résoudre "celui-ci", "ça", "le", etc.
    const references = [
      /celui[- ]ci|celle[- ]ci|ceux[- ]ci/i,
      /\b(ca|cela)\b/i,
      /\bl[ea]\b/i
    ];

    const hasReference = references.some(pattern => pattern.test(message));

    if (hasReference && this.context.followUpContext) {
      // Hériter du contexte précédent
      if (this.context.followUpContext.lastProduct) {
        resolved.products = [this.context.followUpContext.lastProduct];
      }
      if (this.context.followUpContext.lastCategory) {
        resolved.category = this.context.followUpContext.lastCategory;
      }
      if (this.context.followUpContext.lastStartup) {
        resolved.startup = this.context.followUpContext.lastStartup;
      }
    }

    return resolved;
  }

  /**
   * Met à jour le contexte de suivi
   */
  updateFollowUpContext(data) {
    this.context.followUpContext = {
      ...this.context.followUpContext,
      ...data,
      timestamp: new Date()
    };
  }

  /**
   * Détecte le changement de sujet
   */
  detectTopicChange(currentIntent) {
    if (!this.context.lastIntent) return false;

    const majorTopics = {
      product: ['SEARCH_PRODUCT', 'PRIX', 'COMPARE', 'TRENDING', 'NEW_ARRIVALS'],
      service: ['BDL_SERVICES'],
      order: ['USER_ORDERS'],
      startup: ['STARTUPS'],
      help: ['HELP', 'DELIVERY', 'PAYMENT']
    };

    let lastTopic = null;
    let currentTopic = null;

    for (const [topic, intents] of Object.entries(majorTopics)) {
      if (intents.includes(this.context.lastIntent)) lastTopic = topic;
      if (intents.includes(currentIntent)) currentTopic = topic;
    }

    return lastTopic !== currentTopic;
  }

  /**
   * Met à jour l'intention
   */
  updateIntent(newIntent) {
    this.context.lastIntent = this.context.userIntent;
    this.context.userIntent = newIntent;
    this.context.questionsAsked++;

    // Détecter le changement de sujet
    if (this.detectTopicChange(newIntent)) {
      this.context.currentTopic = newIntent;
      // Réinitialiser partiellement le contexte
      this.context.disambiguationNeeded = false;
    }
  }

  /**
   * Analyse le sentiment du message
   */
  analyzeSentiment(message) {
    const normalized = message.toLowerCase();

    // Sentiment positif
    const positiveWords = [
      'bien', 'super', 'genial', 'excellent', 'parfait', 'cool', 'top', 'merci',
      'bon', 'agree?able', 'satisfait', 'content', 'heureux', 'j.?aime', 'adore'
    ];

    // Sentiment négatif
    const negativeWords = [
      'pas', 'non', 'jamais', 'aucun', 'mauvais', 'nul', 'probleme', 'erreur',
      'bug', 'lent', 'cher', 'complique', 'difficile', 'frustre', 'decu'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (new RegExp(`\\b${word}\\b`, 'i').test(normalized)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (new RegExp(`\\b${word}\\b`, 'i').test(normalized)) negativeCount++;
    });

    if (positiveCount > negativeCount) {
      this.context.userMood = 'positive';
      return 'positive';
    } else if (negativeCount > positiveCount) {
      this.context.userMood = 'negative';
      return 'negative';
    } else {
      this.context.userMood = 'neutral';
      return 'neutral';
    }
  }

  /**
   * Génère des questions de clarification si nécessaire
   */
  generateClarificationQuestion() {
    const entities = this.context.entities;

    // Plusieurs produits trouvés sans précision
    if (entities.products && entities.products.length > 3 && !entities.sortBy) {
      return {
        question: "J'ai trouvé plusieurs produits. Tu préfères voir les moins chers, les plus populaires, ou les nouveautés ?",
        options: ['Prix bas', 'Populaires', 'Nouveautés']
      };
    }

    // Budget non précisé pour une recherche
    if (this.context.userIntent === 'SEARCH_PRODUCT' && !entities.maxBudget) {
      return {
        question: "Quel est ton budget approximatif ?",
        options: ['Moins de 10,000 XAF', '10,000 - 50,000 XAF', 'Plus de 50,000 XAF']
      };
    }

    // Catégorie ambiguë
    if (this.context.disambiguationNeeded && entities.possibleCategories) {
      return {
        question: "Tu cherches dans quelle catégorie exactement ?",
        options: entities.possibleCategories
      };
    }

    return null;
  }

  /**
   * Obtient un résumé du contexte actuel
   */
  getContextSummary() {
    const summary = {
      conversationLength: this.context.messages.length,
      currentTopic: this.context.currentTopic,
      userMood: this.context.userMood,
      questionsAsked: this.context.questionsAsked,
      productsDiscussed: [...new Set(this.context.productsDiscussed)].length,
      servicesDiscussed: [...new Set(this.context.servicesDiscussed)].length,
      hasEntities: Object.keys(this.context.entities).length > 0,
      entities: this.context.entities,
      sessionDuration: this.context.sessionStarted
        ? Math.round((new Date() - this.context.sessionStarted) / 1000 / 60) // minutes
        : 0
    };

    return summary;
  }

  /**
   * Sauvegarde le contexte
   */
  async saveContext() {
    try {
      const userId = auth.currentUser?.uid || 'guest';
      await AsyncStorage.setItem(
        `conversation_context_${userId}`,
        JSON.stringify(this.context)
      );
    } catch (error) {
      console.error('Erreur sauvegarde contexte:', error);
    }
  }

  /**
   * Charge le contexte sauvegardé
   */
  async loadContext() {
    try {
      const userId = auth.currentUser?.uid || 'guest';
      const saved = await AsyncStorage.getItem(`conversation_context_${userId}`);

      if (saved) {
        this.context = JSON.parse(saved);
        // Convertir les dates
        this.context.sessionStarted = new Date(this.context.sessionStarted);
        return true;
      }
    } catch (error) {
      console.error('Erreur chargement contexte:', error);
    }

    return false;
  }

  /**
   * Réinitialise le contexte
   */
  async resetContext() {
    await this.initConversation();
  }

  /**
   * Recherche floue
   */
  fuzzyMatch(search, target) {
    const s = search.toLowerCase();
    const t = target.toLowerCase();

    if (t.includes(s)) return 1;
    if (s.includes(t)) return 0.9;

    let matches = 0;
    for (let char of s) {
      if (t.includes(char)) matches++;
    }
    return matches / s.length;
  }

  /**
   * Obtient les recommandations basées sur le contexte
   */
  getContextualRecommendations() {
    const recommendations = [];

    // Basé sur les produits discutés
    if (this.context.productsDiscussed.length > 0) {
      recommendations.push({
        type: 'similar_products',
        reason: 'Basé sur les produits que tu as regardés'
      });
    }

    // Basé sur le budget
    if (this.context.entities.maxBudget) {
      recommendations.push({
        type: 'within_budget',
        budget: this.context.entities.maxBudget,
        reason: `Produits à moins de ${this.context.entities.maxBudget.toLocaleString()} XAF`
      });
    }

    // Basé sur la catégorie
    if (this.context.entities.category) {
      recommendations.push({
        type: 'same_category',
        category: this.context.entities.category,
        reason: 'Autres produits dans cette catégorie'
      });
    }

    // Basé sur l'humeur
    if (this.context.userMood === 'negative') {
      recommendations.push({
        type: 'customer_support',
        reason: 'Besoin d\'aide ?'
      });
    }

    return recommendations;
  }
}

export default new ConversationContextService();