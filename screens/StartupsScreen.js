import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'; // ← Ajouter import
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';

export default function StartupsScreen({ navigation, route }) {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.category || 'Toutes');

  const categories = ['Toutes', 'Beauté', 'Technologie', 'Sports', 'Pâtisserie', 'Boissons', 'Accessoires'];

  // Charger les startups depuis Firestore
  const loadStartups = async () => {
    try {
      setLoading(true);
      
      let q;
      if (selectedCategory === 'Toutes') {
        // Toutes les startups approuvées
        q = query(
          collection(db, 'startups'),
          where('approved', '==', true)
        );
      } else {
        // Filtrer par catégorie
        q = query(
          collection(db, 'startups'),
          where('approved', '==', true),
          where('category', '==', selectedCategory)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const startupsData = [];
      
      querySnapshot.forEach((doc) => {
        startupsData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setStartups(startupsData);
    } catch (error) {
      console.error('Erreur chargement startups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStartups();
  }, [selectedCategory]);

  // Recharger quand on revient sur l'écran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStartups();
    });
    return unsubscribe;
  }, [navigation]);

  const getCategoryEmoji = (category) => {
    const emojis = {
      'Beauté': '💄',
      'Technologie': '💻',
      'Sports': '⚽',
      'Pâtisserie': '🧁',
      'Boissons': '🥤',
      'Accessoires': '🎨',
      'Toutes': '🏪',
    };
    return emojis[category] || '🏪';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* FILTRES PAR CATÉGORIE */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={styles.filterEmoji}>{getCategoryEmoji(category)}</Text>
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === category && styles.filterTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LISTE DES STARTUPS */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des startups...</Text>
        </View>
      ) : startups.length === 0 ? (
        <View style={styles.emptyState}>
          <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          <Text style={styles.emptyStateTitle}>Aucune startup trouvée</Text>
          <Text style={styles.emptyStateText}>
            {selectedCategory === 'Toutes'
              ? 'Aucune startup approuvée pour le moment'
              : `Aucune startup dans la catégorie "${selectedCategory}"`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.startupsGrid}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsCount}>
            {startups.length} startup{startups.length > 1 ? 's' : ''} trouvée{startups.length > 1 ? 's' : ''}
          </Text>

          {startups.map((startup) => (
            <TouchableOpacity
              key={startup.id}
              style={styles.startupCard}
              onPress={() =>
                navigation.navigate('StartupDetail', {
                  startupId: startup.id,
                  startupName: startup.name,
                })
              }
            >
              {/* Logo */}
              <View style={styles.startupHeader}>
                <View style={styles.startupLogo}>
                  <Text style={styles.startupLogoText}>{startup.logo || '🏪'}</Text>
                </View>
                {startup.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                  </View>
                )}
              </View>

              {/* Infos */}
              <View style={styles.startupInfo}>
                <Text style={styles.startupName} numberOfLines={1}>
                  {startup.name}
                </Text>
                <Text style={styles.startupCategory}>{startup.category}</Text>

                {startup.description && (
                  <Text style={styles.startupDescription} numberOfLines={2}>
                    {startup.description}
                  </Text>
                )}

                <View style={styles.startupFooter}>
                  <View style={styles.startupStats}>
                    <Text style={styles.startupStat}>⭐ {startup.rating || '5.0'}</Text>
                    <Text style={styles.startupStat}>📦 {startup.products || 0}</Text>
                  </View>
                  {startup.deliveryTime && (
                    <Text style={styles.deliveryTime}>🚚 {startup.deliveryTime}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: {
  width: 8,
  height: 8,
  marginBottom: 1,
},
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filtersScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  filterTextActive: {
    color: 'white',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  startupsGrid: {
    padding: 20,
    gap: 16,
  },
  resultsCount: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12,
  },
  startupCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  startupLogo: {
    width: 64,
    height: 64,
    backgroundColor: '#F2F2F7',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startupLogoText: {
    fontSize: 32,
  },
  verifiedBadge: {
    marginLeft: 'auto',
    width: 28,
    height: 28,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  startupCategory: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  startupDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  startupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startupStats: {
    flexDirection: 'row',
    gap: 12,
  },
  startupStat: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  deliveryTime: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '600',
  },
});