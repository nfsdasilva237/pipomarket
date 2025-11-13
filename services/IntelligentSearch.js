// services/IntelligentSearch.js - Recherche intelligente avec IA
class IntelligentSearchService {
  /**
   * Dictionnaire des synonymes et variantes camerounaises
   */
  static synonyms = {
    // Nourriture
    'ndole': ['ndolé', 'ndol', 'feuille'],
    'soya': ['brochette', 'viande grillée', 'grillé'],
    'puff': ['pof pof', 'pof-pof', 'beignet'],
    'taro': ['macabo', 'coco'],
    'couscous': ['couscouss', 'sekle'],
    'eru': ['okok'],
    'koki': ['koki corn', 'corn chaff'],
    
    // Boissons
    'jus': ['juice', 'boisson', 'bissap'],
    'soda': ['gazeux', 'coca'],
    'vin': ['wine', 'champagne'],
    
    // Vêtements
    'pantalon': ['jean', 'bas', 'chino'],
    'chemise': ['shirt', 'polo'],
    'robe': ['dress', 'tenue'],
    'chaussure': ['soulier', 'basket', 'escarpin', 'sandale'],
    
    // Tech
    'telephone': ['téléphone', 'phone', 'smartphone', 'mobile'],
    'ordinateur': ['laptop', 'pc', 'computer'],
    'tablette': ['tablet', 'ipad'],
    
    // Beauté
    'creme': ['crème', 'lotion', 'pommade'],
    'parfum': ['fragrance', 'senteur'],
    'maquillage': ['makeup', 'cosmétique'],
    
    // Général
    'pas cher': ['abordable', 'moins cher', 'bon prix', 'économique'],
    'qualite': ['qualité', 'bon', 'meilleur', 'top'],
    'nouveau': ['neuf', 'new', 'récent'],
    'occasion': ['second hand', 'used', 'déjà utilisé'],
  };

  /**
   * Corrections orthographiques communes
   */
  static corrections = {
    'telfone': 'telephone',
    'ordi': 'ordinateur',
    'vetement': 'vêtement',
    'gatau': 'gateau',
    'gato': 'gateau',
    'soulié': 'soulier',
    'chausure': 'chaussure',
    'ordinateu': 'ordinateur',
    'telphone': 'telephone',
    'tablète': 'tablette',
  };

  /**
   * Mots-clés par catégorie
   */
  static categoryKeywords = {
    'Pâtisserie': ['gateau', 'cake', 'tarte', 'croissant', 'pain', 'boulangerie', 'patisserie'],
    'Beauté': ['creme', 'parfum', 'makeup', 'soin', 'beaute', 'cosmétique', 'lotion'],
    'Technologie': ['phone', 'ordinateur', 'laptop', 'tablette', 'tech', 'électronique'],
    'Mode': ['vetement', 'robe', 'pantalon', 'chemise', 'chaussure', 'mode', 'fashion'],
    'Sport': ['sport', 'fitness', 'basket', 'ballon', 'équipement'],
    'Alimentation': ['nourriture', 'food', 'manger', 'repas', 'cuisine'],
    'Boissons': ['jus', 'soda', 'boisson', 'drink', 'vin', 'alcool'],
  };

  /**
   * Normaliser et nettoyer la requête
   */
  static normalizeQuery(query) {
    let normalized = query.toLowerCase().trim();
    
    // Supprimer accents
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Supprimer caractères spéciaux sauf espaces
    normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
    
    // Supprimer espaces multiples
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized;
  }

  /**
   * Appliquer corrections orthographiques
   */
  static applyCorrections(query) {
    let corrected = query;
    
    for (const [wrong, correct] of Object.entries(this.corrections)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, correct);
    }
    
