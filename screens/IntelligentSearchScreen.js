// screens/IntelligentSearchScreen.js - Écran de recherche intelligente
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import IntelligentSearchService from '../services/IntelligentSearch';

export default function IntelligentSearchScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Historique et tendances (à charger depuis AsyncStorage)
  const [recentSearches] = useState([
    'Gâteaux yaoundé',
    'Téléphone pas cher',
    'Chaussures sport',
  ]);

  const [popularSearches] = useState([
    'Pâtisserie',
    'Téléphone',
    'Mode femme',
    'Beauté',
    'Ordinateur portable',
  ]);

  // Charger tous les produits au montage
  useEffect(() => {
    loadAllProducts();
  }, []);

  const loadAllProducts = async () => {
    try {
      setLoadingProducts(true);
      const productsQuery = query(collection(db, 'products'));
      const querySnapshot = await getDocs(productsQuery);

      const products = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.name && data.available !== false) {
          products.push({
            id: doc.id,
            ...data,
          });
        }
      });

      console.log('📦 Produits chargés pour recherche:', products.length);
      setAllProducts(products);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (allProducts.length === 0) {
      console.warn('Aucun produit disponible pour la recherche');
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      console.log('🔍 Recherche:', searchQuery, 'sur', allProducts.length, 'produits');

      const { results, metadata } = await IntelligentSearchService.intelligentSearch(
        searchQuery,
        allProducts
      );

      console.log('✅ Résultats:', results.length);

      setSearchResults(results);
      setSearchMetadata(metadata);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Déclencher la recherche automatiquement
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const suggestions = IntelligentSearchService.getSearchSuggestions(
    searchQuery,
    recentSearches,
    popularSearches
  );

  const renderProduct = ({ item }) => {
    const isImageUrl = item.image && typeof item.image === 'string' && (
      item.image.startsWith('http://') ||
      item.image.startsWith('https://') ||
      item.image.startsWith('file://')
    );

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', {
          productId: item.id,
          productName: item.name,
        })}
      >
        {/* IMAGE */}
        <View style={styles.productImageContainer}>
          {isImageUrl ? (
            <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>{item.image || '📦'}</Text>
            </View>
          )}

          {/* Score de pertinence */}
          {item.relevanceScore > 0 && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{item.relevanceScore}</Text>
            </View>
          )}
        </View>

        {/* INFO */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.startupName} numberOfLines={1}>
            {item.startupName || 'PipoMarket'}
          </Text>

          <View style={styles.productBottom}>
            <Text style={styles.productPrice}>
              {item.price?.toLocaleString('fr-FR')} FCFA
            </Text>

            {item.rating && (
              <View style={styles.rating}>
                <Text style={styles.ratingText}>⭐ {item.rating}</Text>
              </View>
            )}
          </View>

          {item.city && (
            <Text style={styles.cityText}>📍 {item.city}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loadingProducts) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des produits...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER RECHERCHE */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>

        <View style={styles.searchBarContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(true);
            }}
            placeholder="Cherchez un produit, startup..."
            placeholderTextColor="#8E8E93"
            autoFocus
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSuggestions(true);
              }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SUGGESTIONS */}
      {showSuggestions && searchQuery.length === 0 && (
        <ScrollView style={styles.suggestionsContainer}>
          {/* RECHERCHES RÉCENTES */}
          {suggestions.recent.length > 0 && (
            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionTitle}>🕐 Recherches récentes</Text>
              {suggestions.recent.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Text style={styles.suggestionIcon}>🔍</Text>
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* TENDANCES */}
          {suggestions.popular.length > 0 && (
            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionTitle}>🔥 Tendances</Text>
              {suggestions.popular.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Text style={styles.suggestionIcon}>📈</Text>
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* SUGGESTIONS AUTO-COMPLETE */}
      {showSuggestions && searchQuery.length > 0 && (
        <ScrollView style={styles.suggestionsContainer}>
          {suggestions.recent.length > 0 && (
            <View style={styles.suggestionSection}>
              {suggestions.recent.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Text style={styles.suggestionIcon}>🔍</Text>
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* MÉTADONNÉES RECHERCHE */}
      {searchMetadata && !showSuggestions && (
        <View style={styles.metadataContainer}>
          <Text style={styles.resultsCount}>
            {searchMetadata.totalResults} résultat{searchMetadata.totalResults > 1 ? 's' : ''}
          </Text>

          {searchMetadata.detectedCategory && (
            <View style={styles.detectedBadge}>
              <Text style={styles.detectedText}>
                📂 {searchMetadata.detectedCategory}
              </Text>
            </View>
          )}

          {searchMetadata.detectedFilters.city && (
            <View style={styles.detectedBadge}>
              <Text style={styles.detectedText}>
                📍 {searchMetadata.detectedFilters.city}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* RÉSULTATS */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : searchResults.length > 0 && !showSuggestions ? (
        <FlatList
          data={searchResults}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsContainer}
          numColumns={2}
        />
      ) : !showSuggestions && searchQuery.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptyText}>
            Essayez avec d'autres mots-clés ou vérifiez l'orthographe
          </Text>
          <Text style={styles.emptyHint}>
            💡 {allProducts.length} produits disponibles au total
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
    marginRight: 12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#000',
  },
  clearIcon: {
    fontSize: 18,
    color: '#8E8E93',
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  suggestionSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: '#000',
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexWrap: 'wrap',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
  },
  detectedBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginTop: 4,
  },
  detectedText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  resultsContainer: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    maxWidth: '46%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#F2F2F7',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
  },
  placeholderText: {
    fontSize: 48,
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    minHeight: 36,
  },
  startupName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cityText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
  },
});
