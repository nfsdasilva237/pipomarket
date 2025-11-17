// services/AIAssistantService.js - SERVICE D'ASSISTANT IA COMPLET
import ConversationContextService from './ConversationContextService';
import AdvancedRecommendationEngine from './AdvancedRecommendationEngine';
import UserProfileService from './UserProfileService';

class AIAssistantService {
  /**
   * Traite un message utilisateur et génère une réponse intelligente
   */
  async processMessage(userMessage, products, startups, categories, bdlServices) {
    // Analyser le sentiment
    const sentiment = ConversationContextService.analyzeSentiment(userMessage);

    // Vérifier si c'est une suite de conversation
    const isFollowUp = ConversationContextService.isFollowUp(userMessage);

    // Extraire les entités
    const entities = ConversationContextService.extractEntities(
      userMessage,
      products,
      categories,
      startups
    );

    // Résoudre les références si c'est un suivi
    const resolvedEntities = isFollowUp
      ? ConversationContextService.resolveReferences(userMessage)
      : entities;

    // Détecter l'intention
    const intent = this.detectAdvancedIntent(userMessage, entities, sentiment);

    // Mettre à jour le contexte
    ConversationContextService.updateIntent(intent);

    // Générer la réponse
    const response = await this.generateIntelligentResponse(
      userMessage,
      intent,
      { ...entities, ...resolvedEntities },
      sentiment,
      products,
      startups,
      categories,
      bdlServices
    );

    // Ajouter le message à l'historique
    await ConversationContextService.addMessage(userMessage, false);
    await ConversationContextService.addMessage(response.text, true);

    // Sauvegarder le contexte
    await ConversationContextService.saveContext();

    return response;
  }

  /**
   * Détection d'intention avancée avec analyse sémantique
   */
  detectAdvancedIntent(message, entities, sentiment) {
    const normalized = message.toLowerCase();

    // Intentions avec contexte négatif
    if (sentiment === 'negative') {
      if (/cher|couteux|prix.*eleve/i.test(message)) {
        return 'PRICE_CONCERN';
      }
      if (/probleme|erreur|bug|marche.*pas/i.test(message)) {
        return 'ISSUE_REPORT';
      }
    }

    // Intentions transactionnelles (haute priorité)
    if (/acheter|commander|prendre|passer.*commande|veux.*ca/i.test(message)) {
      return 'PURCHASE_INTENT';
    }

    if (/annuler|supprimer|retour|rembours/i.test(message)) {
      return 'CANCEL_ORDER';
    }

    // Intentions informationnelles
    if (/stock|disponible|dispo|reste/i.test(message)) {
      return 'STOCK_CHECK';
    }

    if (/livraison|livrer|recevoir|expedition|delai/i.test(message)) {
      return 'DELIVERY_INFO';
    }

    if (/garantie|retour|echange|sav/i.test(message)) {
      return 'WARRANTY_INFO';
    }

    // BDL Services
    if (/bdl|studio|design|graphique|montage|video|drone|shooting|community|web|dev/i.test(message)) {
      return 'BDL_SERVICES';
    }

    // Commandes utilisateur
    if (/ma.*commande|mes.*commandes|suivi|tracking|status/i.test(message)) {
      return 'USER_ORDERS';
    }

    // Recommandations personnalisées
    if (/recommand|suggere|conseil|propose|quoi.*acheter|que.*prendre|idee/i.test(message)) {
      return 'PERSONALIZED_RECOMMENDATIONS';
    }

    // Comparaison
    if (/compar|difference|mieux|versus|vs|plutot|choisir.*entre/i.test(message)) {
      return 'COMPARE_PRODUCTS';
    }

    // Promotions
    if (/promo|solde|reduction|offre|discount|code.*promo|bon.*plan/i.test(message)) {
      return 'PROMOTIONS';
    }

    // Startups
    if (/startup|entreprise|vendeur|boutique|magasin|seller/i.test(message)) {
      return 'STARTUPS';
    }

    // Catégories
    if (/categorie|type|genre|section|rayon/i.test(message)) {
      return 'CATEGORIES';
    }

    // Prix
    if (/prix|cout|combien|tarif|montant|budget/i.test(message)) {
      return 'PRICE_INQUIRY';
    }

    // Localisation
    if (/yaounde|douala|bafoussam|bamenda|ville|quartier/i.test(message)) {
      return 'LOCATION_SEARCH';
    }

    // Tendances
    if (/populaire|tendance|top|best|meilleures?.*vente|hit|viral/i.test(message)) {
      return 'TRENDING';
    }

    // Nouveautés
    if (/nouveau|recent|dernier|nouveaute|latest|just.*arrive/i.test(message)) {
      return 'NEW_ARRIVALS';
    }

    // Aide
    if (/aide|comment|marche|utiliser|fonctionne|help|guide/i.test(message)) {
      return 'HELP';
    }

    // Stats
    if (/combien|nombre|statistique|total|resume/i.test(message)) {
      return 'STATS';
    }

    // Salutations
    if (/^(salut|bonjour|hello|hi|weh|yo|hey|coucou|bonsoir)/i.test(message)) {
      return 'GREETING';
    }

    // Remerciements
    if (/merci|thanks|cool|super|genial|parfait/i.test(message)) {
      return 'THANKS';
    }

    // Au revoir
    if (/bye|au revoir|a plus|tchao|ciao/i.test(message)) {
      return 'GOODBYE';
    }

    // Par défaut: recherche produit
    return 'SEARCH_PRODUCT';
  }

