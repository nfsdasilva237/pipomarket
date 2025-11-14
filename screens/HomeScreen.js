// screens/HomeScreen.js - VERSION MODERNE ET PREMIUM
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import RecommendationsSection from '../components/RecommendationsSection';
import { auth, db } from '../config/firebase';
import { getUserLevel } from '../config/loyaltyConfig';
import { appConfig } from '../data/appData';
import categoryService from '../utils/categoryService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  // ========== ÉTATS ==========
  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [premiumStartups, setPremiumStartups] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Tout', icon: '🛍️' }]);

  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState({ name: 'Bronze', icon: '🥉', color: '#CD7F32' });

  // Animation
  const [fadeAnim] = useState(new Animated.Value(0));

  // ========== CHARGEMENT DONNÉES ==========

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const firestoreCategories = await categoryService.getCategoriesWithFallback();

      setCategories([
        { id: 'all', name: 'Tout', icon: '🛍️' },
        ...firestoreCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '📦',
          emoji: cat.icon || '📦',
        }))
      ]);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadPremiumStartups = async () => {
    try {
      const premiumQ = query(
        collection(db, 'startups'),
        where('subscriptionPlan', '==', 'premium'),
        where('subscriptionStatus', 'in', ['trial', 'active']),
        limit(3)
      );

      const premiumSnap = await getDocs(premiumQ);
      const premium = premiumSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isPremium: true,
      }));

      setPremiumStartups(premium);
    } catch (error) {
      console.error('Erreur chargement premium startups:', error);
    }
  };

  const loadStartups = async () => {
    try {
      const q = query(collection(db, 'startups'), limit(6));
      const querySnapshot = await getDocs(q);
      const startupsData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        if (data && data.name) {
          startupsData.push({
            id: doc.id,
            ...data,
            logo: data.logo || '🏪',
            category: data.category || 'Autre',
            rating: data.rating || 5.0,
            products: data.products || 0,
            verified: data.verified || false,
          });
        }
      });

      setFeaturedStartups(startupsData);
    } catch (error) {
      console.error('Erreur chargement startups:', error);
    }
  };

  const loadUserPoints = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      const points = userData?.loyaltyPoints || 0;

      setUserPoints(points);
      setUserLevel(getUserLevel(points));
    } catch (error) {
      console.error('Erreur chargement points:', error);
    }
  };

  const loadRandomProducts = async () => {
    try {
      const q = query(
        collection(db, 'products'),
        where('available', '==', true),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const allProducts = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        if (data && data.name && data.price !== undefined) {
          allProducts.push({
            id: doc.id,
            ...data,
            image: data.image || '📦',
            price: typeof data.price === 'number' ? data.price : 0,
            stock: typeof data.stock === 'number' ? data.stock : 0,
            available: data.available !== false,
          });
        }
      });

      const today = new Date().toDateString();
      const shuffled = shuffleWithSeed(allProducts, today);
      setRandomProducts(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const shuffleWithSeed = (array, seed) => {
    const arr = [...array];
    let currentIndex = arr.length;
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }

    const random = () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };

    while (currentIndex !== 0) {
      const randomIndex = Math.floor(random() * currentIndex);
      currentIndex--;
      [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }

    return arr;
  };

  const handleCategoryPress = (category) => {
    if (category.id === 'all') {
      navigation.navigate('StartupsTab', {
        screen: 'Startups'
      });
    } else {
      navigation.navigate('StartupsTab', {
        screen: 'Startups',
        params: { filterCategory: category.name }
      });
    }
  };

  useEffect(() => {
    loadCategories();
    loadPremiumStartups();
    loadStartups();
    loadUserPoints();
    loadRandomProducts();

    // Animation fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCategories();
      loadPremiumStartups();
      loadStartups();
      loadUserPoints();
      loadRandomProducts();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ==================== HERO BANNER ==================== */}
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <View>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.heroLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.heroIconButton}
                  onPress={() => navigation.navigate('NotificationsTab')}
                >
                  <Text style={styles.heroIcon}>🔔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroIconButton}
                  onPress={() => navigation.navigate('ProfileTab')}
                >
                  <Text style={styles.heroIcon}>👤</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.heroTitle}>Bienvenue sur PipoMarket !</Text>
            <Text style={styles.heroSubtitle}>
              Découvrez les meilleures startups camerounaises
            </Text>

            {/* Quick Search */}
            <TouchableOpacity
              style={styles.heroSearchBar}
              onPress={() => navigation.navigate('IntelligentSearch', {
                allProducts: randomProducts
              })}
            >
              <Text style={styles.heroSearchIcon}>🔍</Text>
              <Text style={styles.heroSearchText}>
                Rechercher...
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ==================== QUICK ACTIONS ==================== */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#667eea' }]}
            onPress={() => navigation.navigate('PipBot')}
          >
            <Text style={styles.quickActionIcon}>🤖</Text>
            <Text style={styles.quickActionText}>Assistant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#f093fb' }]}
            onPress={() => navigation.navigate('Loyalty')}
          >
            <Text style={styles.quickActionIcon}>⭐</Text>
            <Text style={styles.quickActionText}>Fidélité</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#4facfe' }]}
            onPress={() => navigation.navigate('Orders')}
          >
            <Text style={styles.quickActionIcon}>📦</Text>
            <Text style={styles.quickActionText}>Commandes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#43e97b' }]}
            onPress={() => navigation.navigate('Favorites')}
          >
            <Text style={styles.quickActionIcon}>❤️</Text>
            <Text style={styles.quickActionText}>Favoris</Text>
          </TouchableOpacity>
        </View>

        {/* ==================== CARTE FIDÉLITÉ ==================== */}
        {auth.currentUser && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.loyaltyCard}
              onPress={() => navigation.navigate('Loyalty')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[userLevel.color || '#007AFF', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loyaltyGradient}
              >
                <View style={styles.loyaltyContent}>
                  <View style={styles.loyaltyLeft}>
                    <Text style={styles.loyaltyIcon}>{userLevel.icon}</Text>
                    <View>
                      <Text style={styles.loyaltyTitle}>Programme Fidélité</Text>
                      <Text style={styles.loyaltyLevel}>Niveau {userLevel.name}</Text>
                    </View>
                  </View>
                  <View style={styles.loyaltyRight}>
                    <Text style={styles.loyaltyPoints}>{userPoints}</Text>
                    <Text style={styles.loyaltyPointsLabel}>points</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ==================== TOP 3 PREMIUM ==================== */}
        {premiumStartups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💎 Startups Premium</Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>TOP 3</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.premiumScroll}
            >
              {premiumStartups.map((startup, index) => (
                <TouchableOpacity
                  key={startup.id}
                  style={styles.premiumCard}
                  onPress={() => navigation.navigate('StartupDetail', {
                    startupId: startup.id
                  })}
                  activeOpacity={0.8}
                >
                  <View style={styles.premiumRank}>
                    <Text style={styles.premiumRankText}>#{index + 1}</Text>
                  </View>

                  <View style={styles.premiumLogoContainer}>
                    <Text style={styles.premiumLogo}>{startup.logo || '🏪'}</Text>
                  </View>

                  <Text style={styles.premiumName} numberOfLines={1}>
                    {startup.name}
                  </Text>

                  <Text style={styles.premiumCategory}>{startup.category}</Text>

                  <View style={styles.premiumStats}>
                    <View style={styles.premiumStatItem}>
                      <Text style={styles.premiumStatIcon}>⭐</Text>
                      <Text style={styles.premiumStatText}>{startup.rating || '5.0'}</Text>
                    </View>
                    <View style={styles.premiumStatItem}>
                      <Text style={styles.premiumStatIcon}>📦</Text>
                      <Text style={styles.premiumStatText}>{startup.products || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ==================== CATÉGORIES ==================== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Catégories</Text>
          {loadingCategories ? (
            <ActivityIndicator size="small" color="#667eea" style={{ marginTop: 16 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryIconContainer}>
                    <Text style={styles.categoryEmoji}>{category.emoji || category.icon}</Text>
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ==================== RECOMMANDATIONS IA ==================== */}
        {auth.currentUser && (
          <RecommendationsSection
            type="personalized"
            userId={auth.currentUser.uid}
            onProductPress={(product) => navigation.navigate('ProductDetail', {
              productId: product.id,
              productName: product.name
            })}
          />
        )}

        {/* ==================== PRODUITS DU JOUR ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Découvertes du jour</Text>
            <TouchableOpacity onPress={() => loadRandomProducts()}>
              <Text style={styles.refreshButton}>🔄</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 20 }} />
          ) : randomProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Aucun produit disponible</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {randomProducts
                .filter(product => product && product.id && product.name)
                .map((product) => {
                  const isImageUrl = product.image &&
                    typeof product.image === 'string' && (
                      product.image.indexOf('file://') === 0 ||
                      product.image.indexOf('http://') === 0 ||
                      product.image.indexOf('https://') === 0
                    );

                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productCard}
                      onPress={() =>
                        navigation.navigate('ProductDetail', {
                          productId: product.id,
                          productName: product.name,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.productImageContainer}>
                        {isImageUrl ? (
                          <Image
                            source={{ uri: product.image }}
                            style={styles.productImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Text style={styles.productImageEmoji}>{product.image || '📦'}</Text>
                          </View>
                        )}
                        {product.stock < 5 && product.stock > 0 && (
                          <View style={styles.stockBadge}>
                            <Text style={styles.stockBadgeText}>Plus que {product.stock}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text style={styles.productPrice}>
                          {product.price?.toLocaleString('fr-FR') || '0'} FCFA
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          )}
        </View>

        {/* ==================== STARTUPS EN VEDETTE ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Startups en vedette</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('StartupsTab', { screen: 'Startups' })}
            >
              <Text style={styles.seeAllButton}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 20 }} />
          ) : featuredStartups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyText}>Aucune startup disponible</Text>
            </View>
          ) : (
            <View style={styles.startupsGrid}>
              {featuredStartups
                .filter(startup => startup && startup.id && startup.name)
                .slice(0, 4)
                .map((startup) => (
                <TouchableOpacity
                  key={startup.id}
                  style={styles.startupCard}
                  onPress={() =>
                    navigation.navigate('StartupDetail', {
                      startupId: startup.id,
                      startupName: startup.name,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.startupLogoContainer}>
                    <Text style={styles.startupLogo}>{startup.logo || '🏪'}</Text>
                  </View>
                  <View style={styles.startupContent}>
                    <Text style={styles.startupName} numberOfLines={1}>
                      {startup.name}
                    </Text>
                    <Text style={styles.startupCategory} numberOfLines={1}>{startup.category}</Text>
                    <View style={styles.startupStats}>
                      <Text style={styles.startupStat}>
                        ⭐ {startup.rating || '5.0'}
                      </Text>
                      <Text style={styles.startupStat}>
                        📦 {startup.products || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ESPACE EN BAS */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },

  // Hero Banner
  heroBanner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    gap: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLogo: {
    width: 50,
    height: 50,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginTop: 8,
  },
  heroSearchIcon: {
    fontSize: 20,
  },
  heroSearchText: {
    fontSize: 15,
    color: '#999',
    flex: 1,
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: -20,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },

  // Loyalty Card
  loyaltyCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  loyaltyGradient: {
    padding: 20,
  },
  loyaltyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loyaltyIcon: {
    fontSize: 40,
  },
  loyaltyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  loyaltyLevel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loyaltyRight: {
    alignItems: 'flex-end',
  },
  loyaltyPoints: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  loyaltyPointsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  refreshButton: {
    fontSize: 24,
  },
  seeAllButton: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },

  // Premium Startups
  premiumScroll: {
    paddingRight: 20,
    gap: 16,
  },
  premiumCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
  },
  premiumRank: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  premiumLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  premiumLogo: {
    fontSize: 32,
  },
  premiumName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  premiumCategory: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  premiumStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumStatIcon: {
    fontSize: 14,
  },
  premiumStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },

  // Categories
  categoriesScroll: {
    paddingRight: 20,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  // Products
  productsScroll: {
    paddingRight: 20,
    gap: 16,
  },
  productCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageEmoji: {
    fontSize: 48,
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#667eea',
  },

  // Startups Grid
  startupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  startupCard: {
    width: (width - 52) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  startupLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  startupLogo: {
    fontSize: 28,
  },
  startupContent: {
    gap: 4,
  },
  startupName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  startupCategory: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  startupStats: {
    flexDirection: 'row',
    gap: 12,
  },
  startupStat: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