    return corrected;
  }

  /**
   * Développer les synonymes
   */
  static expandSynonyms(query) {
    const words = query.split(' ');
    const expanded = new Set(words);
    
    words.forEach(word => {
      for (const [key, synonymList] of Object.entries(this.synonyms)) {
        if (word === key || synonymList.includes(word)) {
          expanded.add(key);
          synonymList.forEach(syn => expanded.add(syn));
        }
      }
    });
    
    return Array.from(expanded);
  }

  /**
   * Détecter la catégorie depuis la requête
   */
  static detectCategory(query) {
    const normalized = this.normalizeQuery(query);
    const words = normalized.split(' ');
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      keywords.forEach(keyword => {
        if (words.includes(keyword) || normalized.includes(keyword)) {
          score++;
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
      }
    }
    
    return bestMatch;
  }

  /**
   * Détecter les filtres depuis la requête
   */
  static detectFilters(query) {
    const filters = {
      priceRange: null,
      city: null,
      condition: null,
      sort: null,
    };
    
    const normalized = this.normalizeQuery(query);
    
    // Prix
    if (normalized.includes('pas cher') || normalized.includes('moins cher')) {
      filters.sort = 'price_asc';
    }
    if (normalized.includes('cher') && !normalized.includes('pas cher')) {
      filters.sort = 'price_desc';
    }
    
    // Villes
    const cities = ['yaounde', 'yaoundé', 'yde', 'douala', 'dla', 'bafoussam', 'bamenda'];
    cities.forEach(city => {
      if (normalized.includes(city)) {
        filters.city = city === 'yde' ? 'Yaoundé' : 
                       city === 'dla' ? 'Douala' : 
                       city.charAt(0).toUpperCase() + city.slice(1);
      }
    });
    
    // État
    if (normalized.includes('neuf') || normalized.includes('nouveau')) {
      filters.condition = 'new';
    }
    if (normalized.includes('occasion') || normalized.includes('used')) {
      filters.condition = 'used';
    }
    
    // Popularité
    if (normalized.includes('populaire') || normalized.includes('tendance')) {
      filters.sort = 'popular';
    }
    
    // Meilleur note
    if (normalized.includes('meilleur') || normalized.includes('top')) {
      filters.sort = 'rating';
    }
    
    return filters;
  }

  /**
   * Calculer le score de pertinence
   */
  static calculateRelevanceScore(product, searchTerms, filters) {
    let score = 0;
    
    const productText = `
      ${product.name} 
      ${product.description} 
      ${product.category} 
      ${product.tags?.join(' ')}
    `.toLowerCase();
    
    // Correspondance des termes de recherche
    searchTerms.forEach(term => {
      if (productText.includes(term)) {
        score += 10;
        
        // Bonus si dans le nom
        if (product.name?.toLowerCase().includes(term)) {
          score += 20;
        }
      }
    });
    
    // Bonus pour les filtres correspondants
    if (filters.city && product.city === filters.city) {
      score += 15;
    }
    
    if (filters.condition && product.condition === filters.condition) {
      score += 10;
    }
    
    // Bonus pour les produits populaires
    if (product.sales > 50) score += 5;
    if (product.rating >= 4.5) score += 5;
    if (product.views > 100) score += 3;
    
    return score;
  }

  /**
   * Recherche intelligente principale
   */
  static async intelligentSearch(query, products) {
    // 1. Normaliser la requête
    let normalized = this.normalizeQuery(query);
    
    // 2. Appliquer corrections
    normalized = this.applyCorrections(normalized);
    
    // 3. Développer synonymes
    const searchTerms = this.expandSynonyms(normalized);
    
    // 4. Détecter catégorie et filtres
    const category = this.detectCategory(normalized);
    const filters = this.detectFilters(normalized);
    
    // 5. Filtrer les produits
    let results = products;
    
    // Filtrer par catégorie si détectée
    if (category) {
      results = results.filter(p => p.category === category);
    }
    
    // Filtrer par ville si détectée
    if (filters.city) {
      results = results.filter(p => p.city === filters.city);
    }
    
    // Filtrer par état si détecté
    if (filters.condition) {
      results = results.filter(p => p.condition === filters.condition);
    }
    
    // 6. Calculer scores de pertinence
    results = results.map(product => ({
      ...product,
      relevanceScore: this.calculateRelevanceScore(product, searchTerms, filters),
    }));
    
    // 7. Filtrer produits non pertinents
    results = results.filter(p => p.relevanceScore > 0);
    
    // 8. Trier selon le filtre ou par pertinence
    switch (filters.sort) {
      case 'price_asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        results.sort((a, b) => b.sales - a.sales);
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      default:
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    return {
      results,
      metadata: {
        originalQuery: query,
        normalizedQuery: normalized,
        detectedCategory: category,
        detectedFilters: filters,
        totalResults: results.length,
      },
    };
  }

  /**
   * Suggestions de recherche (auto-complete)
   */
  static getSearchSuggestions(query, recentSearches = [], popularSearches = []) {
    const normalized = this.normalizeQuery(query);
    
    if (!normalized) {
      return {
        recent: recentSearches.slice(0, 3),
        popular: popularSearches.slice(0, 5),
      };
    }
    
    // Filtrer recherches récentes
    const matchingRecent = recentSearches
      .filter(s => this.normalizeQuery(s).includes(normalized))
      .slice(0, 3);
    
    // Filtrer recherches populaires
    const matchingPopular = popularSearches
      .filter(s => this.normalizeQuery(s).includes(normalized))
      .slice(0, 5);
    
    // Suggestions basées sur catégories
    const categorySuggestions = [];
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(k => k.includes(normalized))) {
        categorySuggestions.push(`Voir tous les produits ${category}`);
      }
    }
    
    return {
      recent: matchingRecent,
      popular: matchingPopular,
      category: categorySuggestions.slice(0, 3),
    };
  }
}

export default IntelligentSearchService;
