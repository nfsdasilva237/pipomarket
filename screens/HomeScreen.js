// screens/HomeScreen.js - ✅ VERSION FINALE OPTIMISÉE
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecommendationsSection from '../components/RecommendationsSection';
import BannerAd from '../components/BannerAd';
import { auth, db } from '../config/firebase';
import { getUserLevel } from '../config/loyaltyConfig';
import { appConfig } from '../data/appData';
import categoryService from '../utils/categoryService';
import { getCurrentStartupOfMonth } from '../utils/startupOfMonthService';

export default function HomeScreen({ navigation }) {
  // ========== ÉTATS ==========
  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [premiumStartups, setPremiumStartups] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Tout', icon: '🛍️' }]);
  const [startupOfMonth, setStartupOfMonth] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState({ name: 'Bronze', icon: '🥉', color: '#CD7F32' });

  // ========== CHARGEMENT DONNÉES ==========
  
  // Charger catégories depuis Firestore
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

  // Charger startups Premium (TOP 3)
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

  // Charger la Startup du Mois
  const loadStartupOfMonth = async () => {
    try {
      const startup = await getCurrentStartupOfMonth();
      setStartupOfMonth(startup);
    } catch (error) {
      console.error('Erreur chargement Startup du mois:', error);
    }
  };

  // Charger startups en vedette
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

  // Charger points fidélité
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

  // Charger produits aléatoires du jour
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
            // Détection produit boosté
            isBoosted: data.boost?.active === true,
            boostBadge: data.boost?.badge || null,
          });
        }
      });

      // Séparer produits boostés et normaux
      const boostedProducts = allProducts.filter(p => p.isBoosted);
      const normalProducts = allProducts.filter(p => !p.isBoosted);

      // Mélanger les produits normaux avec seed du jour
      const today = new Date().toDateString();
      const shuffledNormal = shuffleWithSeed(normalProducts, today);

      // Produits boostés en premier, puis normaux
      const finalProducts = [...boostedProducts, ...shuffledNormal].slice(0, 6);

      setRandomProducts(finalProducts);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== UTILITAIRES ==========
  
  // Mélanger tableau avec seed (même ordre par jour)
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

  // Navigation vers Startups avec filtre catégorie
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

  // ========== EFFETS ==========
  
  // Chargement initial
  useEffect(() => {
    loadCategories();
    loadPremiumStartups();
    loadStartupOfMonth();
    loadStartups();
    loadUserPoints();
    loadRandomProducts();
  }, []);

  // Rechargement au focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCategories();
      loadPremiumStartups();
      loadStartupOfMonth();
      loadStartups();
      loadUserPoints();
      loadRandomProducts();
    });
    return unsubscribe;
  }, [navigation]);

  // ========== RENDER ==========
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* ==================== HEADER ==================== */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.headerTitle}>{appConfig.appName}</Text>
              <Text style={styles.headerSubtitle}>Marché des Startups</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <Text style={styles.iconButtonText}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('NotificationsTab')}
            >
              <Text style={styles.iconButtonText}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================== RECHERCHE ==================== */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('IntelligentSearch', {
              allProducts: randomProducts
            })}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>
              Rechercher des produits ou startups...
            </Text>
          </TouchableOpacity>
        </View>

        {/* ==================== BANNIÈRE PUBLICITAIRE ==================== */}
        <View style={styles.bannerSection}>
          <BannerAd placement="home_banner" />
        </View>

        {/* ==================== ASSISTANT IA ==================== */}
        <View style={styles.aiSection}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('PipBot')}
            activeOpacity={0.8}
          >
            <View style={styles.aiButtonContent}>
              <Text style={styles.aiButtonIcon}>🤖</Text>
              <View style={styles.aiButtonText}>
                <Text style={styles.aiButtonTitle}>PipBot Assistant</Text>
                <Text style={styles.aiButtonSubtitle}>
                  Posez vos questions sur PipoMarket
                </Text>
              </View>
            </View>
            <Text style={styles.aiButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ==================== STARTUP DU MOIS ==================== */}
        {startupOfMonth && (
          <View style={styles.startupOfMonthSection}>
            <View style={styles.startupOfMonthHeader}>
              <Text style={styles.startupOfMonthBadge}>🏆 STARTUP DU MOIS</Text>
              <Text style={styles.startupOfMonthTitle}>Découvrez notre coup de cœur</Text>
            </View>

            <TouchableOpacity
              style={styles.startupOfMonthCard}
              onPress={() => navigation.navigate('StartupDetail', {
                startupId: startupOfMonth.startupId
              })}
              activeOpacity={0.9}
            >
              <View style={styles.startupOfMonthContent}>
                <View style={styles.startupOfMonthLogoContainer}>
                  <Text style={styles.startupOfMonthLogo}>
                    {startupOfMonth.startupLogo || '🏪'}
                  </Text>
                  <View style={styles.startupOfMonthGlow} />
                </View>

                <View style={styles.startupOfMonthInfo}>
                  <Text style={styles.startupOfMonthName} numberOfLines={1}>
                    {startupOfMonth.startupName}
                  </Text>
                  <Text style={styles.startupOfMonthDescription}>
                    Mise en avant ce mois-ci pour son excellence
                  </Text>

                  <View style={styles.startupOfMonthAction}>
                    <Text style={styles.startupOfMonthActionText}>Découvrir →</Text>
                  </View>
                </View>
              </View>

              <View style={styles.startupOfMonthDecoration}>
                <Text style={styles.startupOfMonthDecorationText}>⭐</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ==================== TOP 3 PREMIUM ==================== */}
        {premiumStartups.length > 0 && (
          <View style={styles.premiumSection}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumTitleRow}>
                <Text style={styles.premiumTitle}>⭐ Startups Recommandées</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
              </View>
              <Text style={styles.premiumSubtitle}>
                Les meilleures startups de PipoMarket
              </Text>
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
                  
                  {startup.subscriptionBadge && (
                    <View style={styles.premiumSubscriptionBadge}>
                      <Text style={styles.premiumSubscriptionText}>
                        {startup.subscriptionBadge}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={styles.premiumCategory}>{startup.category}</Text>
                  
                  <View style={styles.premiumStats}>
                    <Text style={styles.premiumStat}>⭐ {startup.rating || '5.0'}</Text>
                    <Text style={styles.premiumStat}>📦 {startup.products || 0}</Text>
                  </View>
                  
                  <View style={styles.premiumGlow} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ==================== CARTE FIDÉLITÉ ==================== */}
        {auth.currentUser && (
          <TouchableOpacity
            style={[styles.loyaltyCard, { backgroundColor: userLevel.color || '#007AFF' }]}
            onPress={() => navigation.navigate('Loyalty')}
            activeOpacity={0.8}
          >
            <View style={styles.loyaltyCardContent}>
              <View style={styles.loyaltyCardLeft}>
                <Text style={styles.loyaltyCardIcon}>{userLevel.icon}</Text>
                <View>
                  <Text style={styles.loyaltyCardTitle}>Programme de Fidélité</Text>
                  <Text style={styles.loyaltyCardSubtitle}>
                    Niveau {userLevel.name}
                  </Text>
                </View>
              </View>
              <View style={styles.loyaltyCardRight}>
                <Text style={styles.loyaltyCardPoints}>{userPoints}</Text>
                <Text style={styles.loyaltyCardPointsLabel}>points</Text>
              </View>
            </View>
            <Text style={styles.loyaltyCardAction}>Voir mes récompenses →</Text>
          </TouchableOpacity>
        )}

        {/* ==================== CATÉGORIES ==================== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          {loadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category)}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji || category.icon}</Text>
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
              <Text style={styles.seeAllButton}>Actualiser 🔄</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : randomProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📦</Text>
              <Text style={styles.emptyStateTitle}>Aucun produit disponible</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.productsScroll}
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
                    >
                      {/* Badge Boost */}
                      {product.isBoosted && product.boostBadge && (
                        <View style={styles.boostBadge}>
                          <Text style={styles.boostBadgeText}>{product.boostBadge}</Text>
                        </View>
                      )}

                      <View style={styles.productImage}>
                        {isImageUrl ? (
                          <Image
                            source={{ uri: product.image }}
                            style={styles.productImageReal}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.productImageText}>{product.image || '📦'}</Text>
                        )}
                      </View>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productPrice}>
                        {product.price?.toLocaleString() || '0'} FCFA
                      </Text>
                      {product.stock < 5 && product.stock > 0 && (
                        <Text style={styles.productStock}>Plus que {product.stock} !</Text>
                      )}
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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : featuredStartups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏪</Text>
              <Text style={styles.emptyStateTitle}>Aucune startup disponible</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.startupsScroll}
            >
              {featuredStartups
                .filter(startup => startup && startup.id && startup.name)
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
                >
                  <View style={styles.startupLogo}>
                    <Text style={styles.startupLogoText}>{startup.logo || '🏪'}</Text>
                  </View>
                  <View style={styles.startupInfo}>
                    <Text style={styles.startupName} numberOfLines={1}>
                      {startup.name}
                    </Text>
                    <Text style={styles.startupCategory}>{startup.category}</Text>
                    <View style={styles.startupStats}>
                      <Text style={styles.startupStat}>
                        ⭐ {startup.rating || '5.0'}
                      </Text>
                      <Text style={styles.startupStat}>
                        📦 {startup.products || 0} produits
                      </Text>
                    </View>
                  </View>
                  {startup.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedIcon}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ==================== PROMOTIONS ==================== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎉 Offres du moment</Text>
          <View style={styles.promoCard}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Bienvenue sur {appConfig.appName} !</Text>
              <Text style={styles.promoDescription}>
                Découvrez les meilleures startups camerounaises
              </Text>
              <TouchableOpacity
                style={styles.promoButton}
                onPress={() => navigation.navigate('StartupsTab', { screen: 'Startups' })}
              >
                <Text style={styles.promoButtonText}>Explorer →</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.promoEmoji}>🚀</Text>
          </View>
        </View>

        {/* ==================== ACTIONS RAPIDES ==================== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('StartupsTab', { screen: 'Startups' })}
            >
              <Text style={styles.quickActionIcon}>🏢</Text>
              <Text style={styles.quickActionText}>Toutes les startups</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('CartTab')}
            >
              <Text style={styles.quickActionIcon}>🛒</Text>
              <Text style={styles.quickActionText}>Mon panier</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollView: { flex: 1 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 45, height: 30, marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  headerButtons: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 40, height: 40, backgroundColor: '#F2F2F7', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconButtonText: { fontSize: 20 },
  
  // Search
  searchContainer: { padding: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: 'white' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  searchIcon: { fontSize: 20, marginRight: 8 },
  searchPlaceholder: { flex: 1, fontSize: 15, color: '#8E8E93' },
  
  // Banner Section
  bannerSection: { paddingHorizontal: 20, marginTop: 12 },

  // Assistant IA
  aiSection: { paddingHorizontal: 20, marginTop: 12 },
  aiButton: { backgroundColor: 'white', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 2, borderColor: '#E3F2FD' },
  aiButtonContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  aiButtonIcon: { fontSize: 32, marginRight: 12 },
  aiButtonText: { flex: 1 },
  aiButtonTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 2 },
  aiButtonSubtitle: { fontSize: 12, color: '#8E8E93' },
  aiButtonArrow: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },

  // Startup du Mois
  startupOfMonthSection: { paddingHorizontal: 20, marginTop: 20 },
  startupOfMonthHeader: { marginBottom: 16 },
  startupOfMonthBadge: { fontSize: 12, fontWeight: 'bold', color: '#FFD700', letterSpacing: 1, marginBottom: 4 },
  startupOfMonthTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  startupOfMonthCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, borderWidth: 2, borderColor: '#FFF9E6', position: 'relative', overflow: 'hidden' },
  startupOfMonthContent: { flexDirection: 'row', alignItems: 'center' },
  startupOfMonthLogoContainer: { width: 80, height: 80, backgroundColor: '#FFF9E6', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginRight: 16, position: 'relative', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  startupOfMonthLogo: { fontSize: 40, zIndex: 2 },
  startupOfMonthGlow: { position: 'absolute', width: 60, height: 60, backgroundColor: '#FFD700', opacity: 0.2, borderRadius: 30 },
  startupOfMonthInfo: { flex: 1 },
  startupOfMonthName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  startupOfMonthDescription: { fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 18 },
  startupOfMonthAction: { backgroundColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start' },
  startupOfMonthActionText: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  startupOfMonthDecoration: { position: 'absolute', top: -20, right: -20, width: 80, height: 80, backgroundColor: '#FFD700', opacity: 0.1, borderRadius: 40 },
  startupOfMonthDecorationText: { fontSize: 60, opacity: 0.3 },
  
  // Premium Section
  premiumSection: { backgroundColor: 'white', marginTop: 16, paddingVertical: 20 },
  premiumHeader: { paddingHorizontal: 20, marginBottom: 16 },
  premiumTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  premiumTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginRight: 8 },
  premiumBadge: { backgroundColor: '#AF52DE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  premiumBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  premiumSubtitle: { fontSize: 13, color: '#8E8E93' },
  premiumScroll: { paddingHorizontal: 20, gap: 16 },
  premiumCard: { width: 160, backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#AF52DE', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, borderWidth: 2, borderColor: '#F0E6FF', position: 'relative', overflow: 'hidden' },
  premiumRank: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, backgroundColor: '#FFD700', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
  premiumRankText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  premiumLogoContainer: { width: 80, height: 80, backgroundColor: 'white', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  premiumLogo: { fontSize: 40 },
  premiumName: { fontSize: 16, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 4 },
  premiumSubscriptionBadge: { backgroundColor: '#AF52DE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 8 },
  premiumSubscriptionText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  premiumCategory: { fontSize: 12, color: '#666', marginBottom: 8 },
  premiumStats: { flexDirection: 'row', gap: 12 },
  premiumStat: { fontSize: 11, color: '#666' },
  premiumGlow: { position: 'absolute', top: -50, left: -50, width: 100, height: 100, backgroundColor: 'rgba(175, 82, 222, 0.1)', borderRadius: 50 },
  
  // Loyalty Card
  loyaltyCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  loyaltyCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  loyaltyCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  loyaltyCardIcon: { fontSize: 40, marginRight: 12 },
  loyaltyCardTitle: { fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 2 },
  loyaltyCardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  loyaltyCardRight: { alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  loyaltyCardPoints: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  loyaltyCardPointsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: -4 },
  loyaltyCardAction: { fontSize: 13, color: 'white', fontWeight: '600', textAlign: 'center' },
  
  // Sections
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  seeAllButton: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  
  // Categories
  categoriesScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  categoryCard: { width: 100, height: 100, backgroundColor: 'white', borderRadius: 16, marginRight: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  categoryEmoji: { fontSize: 32, marginBottom: 8 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#000' },
  
  // States
  loadingContainer: { padding: 40, alignItems: 'center' },
  emptyState: { backgroundColor: 'white', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyStateIcon: { fontSize: 64, marginBottom: 16 },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  
  // Products
  productsScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  productCard: { width: 140, backgroundColor: 'white', borderRadius: 12, marginRight: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, position: 'relative' },
  boostBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF9500', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  boostBadgeText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  productImage: { width: '100%', height: 100, backgroundColor: '#F2F2F7', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  productImageReal: { width: '100%', height: '100%' },
  productImageText: { fontSize: 48 },
  productName: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4, height: 36 },
  productPrice: { fontSize: 15, fontWeight: 'bold', color: '#007AFF' },
  productStock: { fontSize: 11, color: '#FF3B30', marginTop: 4 },
  
  // Startups
  startupsScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  startupCard: { width: 160, backgroundColor: 'white', borderRadius: 16, marginRight: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, position: 'relative' },
  startupLogo: { width: 64, height: 64, backgroundColor: '#F2F2F7', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12, alignSelf: 'center' },
  startupLogoText: { fontSize: 32 },
  startupInfo: { flex: 1 },
  startupName: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  startupCategory: { fontSize: 12, color: '#8E8E93', marginBottom: 8 },
  startupStats: { flexDirection: 'column', gap: 4 },
  startupStat: { fontSize: 11, color: '#666' },
  verifiedBadge: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, backgroundColor: '#007AFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  verifiedIcon: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  
  // Promo
  promoCard: { backgroundColor: '#007AFF', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promoContent: { flex: 1 },
  promoTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  promoDescription: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
  promoButton: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  promoButtonText: { color: '#007AFF', fontSize: 13, fontWeight: 'bold' },
  promoEmoji: { fontSize: 48, marginLeft: 16 },
  
  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  quickActionCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  quickActionIcon: { fontSize: 32, marginBottom: 8 },
  quickActionText: { fontSize: 13, fontWeight: '600', color: '#000', textAlign: 'center' },
});