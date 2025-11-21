// services/IntelligentSearch.js - ✅ SERVICE RECHERCHE INTELLIGENTE
class IntelligentSearchService {
  /**
   * Recherche intelligente avec scoring
   */
  intelligentSearch(query, products) {
    if (!query || !products || products.length === 0) {
      return { results: [], metadata: {} };
    }

    const searchTerms = this.normalizeText(query).split(' ').filter(t => t.length > 0);
    console.log('🔍 Termes de recherche:', searchTerms);

    // Détection catégorie et filtres
    const detectedCategory = this.detectCategory(query);
    const detectedFilters = this.detectFilters(query);

    // Scorer chaque produit
    const scoredProducts = products.map(product => {
      const score = this.calculateRelevanceScore(product, searchTerms, detectedCategory, detectedFilters);
      return {
        ...product,
        relevanceScore: Math.round(score),
      };
    });

    // Filtrer et trier par score
    const results = scoredProducts
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    console.log('✅ Résultats trouvés:', results.length);

    return {
      results,
      metadata: {
        totalResults: results.length,
        detectedCategory,
        detectedFilters,
        searchTerms,
      },
    };
  }

  /**
   * Calculer score de pertinence
   */
  calculateRelevanceScore(product, searchTerms, detectedCategory, detectedFilters) {
    let score = 0;

    const productName = this.normalizeText(product.name || '');
    const productDesc = this.normalizeText(product.description || '');
    const productCategory = this.normalizeText(product.category || '');

    // Score par terme de recherche
    searchTerms.forEach(term => {
      // Nom exact
      if (productName === term) {
        score += 100;
      }
      // Nom contient
      else if (productName.includes(term)) {
        score += 50;
      }
      // Nom commence par
      else if (productName.startsWith(term)) {
        score += 75;
      }

      // Description contient
      if (productDesc.includes(term)) {
        score += 20;
      }

      // Catégorie contient
      if (productCategory.includes(term)) {
        score += 30;
      }
    });

    // Bonus catégorie détectée
    if (detectedCategory && productCategory.includes(this.normalizeText(detectedCategory))) {
      score += 40;
    }

    // Bonus ville
    if (detectedFilters.city) {
      const productCity = this.normalizeText(product.city || '');
      if (productCity.includes(this.normalizeText(detectedFilters.city))) {
        score += 30;
      }
    }

    // Bonus disponibilité
    if (product.available !== false && product.stock > 0) {
      score += 10;
    }

    return score;
  }

  /**
   * Détecter catégorie dans la requête
   */
  detectCategory(query) {
    const categories = {
      'patisserie': ['gateau', 'patisserie', 'cake', 'dessert', 'boulangerie'],
      'mode': ['vetement', 'habit', 'robe', 'pantalon', 'chemise', 'chaussure', 'mode'],
      'electronique': ['telephone', 'ordinateur', 'laptop', 'tablette', 'casque', 'ecouteur'],
      'beaute': ['cosmetique', 'maquillage', 'parfum', 'creme', 'beaute', 'skincare'],
      'alimentation': ['nourriture', 'aliment', 'boisson', 'snack', 'repas'],
    };

    const normalizedQuery = this.normalizeText(query);

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => normalizedQuery.includes(keyword))) {
        return category;
      }
    }

    return null;
  }

  /**
   * Détecter filtres (ville, prix, etc.)
   */
  detectFilters(query) {
    const filters = {};

    const cities = ['yaounde', 'douala', 'bafoussam', 'bamenda', 'garoua', 'maroua', 'ngaoundere'];
    const normalizedQuery = this.normalizeText(query);

    // Détecter ville
    cities.forEach(city => {
      if (normalizedQuery.includes(city)) {
        filters.city = city.charAt(0).toUpperCase() + city.slice(1);
      }
    });

    // Détecter prix (pas cher, bon marché, etc.)
    if (normalizedQuery.includes('pas cher') || normalizedQuery.includes('bon marche')) {
      filters.priceRange = 'low';
    }

    return filters;
  }

  /**
   * Normaliser texte (minuscules, sans accents, trim)
   */
  normalizeText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^\w\s]/g, ''); // Enlever ponctuation
  }

  /**
   * Suggestions de recherche
   */
  getSearchSuggestions(query, recentSearches = [], popularSearches = []) {
    if (!query || query.length === 0) {
      return {
        recent: recentSearches.slice(0, 5),
        popular: popularSearches.slice(0, 5),
      };
    }

    const normalizedQuery = this.normalizeText(query);

    // Filtrer suggestions pertinentes
    const filteredRecent = recentSearches
      .filter(s => this.normalizeText(s).includes(normalizedQuery))
      .slice(0, 3);

    const filteredPopular = popularSearches
      .filter(s => this.normalizeText(s).includes(normalizedQuery))
      .slice(0, 3);

    return {
      recent: filteredRecent,
      popular: filteredPopular,
    };
  }
}

export default new IntelligentSearchService();