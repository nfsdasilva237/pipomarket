// screens/HomeScreen.js - ✅ VERSION FINALE CORRIGÉE

import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserLevel } from '../config/loyaltyConfig';
import { useFavorites } from '../contexts/FavoritesContext';

import BDLStudioSection from '../components/BDLStudioSection';
import RecommendationsSection from '../components/RecommendationsSection';
import { auth, db } from '../config/firebase';
import categoryService from '../utils/categoryService';

const { width } = Dimensions.get('window');

// 🎨 COULEURS OFFICIELLES PIPOMARKET
const COLORS = {
  primary: '#1675D4',
  secondary: '#27CEFC',
  accent: '#0B52CB',
  gradient: ['#0B52CB', '#1675D4', '#27CEFC'],
  gradientReverse: ['#27CEFC', '#1675D4', '#0B52CB'],
};

export default function HomeScreen({ navigation, addToCart }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [premiumStartups, setPremiumStartups] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Tout', icon: '🛍️' }]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState({ name: 'Bronze', icon: '🥉', color: '#CD7F32' });
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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
      const q = query(collection(db, 'products'), limit(30));
      const querySnapshot = await getDocs(q);
      const allProducts = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.name && data.price !== undefined) {
          if (data.available !== false) {
            allProducts.push({
              id: doc.id,
              ...data,
              image: data.image || '📦',
              price: typeof data.price === 'number' ? data.price : 0,
              stock: typeof data.stock === 'number' ? data.stock : 0,
              available: data.available !== false,
            });
          }
        }
      });
      
      const today = new Date().toDateString();
      const shuffled = shuffleWithSeed(allProducts, today);
      setRandomProducts(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      navigation.navigate('StartupsTab', { screen: 'Startups' });
    } else {
      navigation.navigate('StartupsTab', {
        screen: 'Startups',
        params: { filterCategory: category.name }
      });
    }
  };

  // ✅ FONCTION POUR AJOUTER AU PANIER
  const handleAddToCart = (product) => {
    if (!product.available) {
      Alert.alert('Indisponible', 'Ce produit n\'est plus disponible');
      return;
    }

    if (product.stock < 1) {
      Alert.alert('Stock insuffisant', 'Ce produit est en rupture de stock');
      return;
    }

    if (addToCart) {
      addToCart(product);
      Alert.alert(
        'Produit ajouté',
        `${product.name} a été ajouté au panier`,
        [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Voir le panier',
            onPress: () => navigation.navigate('CartTab')
          }
        ]
      );
    } else {
      console.error('❌ addToCart function not provided to HomeScreen');
      Alert.alert('Erreur', 'Impossible d\'ajouter au panier');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
    loadPremiumStartups();
    loadStartups();
    loadUserPoints();
    loadRandomProducts();
  };

  useEffect(() => {
    loadCategories();
    loadPremiumStartups();
    loadStartups();
    loadUserPoints();
    loadRandomProducts();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
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

  const bottomPadding = Platform.select({
    ios: insets.bottom + 80,
    android: 80,
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const searchBarTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary, COLORS.secondary]}
          />
        }
      >
        {/* HERO BANNER - PIPOMARKET COLORS */}
        <Animated.View style={{ paddingTop: insets.top, opacity: headerOpacity }}>
          <LinearGradient
            colors={COLORS.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroContent}>
              {/* HEADER avec logo et actions */}
              <View style={styles.heroHeader}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <Image
                    source={require('../assets/logo.png')}
                    style={styles.heroLogo}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>

              {/* Texte de bienvenue */}
              <Animated.View style={{ 
                opacity: fadeAnim, 
                transform: [{ translateY: slideAnim }] 
              }}>
                <Text style={styles.heroGreeting}>
                  {getGreeting()} 👋
                </Text>
                <Text style={styles.heroTitle}>PipoMarket</Text>
                <Text style={styles.heroSubtitle}>
                  La marketplace des startups camerounaises
                </Text>
              </Animated.View>

              {/* ✅ BARRE DE RECHERCHE CORRIGÉE */}
              <TouchableOpacity
                style={styles.heroSearchBar}
                onPress={() => {
                  console.log('🔍 Recherche cliquée');
                  navigation.navigate('IntelligentSearch', {
                    allProducts: randomProducts
                  });
                }}
                activeOpacity={0.9}
              >
                <View style={styles.searchIconContainer}>
                  <Text style={styles.heroSearchIcon}>🔍</Text>
                </View>
                <Text style={styles.heroSearchText}>Rechercher produits, startups...</Text>
                <View style={styles.searchMicButton}>
                  <Text style={styles.searchMicIcon}>🎤</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />
            <View style={styles.heroCircle3} />
          </LinearGradient>
        </Animated.View>

        {/* QUICK ACTIONS - PIPOMARKET THEME */}
        <Animated.View style={[
          styles.quickActionsContainer,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <TouchableOpacity
            style={styles.quickActionMain}
            onPress={() => navigation.navigate('PipBot')}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.primary]}
                style={styles.quickActionMainGradient}
              >
                <Text style={styles.quickActionMainIcon}>🤖</Text>
                <View style={styles.quickActionMainContent}>
                  <Text style={styles.quickActionMainTitle}>PipBot Assistant</Text>
                  <Text style={styles.quickActionMainSubtitle}>IA à votre service 24/7</Text>
                </View>
                <View style={styles.quickActionMainArrow}>
                  <Text style={styles.quickActionMainArrowText}>→</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickAction, styles.quickActionSmall]}
              onPress={() => navigation.navigate('Loyalty')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>⭐</Text>
                <Text style={styles.quickActionText}>Fidélité</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, styles.quickActionSmall]}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.secondary, COLORS.primary]}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>📦</Text>
                <Text style={styles.quickActionText}>Commandes</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, styles.quickActionSmall]}
              onPress={() => navigation.navigate('Favorites')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B6B', '#EE5A5A']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>❤️</Text>
                <Text style={styles.quickActionText}>Favoris</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* CARTE FIDÉLITÉ - PIPOMARKET BRAND */}
        {auth.currentUser && (
          <Animated.View style={{ 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}>
            <TouchableOpacity
              style={styles.loyaltyCard}
              onPress={() => navigation.navigate('Loyalty')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[userLevel.color || COLORS.primary, COLORS.accent, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loyaltyGradient}
              >
                <View style={styles.loyaltyContent}>
                  <View style={styles.loyaltyLeft}>
                    <View style={styles.loyaltyIconContainer}>
                      <Text style={styles.loyaltyIcon}>{userLevel.icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.loyaltyTitle}>Programme Fidélité</Text>
                      <Text style={styles.loyaltyLevel}>Niveau {userLevel.name}</Text>
                      <View style={styles.loyaltyProgress}>
                        <View style={[styles.loyaltyProgressBar, { width: `${Math.min((userPoints / 1000) * 100, 100)}%` }]} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.loyaltyRight}>
                    <Text style={styles.loyaltyPoints}>{userPoints.toLocaleString()}</Text>
                    <Text style={styles.loyaltyPointsLabel}>points</Text>
                    <View style={styles.loyaltyArrow}>
                      <Text style={styles.loyaltyArrowText}>→</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.loyaltyCircle1} />
                <View style={styles.loyaltyCircle2} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* BDL STUDIO */}
        <BDLStudioSection navigation={navigation} />

        {/* TOP 3 PREMIUM */}
        {premiumStartups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>💎 Startups Premium</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>TOP 3</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('StartupsTab', { screen: 'Startups' })}>
                <Text style={styles.seeAllButton}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.premiumScroll}
              decelerationRate="fast"
              snapToInterval={176}
            >
              {premiumStartups.map((startup, index) => {
                const isLogoUrl = startup.logo && 
                  typeof startup.logo === 'string' && (
                    startup.logo.indexOf('file://') === 0 ||
                    startup.logo.indexOf('http://') === 0 ||
                    startup.logo.indexOf('https://') === 0
                  );

                const rankColors = [
                  ['#FFD700', '#FFA500'],
                  ['#C0C0C0', '#A0A0A0'],
                  ['#CD7F32', '#8B4513'],
                ];

                return (
                  <TouchableOpacity
                    key={startup.id}
                    style={styles.premiumCard}
                    onPress={() => navigation.navigate('StartupDetail', { startupId: startup.id })}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={rankColors[index] || rankColors[2]}
                      style={styles.premiumRank}
                    >
                      <Text style={styles.premiumRankText}>
                        {index === 0 ? '👑' : `#${index + 1}`}
                      </Text>
                    </LinearGradient>
                    <View style={styles.premiumLogoContainer}>
                      {isLogoUrl ? (
                        <Image
                          source={{ uri: startup.logo }}
                          style={styles.premiumLogoImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.premiumLogo}>{startup.logo || '🏪'}</Text>
                      )}
                    </View>
                    <Text style={styles.premiumName} numberOfLines={1}>{startup.name}</Text>
                    <View style={styles.premiumCategoryBadge}>
                      <Text style={styles.premiumCategoryText}>{startup.category}</Text>
                    </View>
                    <View style={styles.premiumStats}>
                      <View style={styles.premiumStatItem}>
                        <Text style={styles.premiumStatIcon}>⭐</Text>
                        <Text style={styles.premiumStatText}>{startup.rating || '5.0'}</Text>
                      </View>
                      <View style={styles.premiumStatDivider} />
                      <View style={styles.premiumStatItem}>
                        <Text style={styles.premiumStatIcon}>📦</Text>
                        <Text style={styles.premiumStatText}>{startup.products || 0}</Text>
                      </View>
                    </View>
                    <View style={styles.premiumViewButton}>
                      <Text style={styles.premiumViewButtonText}>Découvrir</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* CATÉGORIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏷️ Catégories</Text>
            <Text style={styles.sectionCount}>{categories.length - 1} disponibles</Text>
          </View>
          {loadingCategories ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 16 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((category, index) => (
                <Animated.View 
                  key={category.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, index * 10],
                      })
                    }]
                  }}
                >
                  <TouchableOpacity
                    style={styles.categoryCard}
                    onPress={() => handleCategoryPress(category)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryIconContainer}>
                      <Text style={styles.categoryEmoji}>{category.emoji || category.icon}</Text>
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <View style={styles.categoryArrow}>
                      <Text style={styles.categoryArrowText}>→</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* RECOMMANDATIONS */}
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

        {/* PRODUITS DU JOUR */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>✨ Découvertes du jour</Text>
              <View style={styles.timerBadge}>
                <Text style={styles.timerIcon}>⏰</Text>
                <Text style={styles.timerText}>{getTimeUntilMidnight()}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => loadRandomProducts()}
              style={styles.refreshButtonContainer}
            >
              <Text style={styles.refreshButton}>🔄</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingProducts}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Chargement des découvertes...</Text>
            </View>
          ) : randomProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Aucun produit disponible</Text>
              <Text style={styles.emptyText}>Revenez plus tard pour découvrir de nouveaux produits</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
              decelerationRate="fast"
              snapToInterval={176}
            >
              {randomProducts.filter(product => product && product.id && product.name).map((product, index) => {
                const isImageUrl = product.image && typeof product.image === 'string' && (
                  product.image.indexOf('file://') === 0 ||
                  product.image.indexOf('http://') === 0 ||
                  product.image.indexOf('https://') === 0
                );
                return (
                  <Animated.View
                    key={product.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [{
                        scale: scaleAnim.interpolate({
                          inputRange: [0.9, 1],
                          outputRange: [0.9 + (index * 0.02), 1],
                        })
                      }]
                    }}
                  >
                    <TouchableOpacity
                      style={styles.productCard}
                      onPress={() => navigation.navigate('ProductDetail', {
                        productId: product.id,
                        productName: product.name,
                      })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.productImageContainer}>
                        {isImageUrl ? (
                          <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Text style={styles.productImageEmoji}>{product.image || '📦'}</Text>
                          </View>
                        )}
                        {product.stock < 5 && product.stock > 0 && (
                          <View style={styles.stockBadge}>
                            <Text style={styles.stockBadgeIcon}>🔥</Text>
                            <Text style={styles.stockBadgeText}>{product.stock} restants</Text>
                          </View>
                        )}
                        <TouchableOpacity 
                          style={styles.productFavoriteButton}
                          onPress={() => toggleFavorite(product)}
                        >
                          <Text style={styles.productFavoriteIcon}>
                            {isFavorite(product.id) ? '❤️' : '🤍'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        <View style={styles.productPriceContainer}>
                          <Text style={styles.productPrice}>
                            {(product.price || 0).toLocaleString('fr-FR')}
                          </Text>
                          <Text style={styles.productCurrency}>FCFA</Text>
                        </View>
                        {/* ✅ BOUTON AJOUTER AU PANIER CORRIGÉ */}
                        <TouchableOpacity 
                          style={styles.productAddButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <Text style={styles.productAddButtonText}>+ Panier</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* STARTUPS EN VEDETTE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>🔥 Startups en vedette</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('StartupsTab', { screen: 'Startups' })}>
              <Text style={styles.seeAllButton}>Voir tout →</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingProducts}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : featuredStartups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyTitle}>Aucune startup disponible</Text>
            </View>
          ) : (
            <View style={styles.startupsGrid}>
              {featuredStartups
                .filter(startup => startup && startup.id && startup.name)
                .map((startup, index) => {
                  const isLogoUrl = startup.logo && 
                    typeof startup.logo === 'string' && (
                      startup.logo.indexOf('file://') === 0 ||
                      startup.logo.indexOf('http://') === 0 ||
                      startup.logo.indexOf('https://') === 0
                    );

                  return (
                    <Animated.View
                      key={startup.id}
                      style={{
                        opacity: fadeAnim,
                        transform: [{
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, index * 5],
                          })
                        }]
                      }}
                    >
                      <TouchableOpacity
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
                          {isLogoUrl ? (
                            <Image
                              source={{ uri: startup.logo }}
                              style={styles.startupLogoImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.startupLogoText}>{startup.logo || '🏪'}</Text>
                          )}
                        </View>
                        <View style={styles.startupContent}>
                          <Text style={styles.startupName} numberOfLines={1}>
                            {startup.name}
                          </Text>
                          <View style={styles.startupCategoryBadge}>
                            <Text style={styles.startupCategoryText}>{startup.category}</Text>
                          </View>
                          <View style={styles.startupStats}>
                            <View style={styles.startupStatItem}>
                              <Text style={styles.startupStatIcon}>⭐</Text>
                              <Text style={styles.startupStatText}>{startup.rating || '5.0'}</Text>
                            </View>
                            <View style={styles.startupStatItem}>
                              <Text style={styles.startupStatIcon}>📦</Text>
                              <Text style={styles.startupStatText}>{startup.products || 0}</Text>
                            </View>
                          </View>
                        </View>
                        {startup.verified && (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedIcon}>✓</Text>
                          </View>
                        )}
                        <View style={styles.startupViewButton}>
                          <Text style={styles.startupViewButtonText}>→</Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <LinearGradient
            colors={['transparent', 'rgba(22, 117, 212, 0.05)']}
            style={styles.footerGradient}
          >
            <Text style={styles.footerText}>Solution digitale by BDL Studio</Text>
            <Text style={styles.footerVersion}>v2.0.0 • PipoMarket</Text>
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scrollView: { flex: 1 },
  
  heroBanner: { 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 40, 
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: { gap: 12 },
  heroHeader: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2000,
    elevation: 2000,
  },
  heroIconText: { fontSize: 24 },
  heroLogo: { width: 60, height: 60 },
  heroActions: { flexDirection: 'row', gap: 12, zIndex: 3000, elevation: 3000, pointerEvents: 'auto' },
  heroIconButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 3000,
    elevation: 3000,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroGreeting: { fontSize: 16, color: 'rgba(255, 255, 255, 0.95)', fontWeight: '500' },
  heroTitle: { fontSize: 36, fontWeight: 'bold', color: 'white', marginTop: 4, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.9)', marginTop: 4 },
  heroSearchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 20, 
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginTop: 16,
    shadowColor: '#0B52CB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  searchIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 117, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroSearchIcon: { fontSize: 20 },
  heroSearchText: { fontSize: 15, color: '#999', flex: 1 },
  searchMicButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchMicIcon: { fontSize: 18 },
  heroCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(39, 206, 252, 0.15)',
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroCircle3: {
    position: 'absolute',
    top: 100,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(39, 206, 252, 0.1)',
  },
  
  quickActionsContainer: { 
    paddingHorizontal: 20, 
    marginTop: -24,
    marginBottom: 20,
  },
  quickActionMain: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0B52CB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  quickActionMainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  quickActionMainIcon: { fontSize: 40, marginRight: 16 },
  quickActionMainContent: { flex: 1 },
  quickActionMainTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  quickActionMainSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' },
  quickActionMainArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionMainArrowText: { fontSize: 20, color: 'white', fontWeight: 'bold' },
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  quickActionSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionGradient: { padding: 16, alignItems: 'center' },
  quickActionIcon: { fontSize: 28, marginBottom: 8 },
  quickActionText: { fontSize: 12, fontWeight: '600', color: 'white' },
  
  loyaltyCard: { 
    marginHorizontal: 20, 
    marginBottom: 24, 
    borderRadius: 24, 
    overflow: 'hidden', 
    shadowColor: '#0B52CB', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 20, 
    elevation: 12 
  },
  loyaltyGradient: { padding: 24, position: 'relative', overflow: 'hidden' },
  loyaltyContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loyaltyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  loyaltyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  loyaltyIcon: { fontSize: 32 },
  loyaltyTitle: { fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  loyaltyLevel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.95)', marginBottom: 8 },
  loyaltyProgress: {
    width: 120,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loyaltyProgressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  loyaltyRight: { alignItems: 'flex-end' },
  loyaltyPoints: { fontSize: 36, fontWeight: 'bold', color: 'white' },
  loyaltyPointsLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.95)', marginBottom: 8 },
  loyaltyArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loyaltyArrowText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  loyaltyCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(39, 206, 252, 0.2)',
  },
  loyaltyCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  sectionCount: { fontSize: 13, color: '#999', fontWeight: '500' },
  seeAllButton: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  refreshButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 117, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: { fontSize: 20 },
  
  premiumBadge: { 
    backgroundColor: '#FFD700', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#000' },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timerIcon: { fontSize: 12 },
  timerText: { fontSize: 11, fontWeight: 'bold', color: 'white' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: { fontSize: 10, fontWeight: 'bold', color: 'white', letterSpacing: 0.5 },
  
  premiumScroll: { paddingRight: 20, gap: 16 },
  premiumCard: { 
    width: 160, 
    backgroundColor: 'white', 
    borderRadius: 24, 
    padding: 16, 
    shadowColor: '#0B52CB', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 16, 
    elevation: 8, 
    position: 'relative' 
  },
  premiumRank: { 
    position: 'absolute', 
    top: -8, 
    right: 12, 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumRankText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  premiumLogoContainer: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: '#F0F4F8', 
    justifyContent: 'center', 
    alignItems: 'center', 
    alignSelf: 'center', 
    marginBottom: 12, 
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(22, 117, 212, 0.15)',
  },
  premiumLogo: { fontSize: 36 },
  premiumLogoImage: { width: '100%', height: '100%', borderRadius: 36 },
  premiumName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 },
  premiumCategoryBadge: {
    backgroundColor: 'rgba(22, 117, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 12,
  },
  premiumCategoryText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  premiumStats: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  premiumStatIcon: { fontSize: 14 },
  premiumStatText: { fontSize: 13, fontWeight: '600', color: '#666' },
  premiumStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  premiumViewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumViewButtonText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  
  categoriesScroll: { paddingRight: 20, gap: 16 },
  categoryCard: { 
    alignItems: 'center', 
    gap: 10,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#0B52CB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minWidth: 100,
  },
  categoryIconContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: 'rgba(22, 117, 212, 0.08)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  categoryEmoji: { fontSize: 32 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#333' },
  categoryArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(22, 117, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryArrowText: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold' },
  
  loadingProducts: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  productsScroll: { paddingRight: 20, gap: 16 },
  productCard: { 
    width: 160, 
    backgroundColor: 'white', 
    borderRadius: 20, 
    overflow: 'hidden', 
    shadowColor: '#0B52CB', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 5 
  },
  productImageContainer: { width: '100%', height: 160, position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  productImageEmoji: { fontSize: 56 },
  stockBadge: { 
    position: 'absolute', 
    top: 12, 
    left: 12, 
    backgroundColor: '#FF3B30', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockBadgeIcon: { fontSize: 12 },
  stockBadgeText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  productFavoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productFavoriteIcon: { fontSize: 18 },
  productInfo: { padding: 16 },
  productName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, lineHeight: 18, minHeight: 36 },
  productPriceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  productCurrency: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginLeft: 4 },
  productAddButton: {
    backgroundColor: 'rgba(22, 117, 212, 0.1)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  productAddButtonText: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary },
  
  startupsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  startupCard: { 
    width: (width - 52) / 2, 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 16, 
    shadowColor: '#0B52CB', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 5, 
    position: 'relative' 
  },
  startupLogoContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: '#F0F4F8', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12, 
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(22, 117, 212, 0.1)',
  },
  startupLogoImage: { width: '100%', height: '100%', borderRadius: 32 },
  startupLogoText: { fontSize: 32 },
  startupContent: { gap: 6 },
  startupName: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  startupCategoryBadge: {
    backgroundColor: 'rgba(22, 117, 212, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  startupCategoryText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  startupStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  startupStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  startupStatIcon: { fontSize: 12 },
  startupStatText: { fontSize: 12, color: '#666', fontWeight: '600' },
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
    elevation: 3,
  },
  verifiedIcon: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  startupViewButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startupViewButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingHorizontal: 20 },
  
  footer: {
    marginTop: 20,
  },
  footerGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: { fontSize: 14, color: '#666', marginBottom: 4 },
  footerVersion: { fontSize: 12, color: '#999' },
});