  /**
   * Génère une réponse intelligente basée sur l'intention et le contexte
   */
  async generateIntelligentResponse(
    userMessage,
    intent,
    entities,
    sentiment,
    products,
    startups,
    categories,
    bdlServices
  ) {
    let response = '';
    let actions = [];
    let suggestions = [];

    // Obtenir le profil utilisateur
    const userProfile = await UserProfileService.getUserProfile();
    const userName = userProfile?.displayName?.split(' ')[0] || '';

    switch (intent) {
      case 'PERSONALIZED_RECOMMENDATIONS': {
        if (!userProfile) {
          response = `Pour des recommandations personnalisées, connecte-toi d'abord !\n\n` +
                     `En attendant, voici nos produits les plus populaires :`;

          const popular = AdvancedRecommendationEngine.getPopularProducts(products, 5);
          response += this.formatProductList(popular);

          actions = [{ label: 'Se connecter', action: 'LOGIN' }];
        } else {
          response = `${userName ? `${userName}, ` : ''}Voici mes recommandations PERSONNALISÉES pour toi :\n\n`;

          const recommendations = await AdvancedRecommendationEngine.getPersonalizedRecommendations(
            userProfile.userId,
            products,
            8
          );

          recommendations.forEach((p, i) => {
            response += `${i + 1}. 📦 ${p.name}\n`;
            response += `   💰 ${p.price.toLocaleString()} XAF\n`;
            if (p.recommendationReason) {
              response += `   ✨ ${p.recommendationReason}\n`;
            }
            response += '\n';
          });

          response += `Ces recommandations sont basées sur :\n` +
                     `• Tes ${userProfile.orders.length} commande(s)\n` +
                     `• Tes préférences (${Object.keys(userProfile.preferences.categories || {}).length} catégories)\n` +
                     `• Ton budget moyen (~${Math.round(userProfile.spendingProfile.averageOrderValue).toLocaleString()} XAF)\n\n` +
                     `Score d'engagement: ${userProfile.engagementScore}/100 🎯`;
        }
        break;
      }

      case 'PURCHASE_INTENT': {
        if (entities.products && entities.products.length > 0) {
          const product = products.find(p => p.id === entities.products[0]);
          if (product) {
            response = `Parfait ! Tu veux acheter "${product.name}"\n\n` +
                       `💰 Prix: ${product.price.toLocaleString()} XAF\n` +
                       `🏢 Vendu par: ${product.startupName || 'Startup'}\n` +
                       `📦 Stock: ${product.stock || 'Disponible'}\n\n` +
                       `Je l'ajoute à ton panier ?`;

            actions = [
              { label: 'Ajouter au panier', action: 'ADD_TO_CART', data: product.id },
              { label: 'Voir détails', action: 'VIEW_PRODUCT', data: product.id }
            ];

            // Suggérer des produits similaires
            const similar = AdvancedRecommendationEngine.getSimilarProducts(product.id, products, 3);
            if (similar.length > 0) {
              suggestions = similar.map(p => ({
                type: 'product',
                data: p,
                label: p.name
              }));
            }
          }
        } else {
          response = `Super ! Tu veux acheter quoi exactement ?\n\n` +
                     `Dis-moi le nom du produit ou montre-moi une catégorie !`;

          actions = [
            { label: 'Voir tous les produits', action: 'BROWSE_PRODUCTS' },
            { label: 'Voir catégories', action: 'LIST_CATEGORIES' }
          ];
        }
        break;
      }

      case 'PRICE_CONCERN': {
        response = `Je comprends ${userName ? userName : 'que le prix soit important'} ! 💰\n\n`;

        if (entities.maxBudget) {
          const affordable = products
            .filter(p => p.price <= entities.maxBudget)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5);

          response += `Voici les MEILLEURS produits à moins de ${entities.maxBudget.toLocaleString()} XAF :\n\n`;
          response += this.formatProductList(affordable);
        } else {
          response += `Quel est ton budget maximum ? Je vais te trouver les meilleurs produits dans ta gamme de prix !\n\n`;
          response += `Tu peux aussi consulter nos promotions en cours 🎁`;

          actions = [
            { label: 'Voir promotions', action: 'VIEW_PROMOTIONS' },
            { label: 'Prix < 10,000 XAF', action: 'FILTER_PRICE', data: 10000 }
          ];
        }
        break;
      }

      case 'COMPARE_PRODUCTS': {
        if (entities.products && entities.products.length >= 2) {
          const product1 = products.find(p => p.id === entities.products[0]);
          const product2 = products.find(p => p.id === entities.products[1]);

          if (product1 && product2) {
            response = this.generateComparison(product1, product2);
          }
        } else {
          response = `Je peux comparer des produits pour toi !\n\n` +
                     `Dis-moi quels produits tu veux comparer.\n` +
                     `Par exemple: "Compare le produit A et le produit B"`;
        }
        break;
      }

      case 'STOCK_CHECK': {
        if (entities.products && entities.products.length > 0) {
          const product = products.find(p => p.id === entities.products[0]);
          if (product) {
            const stock = product.stock || 0;
            const inStock = stock > 0;

            response = `${product.name}\n\n`;
            if (inStock) {
              response += `✅ EN STOCK\n` +
                         `📦 ${stock} unité(s) disponible(s)\n\n` +
                         `Tu peux commander maintenant !`;
              actions = [{ label: 'Commander', action: 'ADD_TO_CART', data: product.id }];
            } else {
              response += `❌ RUPTURE DE STOCK\n\n` +
                         `Mais je peux te proposer des alternatives !`;

              const similar = AdvancedRecommendationEngine.getSimilarProducts(product.id, products, 3);
              if (similar.length > 0) {
                response += `\n\nProduits similaires disponibles:\n`;
                response += this.formatProductList(similar);
              }
            }
          }
        } else {
          response = `Pour quel produit veux-tu vérifier le stock ?`;
        }
        break;
      }

      case 'DELIVERY_INFO': {
        const city = entities.location || 'ta ville';
        response = `🚚 Informations livraison pour ${city} :\n\n`;

        if (entities.location) {
          const deliveryInfo = this.getDeliveryInfo(entities.location);
          response += deliveryInfo;
        } else {
          response += `📍 Yaoundé : 1-2 jours ⚡\n` +
                     `📍 Douala : 2-3 jours 🚗\n` +
                     `📍 Autres villes : 3-5 jours 🛣️\n\n` +
                     `✅ Suivi en temps réel\n` +
                     `💳 Paiement à la livraison disponible\n` +
                     `📞 Support client 24/7`;
        }

        if (entities.products && entities.products.length > 0) {
          const product = products.find(p => p.id === entities.products[0]);
          if (product) {
            response += `\n\nPour "${product.name}" : ${product.deliveryTime || '2-3 jours'}`;
          }
        }
        break;
      }

      case 'ISSUE_REPORT': {
        response = `Oh non ${userName ? userName : ''} ! Je suis désolé pour ce problème 😔\n\n` +
                   `Peux-tu me donner plus de détails ?\n\n` +
                   `Notre équipe support est là pour t'aider :\n` +
                   `📞 +237 6XX XXX XXX\n` +
                   `📧 support@pipomarket.com\n\n` +
                   `Je transmets ton problème immédiatement !`;

        actions = [
          { label: 'Contacter support', action: 'CONTACT_SUPPORT' },
          { label: 'Mes commandes', action: 'MY_ORDERS' }
        ];
        break;
      }

      default:
        // Utiliser la logique originale pour les autres intentions
        response = await this.fallbackResponse(
          intent,
          entities,
          products,
          startups,
          categories,
          bdlServices,
          userProfile
        );
    }

