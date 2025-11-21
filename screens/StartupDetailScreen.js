// screens/StartupDetailScreen.js - VERSION PREMIUM AMÉLIORÉE
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BannerAd from '../components/BannerAd';
import { auth, db } from '../config/firebase';

const { width } = Dimensions.get('window');

export default function StartupDetailScreen({ route, navigation, addToCart }) {
  const { startupId } = route.params;
  
  const [startup, setStartup] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('products');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scrollY] = useState(new Animated.Value(0));

  useEffect(() => {
    loadStartupDetails();
  }, []);

  const loadStartupDetails = async () => {
    try {
      const startupDoc = await getDoc(doc(db, 'startups', startupId));
      if (startupDoc.exists()) {
        setStartup({ id: startupDoc.id, ...startupDoc.data() });
      }

      const q = query(
        collection(db, 'products'),
        where('startupId', '==', startupId)
      );
      const querySnapshot = await getDocs(q);
      const productsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.name) {
          productsData.push({
            id: doc.id,
            ...data,
            image: data.image || '📦',
            price: typeof data.price === 'number' ? data.price : 0,
          });
        }
      });

      setProducts(productsData);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Erreur chargement détails startup:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleContact = () => {
    if (!auth.currentUser) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour contacter une startup',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    navigation.navigate('Chat', {
      startupId: startupId,
      startupName: startup.name,
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ${startup.name} sur PipoMarket ! 🚀\n\n${startup.description || 'Une startup camerounaise exceptionnelle'}\n\nTéléchargez PipoMarket pour voir leurs produits.`,
        title: startup.name,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleAddToCart = (product) => {
    if (addToCart) {
      addToCart(product);
      Alert.alert('✅ Ajouté', `${product.name} ajouté au panier`);
    }
  };

  const getStats = () => {
    const avgPrice = products.length > 0
      ? Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length)
      : 0;
    const availableCount = products.filter(p => p.available !== false).length;
    return { avgPrice, availableCount };
  };

  const stats = getStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!startup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Startup introuvable</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isLogoUrl = startup.logo && 
    typeof startup.logo === 'string' && (
      startup.logo.indexOf('file://') === 0 ||
      startup.logo.indexOf('http://') === 0 ||
      startup.logo.indexOf('https://') === 0
    );

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* HERO SECTION */}
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <SafeAreaView edges={['top']}>
            {/* Header Actions */}
            <View style={styles.heroHeader}>
              <BannerAd placement="category_banner" category={startup.category} />
              <TouchableOpacity style={styles.heroButton} onPress={() => navigation.goBack()}>
                <Text style={styles.heroButtonText}>←</Text>
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroButton} onPress={handleShare}>
                  <Text style={styles.heroButtonText}>↗</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logo & Name */}
            <View style={styles.heroContent}>
              <View style={styles.logoContainer}>
                {isLogoUrl ? (
                  <Image source={{ uri: startup.logo }} style={styles.logoImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.logoText}>{startup.logo || '🏪'}</Text>
                )}
                {startup.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                  </View>
                )}
              </View>

              <Text style={styles.startupName}>{startup.name}</Text>

              <View style={styles.badgesRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{startup.category}</Text>
                </View>
                {startup.subscriptionBadge && (
                  <View style={styles.subscriptionBadge}>
                    <Text style={styles.subscriptionBadgeText}>{startup.subscriptionBadge}</Text>
                  </View>
                )}
              </View>

              {startup.description && (
                <Text style={styles.heroDescription} numberOfLines={3}>
                  {startup.description}
                </Text>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* STATS CARDS */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{startup.rating || '5.0'}</Text>
              <Text style={styles.statLabel}>Note</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Produits</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{stats.availableCount}</Text>
              <Text style={styles.statLabel}>Disponibles</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>{stats.avgPrice.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Prix moy.</Text>
            </View>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContact}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonIcon}>💬</Text>
              <Text style={styles.primaryButtonText}>Contacter</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
            <Text style={styles.secondaryButtonIcon}>↗</Text>
            <Text style={styles.secondaryButtonText}>Partager</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'products' && styles.tabActive]}
            onPress={() => setSelectedTab('products')}
          >
            <Text style={[styles.tabText, selectedTab === 'products' && styles.tabTextActive]}>
              📦 Produits
            </Text>
            {selectedTab === 'products' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'info' && styles.tabActive]}
            onPress={() => setSelectedTab('info')}
          >
            <Text style={[styles.tabText, selectedTab === 'info' && styles.tabTextActive]}>
              ℹ️ Infos
            </Text>
            {selectedTab === 'info' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {selectedTab === 'products' ? (
            <View style={styles.productsSection}>
              {products.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyTitle}>Aucun produit</Text>
                  <Text style={styles.emptyText}>
                    Cette startup n'a pas encore ajouté de produits
                  </Text>
                </View>
              ) : (
                <View style={styles.productsGrid}>
                  {products.map((product) => {
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
                        onPress={() => navigation.navigate('ProductDetail', {
                          productId: product.id,
                          startupName: startup.name
                        })}
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
                              <Text style={styles.productEmoji}>{product.image || '📦'}</Text>
                            </View>
                          )}

                          {product.stock < 5 && product.stock > 0 && (
                            <View style={styles.stockBadge}>
                              <Text style={styles.stockBadgeText}>🔥 {product.stock} restants</Text>
                            </View>
                          )}

                          {!product.available && (
                            <View style={styles.unavailableBadge}>
                              <Text style={styles.unavailableBadgeText}>Indisponible</Text>
                            </View>
                          )}

                          {/* Quick Add Button */}
                          {product.available !== false && addToCart && (
                            <TouchableOpacity
                              style={styles.quickAddButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                            >
                              <Text style={styles.quickAddButtonText}>+</Text>
                            </TouchableOpacity>
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
                </View>
              )}
            </View>
          ) : (
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📍 Catégorie</Text>
                  <Text style={styles.infoValue}>{startup.category}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>⭐ Note moyenne</Text>
                  <Text style={styles.infoValue}>{startup.rating || '5.0'}/5</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📦 Produits</Text>
                  <Text style={styles.infoValue}>{products.length}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>✅ Vérifié</Text>
                  <Text style={styles.infoValue}>{startup.verified ? 'Oui' : 'Non'}</Text>
                </View>
                {startup.deliveryTime && (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>🚚 Livraison</Text>
                      <Text style={styles.infoValue}>{startup.deliveryTime}</Text>
                    </View>
                  </>
                )}
              </View>

              {startup.description && (
                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionTitle}>À propos</Text>
                  <Text style={styles.descriptionText}>{startup.description}</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Hero Section
  heroSection: {
    paddingBottom: 40,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  logoText: {
    fontSize: 60,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  verifiedIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startupName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subscriptionBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Stats Section
  statsSection: {
    marginTop: -30,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },

  // Actions Section
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 6,
    color: '#667eea',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#667eea15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#667eea',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 24,
    height: 3,
    backgroundColor: '#667eea',
    borderRadius: 2,
  },

  // Products Section
  productsSection: {
    paddingHorizontal: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 52) / 2,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
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
  productEmoji: {
    fontSize: 64,
  },
  stockBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stockBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickAddButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  quickAddButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -2,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
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
  },

  // Info Section
  infoSection: {
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});