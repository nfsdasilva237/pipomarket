// screens/HomeScreen.js - ✅ VERSION ULTRA MODERNE
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import BannerAd from '../components/BannerAd';
import RecommendationsSection from '../components/RecommendationsSection';
import { auth, db } from '../config/firebase';
import { getUserLevel } from '../config/loyaltyConfig';
import categoryService from '../utils/categoryService';
import { getCurrentStartupOfMonth } from '../utils/startupOfMonthService';

const { width } = Dimensions.get('window');

// Couleurs PipoMarket
const COLORS = {
  primary: '#1675D4',
  secondary: '#27CEFC',
  accent: '#0B52CB',
  dark: '#0A1628',
  light: '#F8FAFC',
  gold: '#FFD700',
  gradient: ['#0B52CB', '#1675D4', '#27CEFC'],
};

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // États
  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [premiumStartups, setPremiumStartups] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Tout', icon: '🛍️' }]);
  const [startupOfMonth, setStartupOfMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState({ name: 'Bronze', icon: '🥉', color: '#CD7F32' });

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // Chargement des données
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const firestoreCategories = await categoryService.getCategoriesWithFallback();
      setCategories([
        { id: 'all', name: 'Tout', icon: '🛍️' },
        ...firestoreCategories.map(cat => ({
          id: cat.id, name: cat.name, icon: cat.icon || '📦',
        }))
      ]);
    } catch (error) {
      console.error('Erreur catégories:', error);
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
      setPremiumStartups(premiumSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), isPremium: true })));
    } catch (error) {
      console.error('Erreur premium:', error);
    }
  };

  const loadStartupOfMonth = async () => {
    try {
      const startup = await getCurrentStartupOfMonth();
      setStartupOfMonth(startup);
    } catch (error) {
      console.error('Erreur startup du mois:', error);
    }
  };

  const loadStartups = async () => {
    try {
      const q = query(collection(db, 'startups'), limit(6));
      const querySnapshot = await getDocs(q);
      const startupsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data?.name) {
          startupsData.push({
            id: doc.id, ...data,
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
      console.error('Erreur startups:', error);
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
      console.error('Erreur points:', error);
    }
  };

  const loadRandomProducts = async () => {
    try {
      const q = query(collection(db, 'products'), where('available', '==', true), limit(20));
      const querySnapshot = await getDocs(q);
      const allProducts = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data?.name && data.price !== undefined) {
          allProducts.push({
            id: doc.id, ...data,
            image: data.image || '📦',
            price: typeof data.price === 'number' ? data.price : 0,
            stock: typeof data.stock === 'number' ? data.stock : 0,
            isBoosted: data.boost?.active === true,
            boostBadge: data.boost?.badge || null,
          });
        }
      });

      const boosted = allProducts.filter(p => p.isBoosted);
      const normal = allProducts.filter(p => !p.isBoosted);
      const today = new Date().toDateString();
      const shuffled = shuffleWithSeed(normal, today);
      setRandomProducts([...boosted, ...shuffled].slice(0, 8));
    } catch (error) {
      console.error('Erreur produits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const shuffleWithSeed = (array, seed) => {
    const arr = [...array];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    const random = () => { hash = (hash * 9301 + 49297) % 233280; return hash / 233280; };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const loadAll = () => {
    loadCategories();
    loadPremiumStartups();
    loadStartupOfMonth();
    loadStartups();
    loadUserPoints();
    loadRandomProducts();
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadAll);
    return unsubscribe;
  }, [navigation]);

  const handleCategoryPress = (category) => {
    if (category.id === 'all') {
      navigation.navigate('StartupsTab', { screen: 'Startups' });
    } else {
      navigation.navigate('StartupsTab', { screen: 'Startups', params: { filterCategory: category.name } });
    }
  };

  const isImageUrl = (img) => img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('file://'));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom + 90 : 90 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ═══════════════════ HERO HEADER ═══════════════════ */}
        <LinearGradient colors={COLORS.gradient} style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}>
          {/* Logo & Actions */}
          <View style={styles.heroTop}>
            <View style={styles.heroLogoContainer}>
              <Image source={require('../assets/logo.png')} style={styles.heroLogo} resizeMode="contain" />
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroActionBtn} onPress={() => navigation.navigate('NotificationsTab')}>
                <Text style={styles.heroActionIcon}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroActionBtn} onPress={() => navigation.navigate('ProfileTab')}>
                <Text style={styles.heroActionIcon}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.heroGreeting}>{getGreeting()} 👋</Text>
            <Text style={styles.heroTitle}>PipoMarket</Text>
            <Text style={styles.heroSubtitle}>La marketplace des startups camerounaises</Text>
          </Animated.View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('IntelligentSearch', { allProducts: randomProducts })}
            activeOpacity={0.9}
          >
            <View style={styles.searchIconBox}>
              <Text style={styles.searchIcon}>🔍</Text>
            </View>
            <Text style={styles.searchText}>Rechercher produits, startups...</Text>
            <View style={styles.searchMic}>
              <Text style={styles.searchMicIcon}>🎤</Text>
            </View>
          </TouchableOpacity>

          {/* Decorative circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
        </LinearGradient>

        {/* ═══════════════════ QUICK ACTIONS ═══════════════════ */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionMain} onPress={() => navigation.navigate('PipBot')} activeOpacity={0.9}>
            <LinearGradient colors={[COLORS.accent, COLORS.primary]} style={styles.quickActionMainGradient}>
              <Text style={styles.quickActionMainIcon}>🤖</Text>
              <View style={styles.quickActionMainText}>
                <Text style={styles.quickActionMainTitle}>PipBot Assistant</Text>
                <Text style={styles.quickActionMainSub}>IA disponible 24/7</Text>
              </View>
              <View style={styles.quickActionMainArrow}>
                <Text style={styles.quickActionMainArrowIcon}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.quickActionsRow}>
            {[
              { icon: '⭐', label: 'Fidélité', colors: ['#FFD700', '#FFA500'], screen: 'Loyalty' },
              { icon: '📦', label: 'Commandes', colors: [COLORS.secondary, COLORS.primary], screen: 'Orders' },
              { icon: '❤️', label: 'Favoris', colors: ['#FF6B6B', '#EE5A5A'], screen: 'Favorites' },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={styles.quickActionSmall} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.8}>
                <LinearGradient colors={item.colors} style={styles.quickActionSmallGradient}>
                  <Text style={styles.quickActionSmallIcon}>{item.icon}</Text>
                  <Text style={styles.quickActionSmallLabel}>{item.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══════════════════ BANNIÈRE PUB ═══════════════════ */}
        <View style={styles.section}>
          <BannerAd placement="home_banner" />
        </View>

        {/* ═══════════════════ CARTE FIDÉLITÉ ═══════════════════ */}
        {auth.currentUser && (
          <TouchableOpacity style={styles.loyaltyCard} onPress={() => navigation.navigate('Loyalty')} activeOpacity={0.9}>
            <LinearGradient colors={[userLevel.color || COLORS.primary, COLORS.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.loyaltyGradient}>
              <View style={styles.loyaltyLeft}>
                <View style={styles.loyaltyIconBox}>
                  <Text style={styles.loyaltyIcon}>{userLevel.icon}</Text>
                </View>
                <View>
                  <Text style={styles.loyaltyTitle}>Programme Fidélité</Text>
                  <Text style={styles.loyaltyLevel}>Niveau {userLevel.name}</Text>
                </View>
              </View>
              <View style={styles.loyaltyRight}>
                <Text style={styles.loyaltyPoints}>{userPoints.toLocaleString()}</Text>
                <Text style={styles.loyaltyPointsLabel}>points</Text>
              </View>
              <View style={styles.loyaltyCircle} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ═══════════════════ STARTUP DU MOIS ═══════════════════ */}
        {startupOfMonth && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionBadge}>🏆 STARTUP DU MOIS</Text>
              <Text style={styles.sectionTitle}>Notre coup de cœur</Text>
            </View>
            <TouchableOpacity
              style={styles.startupMonthCard}
              onPress={() => navigation.navigate('StartupDetail', { startupId: startupOfMonth.startupId })}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.startupMonthGradient}>
                <View style={styles.startupMonthLogoBox}>
                  <Text style={styles.startupMonthLogo}>{startupOfMonth.startupLogo || '🏪'}</Text>
                </View>
                <View style={styles.startupMonthInfo}>
                  <Text style={styles.startupMonthName}>{startupOfMonth.startupName}</Text>
                  <Text style={styles.startupMonthDesc}>Excellence et innovation ce mois-ci</Text>
                  <View style={styles.startupMonthBtn}>
                    <Text style={styles.startupMonthBtnText}>Découvrir →</Text>
                  </View>
                </View>
                <Text style={styles.startupMonthStar}>⭐</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════ CATÉGORIES ═══════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🏷️ Catégories</Text>
            <Text style={styles.sectionCount}>{categories.length - 1}</Text>
          </View>
          {loadingCategories ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.categoryCard} onPress={() => handleCategoryPress(cat)} activeOpacity={0.8}>
                  <View style={styles.categoryIconBox}>
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ═══════════════════ RECOMMANDATIONS ═══════════════════ */}
        {auth.currentUser && (
          <RecommendationsSection
            type="personalized"
            userId={auth.currentUser.uid}
            onProductPress={(product) => navigation.navigate('ProductDetail', { productId: product.id, productName: product.name })}
          />
        )}

        {/* ═══════════════════ PRODUITS DU JOUR ═══════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>✨ Découvertes du jour</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <TouchableOpacity onPress={loadRandomProducts} style={styles.refreshBtn}>
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : randomProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Aucun produit disponible</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScroll} snapToInterval={172} decelerationRate="fast">
              {randomProducts.filter(p => p?.id).map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => navigation.navigate('ProductDetail', { productId: product.id, productName: product.name })}
                  activeOpacity={0.9}
                >
                  {product.isBoosted && (
                    <View style={styles.boostBadge}>
                      <Text style={styles.boostText}>{product.boostBadge || '🚀'}</Text>
                    </View>
                  )}
                  <View style={styles.productImageBox}>
                    {isImageUrl(product.image) ? (
                      <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
                    ) : (
                      <Text style={styles.productEmoji}>{product.image}</Text>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.productPrice}>{product.price?.toLocaleString()} FCFA</Text>
                    {product.stock < 5 && product.stock > 0 && (
                      <Text style={styles.productStock}>🔥 {product.stock} restants</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ═══════════════════ STARTUPS PREMIUM ═══════════════════ */}
        {premiumStartups.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>💎 Premium</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>TOP 3</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('StartupsTab', { screen: 'Startups' })}>
                <Text style={styles.seeAll}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.premiumScroll}>
              {premiumStartups.map((startup, index) => {
                const rankColors = [['#FFD700', '#FFA500'], ['#C0C0C0', '#A0A0A0'], ['#CD7F32', '#8B4513']];
                return (
                  <TouchableOpacity
                    key={startup.id}
                    style={styles.premiumCard}
                    onPress={() => navigation.navigate('StartupDetail', { startupId: startup.id })}
                    activeOpacity={0.9}
                  >
                    <LinearGradient colors={rankColors[index] || rankColors[2]} style={styles.premiumRank}>
                      <Text style={styles.premiumRankText}>{index === 0 ? '👑' : `#${index + 1}`}</Text>
                    </LinearGradient>
                    <View style={styles.premiumLogoBox}>
                      {isImageUrl(startup.logo) ? (
                        <Image source={{ uri: startup.logo }} style={styles.premiumLogoImg} resizeMode="cover" />
                      ) : (
                        <Text style={styles.premiumLogoEmoji}>{startup.logo || '🏪'}</Text>
                      )}
                    </View>
                    <Text style={styles.premiumName} numberOfLines={1}>{startup.name}</Text>
                    <Text style={styles.premiumCategory}>{startup.category}</Text>
                    <View style={styles.premiumStats}>
                      <Text style={styles.premiumStat}>⭐ {startup.rating || '5.0'}</Text>
                      <Text style={styles.premiumStat}>📦 {startup.products || 0}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ═══════════════════ STARTUPS EN VEDETTE ═══════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🔥 En vedette</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StartupsTab', { screen: 'Startups' })}>
              <Text style={styles.seeAll}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : featuredStartups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏪</Text>
              <Text style={styles.emptyText}>Aucune startup disponible</Text>
            </View>
          ) : (
            <View style={styles.startupsGrid}>
              {featuredStartups.filter(s => s?.id).map((startup) => (
                <TouchableOpacity
                  key={startup.id}
                  style={styles.startupCard}
                  onPress={() => navigation.navigate('StartupDetail', { startupId: startup.id, startupName: startup.name })}
                  activeOpacity={0.9}
                >
                  <View style={styles.startupLogoBox}>
                    {isImageUrl(startup.logo) ? (
                      <Image source={{ uri: startup.logo }} style={styles.startupLogoImg} resizeMode="cover" />
                    ) : (
                      <Text style={styles.startupLogoEmoji}>{startup.logo}</Text>
                    )}
                  </View>
                  <Text style={styles.startupName} numberOfLines={1}>{startup.name}</Text>
                  <View style={styles.startupCategoryBadge}>
                    <Text style={styles.startupCategoryText}>{startup.category}</Text>
                  </View>
                  <View style={styles.startupStatsRow}>
                    <Text style={styles.startupStat}>⭐ {startup.rating}</Text>
                    <Text style={styles.startupStat}>📦 {startup.products}</Text>
                  </View>
                  {startup.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedIcon}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ═══════════════════ FOOTER ═══════════════════ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Solution digitale by BDL Studio</Text>
          <Text style={styles.footerVersion}>v2.0 • PipoMarket</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ═══════════════════ STYLES ═══════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  scrollView: { flex: 1 },

  // Hero Header
  heroHeader: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroLogoContainer: { width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  heroLogo: { width: 36, height: 36 },
  heroActions: { flexDirection: 'row', gap: 12 },
  heroActionBtn: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  heroActionIcon: { fontSize: 20 },
  heroGreeting: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  heroTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  searchIconBox: { width: 40, height: 40, backgroundColor: 'rgba(22,117,212,0.1)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchIcon: { fontSize: 18 },
  searchText: { flex: 1, fontSize: 15, color: '#999', marginLeft: 12 },
  searchMic: { width: 40, height: 40, backgroundColor: '#F0F4F8', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  searchMicIcon: { fontSize: 16 },
  heroCircle1: { position: 'absolute', top: -80, right: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroCircle2: { position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' },

  // Quick Actions
  quickActionsContainer: { paddingHorizontal: 20, marginTop: -16 },
  quickActionMain: { borderRadius: 20, overflow: 'hidden', marginBottom: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  quickActionMainGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  quickActionMainIcon: { fontSize: 36, marginRight: 16 },
  quickActionMainText: { flex: 1 },
  quickActionMainTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  quickActionMainSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  quickActionMainArrow: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  quickActionMainArrowIcon: { fontSize: 20, color: 'white', fontWeight: 'bold' },
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickActionSmall: { flex: 1, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  quickActionSmallGradient: { alignItems: 'center', paddingVertical: 16 },
  quickActionSmallIcon: { fontSize: 28, marginBottom: 6 },
  quickActionSmallLabel: { fontSize: 12, fontWeight: '600', color: 'white' },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionBadge: { fontSize: 12, fontWeight: 'bold', color: COLORS.gold, letterSpacing: 1, marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  sectionCount: { fontSize: 14, color: '#999', fontWeight: '600', backgroundColor: '#F0F4F8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  refreshBtn: { width: 40, height: 40, backgroundColor: 'rgba(22,117,212,0.1)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  refreshIcon: { fontSize: 18 },

  // Badges
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  liveText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  premiumBadge: { backgroundColor: COLORS.gold, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  premiumBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#000' },

  // Loyalty Card
  loyaltyCard: { marginHorizontal: 20, marginTop: 24, borderRadius: 24, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  loyaltyGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  loyaltyLeft: { flexDirection: 'row', alignItems: 'center' },
  loyaltyIconBox: { width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  loyaltyIcon: { fontSize: 32 },
  loyaltyTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  loyaltyLevel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  loyaltyRight: { alignItems: 'flex-end' },
  loyaltyPoints: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  loyaltyPointsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  loyaltyCircle: { position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Startup du Mois
  startupMonthCard: { borderRadius: 24, overflow: 'hidden', shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  startupMonthGradient: { padding: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  startupMonthLogoBox: { width: 72, height: 72, backgroundColor: 'white', borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  startupMonthLogo: { fontSize: 36 },
  startupMonthInfo: { flex: 1 },
  startupMonthName: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  startupMonthDesc: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
  startupMonthBtn: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  startupMonthBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFA500' },
  startupMonthStar: { position: 'absolute', top: -10, right: -10, fontSize: 80, opacity: 0.15 },

  // Categories
  categoriesScroll: { paddingRight: 20, gap: 12 },
  categoryCard: { alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 20, minWidth: 90, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  categoryIconBox: { width: 56, height: 56, backgroundColor: 'rgba(22,117,212,0.08)', borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  categoryIcon: { fontSize: 28 },
  categoryName: { fontSize: 13, fontWeight: '600', color: COLORS.dark },

  // Products
  productsScroll: { paddingRight: 20, gap: 12 },
  productCard: { width: 160, backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  boostBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#FF9500', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, zIndex: 10 },
  boostText: { fontSize: 11, fontWeight: 'bold', color: 'white' },
  productImageBox: { width: '100%', height: 140, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: '100%' },
  productEmoji: { fontSize: 56 },
  productInfo: { padding: 14 },
  productName: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: 8, minHeight: 36 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  productStock: { fontSize: 11, color: '#FF3B30', marginTop: 6 },

  // Premium Cards
  premiumScroll: { paddingRight: 20, gap: 16 },
  premiumCard: { width: 160, backgroundColor: 'white', borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  premiumRank: { position: 'absolute', top: -8, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  premiumRankText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  premiumLogoBox: { width: 72, height: 72, backgroundColor: '#F0F4F8', borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 12, overflow: 'hidden' },
  premiumLogoImg: { width: '100%', height: '100%' },
  premiumLogoEmoji: { fontSize: 36 },
  premiumName: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, textAlign: 'center', marginBottom: 4 },
  premiumCategory: { fontSize: 12, color: '#666', marginBottom: 10 },
  premiumStats: { flexDirection: 'row', gap: 12 },
  premiumStat: { fontSize: 12, color: '#666' },

  // Startups Grid
  startupsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  startupCard: { width: (width - 52) / 2, backgroundColor: 'white', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  startupLogoBox: { width: 56, height: 56, backgroundColor: '#F0F4F8', borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  startupLogoImg: { width: '100%', height: '100%' },
  startupLogoEmoji: { fontSize: 28 },
  startupName: { fontSize: 15, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
  startupCategoryBadge: { backgroundColor: 'rgba(22,117,212,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10 },
  startupCategoryText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  startupStatsRow: { flexDirection: 'row', gap: 12 },
  startupStat: { fontSize: 12, color: '#666' },
  verifiedBadge: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, backgroundColor: '#34C759', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  verifiedIcon: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'white', borderRadius: 20 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#666' },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 32, marginTop: 20 },
  footerText: { fontSize: 14, color: '#999' },
  footerVersion: { fontSize: 12, color: '#CCC', marginTop: 4 },
});
