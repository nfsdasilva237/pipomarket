// components/RecommendationsSection.js - Composant d'affichage des recommandations
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import AIRecommendationsService from '../services/AIRecommendations';

export default function RecommendationsSection({
  type = 'similar', // 'similar', 'personalized', 'new', 'local'
  productId = null,
  productCategory = null,
  userId = null,
  userCity = null,
  onProductPress,
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      let results = [];

      switch (type) {
        case 'similar':
          if (productId && productCategory) {
            results = await AIRecommendationsService.getProductRecommendations(
              productId, 
              productCategory
            );
          }
          break;

        case 'personalized':
          if (userId) {
            results = await AIRecommendationsService.getPersonalizedRecommendations(userId);
          }
          break;

        case 'new':
          if (userId) {
            results = await AIRecommendationsService.getNewForYouRecommendations(userId);
          }
          break;

        case 'local':
          if (userCity) {
            results = await AIRecommendationsService.getLocalPopularRecommendations(userCity);
          }
          break;
      }

      setRecommendations(results);
    } catch (error) {
      console.error('Erreur chargement recommandations:', error);
    } finally {
      setLoading(false);
    }
  }, [type, productId, productCategory, userId, userCity]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const getTitle = () => {
    switch (type) {
      case 'similar':
        return '✨ Vous aimerez aussi';
      case 'personalized':
        return '🎯 Recommandé pour vous';
      case 'new':
        return '🆕 Nouveautés pour vous';
      case 'local':
        return `🔥 Populaire à ${userCity}`;
      default:
        return '💡 Suggestions';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des suggestions...</Text>
        </View>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>Basé sur vos préférences</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recommendations.map((product, index) => (
          <TouchableOpacity
            key={product.id || index}
            style={styles.productCard}
            onPress={() => onProductPress?.(product)}
          >
            {/* IMAGE */}
            <View style={styles.imageContainer}>
              {product.image ? (
                <Image 
                  source={{ uri: product.image }} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>📦</Text>
                </View>
              )}
              
              {/* BADGE NOUVEAU */}
              {product.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NOUVEAU</Text>
                </View>
              )}

              {/* BADGE RAISON */}
              {product.reason && (
                <View style={styles.reasonBadge}>
                  <Text style={styles.reasonText}>{product.reason}</Text>
                </View>
              )}
            </View>

            {/* INFO */}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name || 'Produit'}
              </Text>
              
              {product.startupName && (
                <Text style={styles.startupName} numberOfLines={1}>
                  {product.startupName}
                </Text>
              )}

              <View style={styles.bottomRow}>
                <Text style={styles.price}>
                  {product.price?.toLocaleString('fr-FR') || '0'} FCFA
                </Text>
                
                {product.rating && (
                  <View style={styles.rating}>
                    <Text style={styles.ratingText}>⭐ {product.rating}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  productCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
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
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reasonBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reasonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    height: 36,
  },
  startupName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
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
    color: '#FF9500',
  },
});
