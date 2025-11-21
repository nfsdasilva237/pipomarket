import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import categoryService from '../utils/categoryService';

const { width } = Dimensions.get('window');

export default function StartupsScreen({ navigation, route }) {
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Toutes', icon: '🏪' }]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.filterCategory || 'Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid ou list
  const [sortBy, setSortBy] = useState('name'); // name, rating, products
  const [fadeAnim] = useState(new Animated.Value(0));

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const firestoreCategories = await categoryService.getCategoriesWithFallback();
      
      setCategories([
        { id: 'all', name: 'Toutes', icon: '🏪' },
        ...firestoreCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '📦',
        }))
      ]);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadStartups = async () => {
    try {
      setLoading(true);
      
      const querySnapshot = await getDocs(collection(db, 'startups'));
      const startupsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isApproved = data.approved !== false;
        
        if (isApproved) {
          startupsData.push({
            id: doc.id,
            ...data,
            logo: data.logo || '🏪',
            rating: data.rating || 5.0,
            products: data.products || 0,
            verified: data.verified || false,
          });
        }
      });

      setStartups(startupsData);
      filterAndSortStartups(startupsData, selectedCategory, searchQuery, sortBy);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Erreur chargement startups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortStartups = (data, category, query, sort) => {
    let filtered = [...data];

    // Filtre par catégorie
    if (category !== 'Toutes') {
      filtered = filtered.filter(s => s.category === category);
    }

    // Filtre par recherche
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower) ||
        s.category?.toLowerCase().includes(searchLower)
      );
    }

    // Tri
    switch (sort) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'products':
        filtered.sort((a, b) => (b.products || 0) - (a.products || 0));
        break;
      case 'name':
      default:
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }

    setFilteredStartups(filtered);
  };

  useEffect(() => {
    loadCategories();
    loadStartups();
  }, []);

  useEffect(() => {
    filterAndSortStartups(startups, selectedCategory, searchQuery, sortBy);
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCategories();
      loadStartups();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStartups();
  };

  const getStatsCount = () => {
    const total = startups.length;
    const verified = startups.filter(s => s.verified).length;
    const avgRating = startups.length > 0 
      ? (startups.reduce((sum, s) => sum + (s.rating || 0), 0) / startups.length).toFixed(1)
      : '0.0';
    return { total, verified, avgRating };
  };

  const stats = getStatsCount();

  const renderStartupCard = (startup) => {
    const isLogoUrl = startup.logo && 
      typeof startup.logo === 'string' && (
        startup.logo.indexOf('file://') === 0 ||
        startup.logo.indexOf('http://') === 0 ||
        startup.logo.indexOf('https://') === 0
      );

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          key={startup.id}
          style={styles.listCard}
          onPress={() => navigation.navigate('StartupDetail', {
            startupId: startup.id,
            startupName: startup.name,
          })}
          activeOpacity={0.8}
        >
          <View style={styles.listLogoContainer}>
            {isLogoUrl ? (
              <Image source={{ uri: startup.logo }} style={styles.listLogoImage} resizeMode="cover" />
            ) : (
              <Text style={styles.listLogoText}>{startup.logo || '🏪'}</Text>
            )}
          </View>

          <View style={styles.listContent}>
            <View style={styles.listHeader}>
              <Text style={styles.listName} numberOfLines={1}>{startup.name}</Text>
              {startup.verified && (
                <View style={styles.verifiedBadgeSmall}>
                  <Text style={styles.verifiedIconSmall}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.listCategory}>{startup.category}</Text>
            {startup.description && (
              <Text style={styles.listDescription} numberOfLines={2}>
                {startup.description}
              </Text>
            )}
            <View style={styles.listStats}>
              <View style={styles.listStatItem}>
                <Text style={styles.listStatIcon}>⭐</Text>
                <Text style={styles.listStatText}>{startup.rating || '5.0'}</Text>
              </View>
              <View style={styles.listStatItem}>
                <Text style={styles.listStatIcon}>📦</Text>
                <Text style={styles.listStatText}>{startup.products || 0} produits</Text>
              </View>
              {startup.deliveryTime && (
                <View style={styles.listStatItem}>
                  <Text style={styles.listStatIcon}>🚚</Text>
                  <Text style={styles.listStatText}>{startup.deliveryTime}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.listArrow}>
            <Text style={styles.listArrowText}>→</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Mode Grid
    return (
      <TouchableOpacity
        key={startup.id}
        style={styles.gridCard}
        onPress={() => navigation.navigate('StartupDetail', {
          startupId: startup.id,
          startupName: startup.name,
        })}
        activeOpacity={0.8}
      >
        {startup.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        )}

        <View style={styles.gridLogoContainer}>
          {isLogoUrl ? (
            <Image source={{ uri: startup.logo }} style={styles.gridLogoImage} resizeMode="cover" />
          ) : (
            <Text style={styles.gridLogoText}>{startup.logo || '🏪'}</Text>
          )}
        </View>

        <Text style={styles.gridName} numberOfLines={1}>{startup.name}</Text>
        
        <View style={styles.gridCategoryBadge}>
          <Text style={styles.gridCategoryText}>{startup.category}</Text>
        </View>

        {startup.description && (
          <Text style={styles.gridDescription} numberOfLines={2}>
            {startup.description}
          </Text>
        )}

        <View style={styles.gridFooter}>
          <View style={styles.gridStatItem}>
            <Text style={styles.gridStatIcon}>⭐</Text>
            <Text style={styles.gridStatText}>{startup.rating || '5.0'}</Text>
          </View>
          <View style={styles.gridStatItem}>
            <Text style={styles.gridStatIcon}>📦</Text>
            <Text style={styles.gridStatText}>{startup.products || 0}</Text>
          </View>
        </View>

        <View style={styles.gridViewButton}>
          <Text style={styles.gridViewButtonText}>Voir →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER GRADIENT */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Startups</Text>
              <Text style={styles.headerSubtitle}>Découvrez nos partenaires</Text>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.headerButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* BARRE DE RECHERCHE */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une startup..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* STATS */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Startups</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.verified}</Text>
              <Text style={styles.statLabel}>Vérifiées</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.avgRating}</Text>
              <Text style={styles.statLabel}>Note moy.</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* FILTRES */}
      <View style={styles.filtersSection}>
        {/* Catégories */}
        {loadingCategories ? (
          <ActivityIndicator size="small" color="#667eea" style={{ padding: 16 }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.name && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.name)}
              >
                <Text style={styles.categoryChipIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.name && styles.categoryChipTextActive,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Options de tri et vue */}
        <View style={styles.optionsRow}>
          <View style={styles.sortOptions}>
            <Text style={styles.sortLabel}>Trier par:</Text>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'name' && styles.sortChipActive]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.sortChipText, sortBy === 'name' && styles.sortChipTextActive]}>Nom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'rating' && styles.sortChipActive]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[styles.sortChipText, sortBy === 'rating' && styles.sortChipTextActive]}>Note</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'products' && styles.sortChipActive]}
              onPress={() => setSortBy('products')}
            >
              <Text style={[styles.sortChipText, sortBy === 'products' && styles.sortChipTextActive]}>Produits</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Text style={styles.viewButtonIcon}>⊞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={styles.viewButtonIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* LISTE DES STARTUPS */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Chargement des startups...</Text>
        </View>
      ) : filteredStartups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Aucune startup trouvée</Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? `Aucun résultat pour "${searchQuery}"`
              : selectedCategory !== 'Toutes'
                ? `Aucune startup dans "${selectedCategory}"`
                : 'Aucune startup disponible'}
          </Text>
          {(searchQuery || selectedCategory !== 'Toutes') && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('Toutes');
              }}
            >
              <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.startupsContainer,
              viewMode === 'grid' && styles.gridContainer
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
            }
          >
            <Text style={styles.resultsCount}>
              {filteredStartups.length} startup{filteredStartups.length > 1 ? 's' : ''} trouvée{filteredStartups.length > 1 ? 's' : ''}
            </Text>

            {viewMode === 'grid' ? (
              <View style={styles.gridWrapper}>
                {filteredStartups.map(renderStartupCard)}
              </View>
            ) : (
              filteredStartups.map(renderStartupCard)
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: 'white',
  },
  searchClear: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    padding: 4,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Filters
  filtersSection: {
    backgroundColor: 'white',
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#667eea',
  },
  categoryChipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  categoryChipTextActive: {
    color: 'white',
  },

  // Options
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sortOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  sortChipActive: {
    backgroundColor: '#667eea',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sortChipTextActive: {
    color: 'white',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 4,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewButtonIcon: {
    fontSize: 16,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  startupsContainer: {
    padding: 20,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },

  // Grid View
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 52) / 2,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
  },
  gridLogoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#667eea20',
  },
  gridLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  gridLogoText: {
    fontSize: 36,
  },
  gridName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  gridCategoryBadge: {
    backgroundColor: '#667eea15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 12,
  },
  gridCategoryText: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
  },
  gridDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 12,
    minHeight: 32,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  gridStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridStatIcon: {
    fontSize: 14,
  },
  gridStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  gridViewButton: {
    backgroundColor: '#667eea',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  gridViewButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  verifiedIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // List View
  listCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
  },
  listLogoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#667eea20',
  },
  listLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  listLogoText: {
    fontSize: 36,
  },
  listContent: {
    flex: 1,
    marginLeft: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  verifiedBadgeSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifiedIconSmall: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listCategory: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 6,
  },
  listDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  listStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listStatIcon: {
    fontSize: 12,
  },
  listStatText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  listArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea15',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  listArrowText: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
});