    // Vérifier si une clarification est nécessaire
    const clarification = ConversationContextService.generateClarificationQuestion();

    return {
      text: response,
      actions,
      suggestions,
      clarification,
      sentiment,
      intent,
      entities
    };
  }

  /**
   * Génère une comparaison détaillée entre deux produits
   */
  generateComparison(product1, product2) {
    let comparison = `📊 COMPARAISON\n\n`;

    comparison += `1️⃣ ${product1.name}\n`;
    comparison += `   💰 ${product1.price.toLocaleString()} XAF\n`;
    if (product1.rating) comparison += `   ⭐ ${product1.rating}/5\n`;
    if (product1.startupName) comparison += `   🏢 ${product1.startupName}\n`;
    comparison += '\n';

    comparison += `2️⃣ ${product2.name}\n`;
    comparison += `   💰 ${product2.price.toLocaleString()} XAF\n`;
    if (product2.rating) comparison += `   ⭐ ${product2.rating}/5\n`;
    if (product2.startupName) comparison += `   🏢 ${product2.startupName}\n`;
    comparison += '\n';

    comparison += `💡 MON ANALYSE :\n\n`;

    // Comparaison prix
    const priceDiff = Math.abs(product1.price - product2.price);
    const cheaper = product1.price < product2.price ? product1.name : product2.name;
    comparison += `• ${cheaper} est ${priceDiff.toLocaleString()} XAF moins cher\n`;

    // Comparaison rating
    if (product1.rating && product2.rating) {
      const betterRated = product1.rating > product2.rating ? product1.name : product2.name;
      comparison += `• ${betterRated} a une meilleure note\n`;
    }

    // Recommandation
    comparison += `\n🎯 MA RECOMMANDATION :\n`;

    const score1 = (product1.rating || 3) / (product1.price / 10000);
    const score2 = (product2.rating || 3) / (product2.price / 10000);

    const recommended = score1 > score2 ? product1 : product2;
    comparison += `Je te conseille "${recommended.name}" pour le meilleur rapport qualité/prix !`;

    return comparison;
  }

  /**
   * Obtient les infos de livraison pour une ville
   */
  getDeliveryInfo(city) {
    const cityNormalized = city.toLowerCase();

    const deliveryTimes = {
      'yaounde': '1-2 jours ⚡',
      'yaoundé': '1-2 jours ⚡',
      'douala': '2-3 jours 🚗',
      'bafoussam': '3-4 jours 🛣️',
      'bamenda': '3-5 jours 🛣️'
    };

    const time = deliveryTimes[cityNormalized] || '3-5 jours 🛣️';

    return `📍 Livraison à ${city} : ${time}\n\n` +
           `✅ Suivi en temps réel activé\n` +
           `💳 Paiement à la livraison disponible\n` +
           `📦 Emballage sécurisé\n` +
           `📞 Support disponible pendant la livraison`;
  }

  /**
   * Formate une liste de produits
   */
  formatProductList(products) {
    let formatted = '\n';

    products.slice(0, 5).forEach((p, i) => {
      formatted += `${i + 1}. 📦 ${p.name}\n`;
      formatted += `   💰 ${p.price.toLocaleString()} XAF\n`;
      if (p.rating) formatted += `   ⭐ ${p.rating}/5\n`;
      if (p.startupName) formatted += `   🏢 ${p.startupName}\n`;
      formatted += '\n';
    });

    if (products.length > 5) {
      formatted += `... et ${products.length - 5} autres produits !`;
    }

    return formatted;
  }

  /**
   * Réponse de secours (fallback)
   */
  async fallbackResponse(intent, entities, products, startups, categories, bdlServices, userProfile) {
    // Utiliser le contexte pour générer une réponse appropriée
    const contextSummary = ConversationContextService.getContextSummary();

    let response = `🤔 Hmm, je ne suis pas sûr d'avoir bien compris...\n\n`;

    if (contextSummary.productsDiscussed > 0) {
      response += `On parlait des produits que tu as consultés.\n`;
    }

    response += `Essaye de reformuler ou demande-moi :\n\n` +
               `• "Recommande-moi quelque chose" 🎯\n` +
               `• "Produits à moins de 50,000 XAF" 💰\n` +
               `• "Nouveautés" 🆕\n` +
               `• "Services BDL Studio" 🎨\n` +
               `• "Mes commandes" 📦`;

    return response;
  }
}

export default new AIAssistantService();
