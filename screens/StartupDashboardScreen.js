// screens/StartupDashboardScreen.js - ✅ PHASE 1: AVEC BARRES PROGRESSION ABONNEMENT - DESIGN PREMIUM
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { notificationService } from '../utils/notificationService';
import subscriptionService from '../utils/subscriptionService';
const { width } = Dimensions.get('window');

export default function StartupDashboardScreen({ route, navigation }) {
  const { startupId: paramStartupId } = route.params || {};
  
  const [startupId, setStartupId] = useState(paramStartupId);
  const [startup, setStartup] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  // ✅ PHASE 1: Stats abonnement
  const [subscriptionStats, setSubscriptionStats] = useState(null);
  // Filtre pour les commandes
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboard();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDashboard = async () => {
    try {
      let finalStartupId = paramStartupId;

      if (!finalStartupId) {
        const q = query(
          collection(db, 'startups'),
          where('ownerId', '==', auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert(
            'Aucune startup',
            'Vous n\'avez pas encore de startup',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          setLoading(false);
          return;
        }

        const startupDoc = querySnapshot.docs[0];
        finalStartupId = startupDoc.id;
        setStartupId(finalStartupId);
      }

      // Charger startup
      const startupDoc = await getDoc(doc(db, 'startups', finalStartupId));

      if (!startupDoc.exists()) {
        Alert.alert('Erreur', 'Startup introuvable');
        setLoading(false);
        return;
      }

      setStartup({ id: startupDoc.id, ...startupDoc.data() });

      // Charger produits
      const productsQ = query(
        collection(db, 'products'),
        where('startupId', '==', finalStartupId)
      );
      const productsSnap = await getDocs(productsQ);
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Charger commandes - Avec gestion d'erreur pour permissions
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const allOrders = ordersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtrer les commandes de cette startup et trier en JavaScript
        const startupOrders = allOrders
          .filter(order =>
            order.items && order.items.some(item => item.startupId === finalStartupId)
          )
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA; // Plus récent en premier
          })
          .slice(0, 50); // Limiter à 50 commandes

        setOrders(startupOrders);
      } catch (ordersError) {
        console.log('⚠️ Impossible de charger les commandes (problème de permissions Firestore)');
        console.log('💡 Vous devez déployer les nouvelles règles Firestore pour voir les commandes');
        setOrders([]); // Continuer sans commandes pour que le reste fonctionne
      }

      // Charger codes promo
      const promoQ = query(
        collection(db, 'promoCodes'),
        where('startupId', '==', finalStartupId)
      );
      const promoSnap = await getDocs(promoQ);
      const promosData = promoSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPromoCodes(promosData);

      // ✅ PHASE 1: Charger stats abonnement - avec gestion d'erreur
      try {
        const statsResult = await subscriptionService.getSubscriptionStats(finalStartupId);
        if (statsResult.success) {
          setSubscriptionStats(statsResult.stats);
        }
      } catch (statsError) {
        console.log('⚠️ Impossible de charger les stats abonnement (problème de permissions Firestore)');
        setSubscriptionStats(null); // Continuer sans stats
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // CALCULS ANALYTICS
  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => {
      const startupItems = order.items?.filter(item => item.startupId === startupId) || [];
      const startupTotal = startupItems.reduce((itemSum, item) => 
        itemSum + (item.price * item.quantity), 0
      );
      return sum + startupTotal;
    }, 0);
  };

  const getRevenueToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= today;
    }).reduce((sum, order) => {
      const startupItems = order.items?.filter(item => item.startupId === startupId) || [];
      const startupTotal = startupItems.reduce((itemSum, item) => 
        itemSum + (item.price * item.quantity), 0
      );
      return sum + startupTotal;
    }, 0);
  };

  const getRevenueThisWeek = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= weekAgo;
    }).reduce((sum, order) => {
      const startupItems = order.items?.filter(item => item.startupId === startupId) || [];
      const startupTotal = startupItems.reduce((itemSum, item) => 
        itemSum + (item.price * item.quantity), 0
      );
      return sum + startupTotal;
    }, 0);
  };

  const getTopProducts = () => {
    const productSales = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.startupId === startupId) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.name,
              quantity: 0,
              revenue: 0
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.price * item.quantity;
        }
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stock < 5 && p.available).slice(0, 5);
  };

  const getAverageOrderValue = () => {
    if (orders.length === 0) return 0;
    return getTotalRevenue() / orders.length;
  };

  // Mise à jour du statut de commande
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Commande introuvable');
      }

      const orderData = orderDoc.data();
      const hasStartupItems = orderData.items?.some(item => item.startupId === startupId);
      
      if (!hasStartupItems) {
        throw new Error('Cette commande ne contient pas de produits de votre startup');
      }

      await updateDoc(orderRef, {
        status: newStatus,
        lastUpdateBy: {
          startupId,
          timestamp: new Date(),
          previousStatus: orderData.status
        }
      });

      const notifTitle = getStatusNotificationTitle(newStatus);
      const notifBody = getStatusNotificationBody(newStatus, startup.name);
      
      await notificationService.sendNotificationToUser(
        orderData.userId,
        notifTitle,
        notifBody,
        {
          type: 'order_status',
          orderId,
          status: newStatus
        }
      );

      loadDashboard();
      Alert.alert('Succès', 'Statut de la commande mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  const getStatusNotificationTitle = (status) => {
    const titles = {
      processing: '🔧 Commande en préparation',
      shipped: '🚚 Commande expédiée',
      delivered: '✅ Commande livrée'
    };
    return titles[status] || 'Mise à jour de votre commande';
  };

  const getStatusNotificationBody = (status, startupName) => {
    const bodies = {
      processing: `${startupName} prépare votre commande`,
      shipped: `Votre commande de ${startupName} est en route`,
      delivered: `Votre commande de ${startupName} a été livrée`
    };
    return bodies[status] || `Le statut de votre commande chez ${startupName} a été mis à jour`;
  };

  // Statistiques par statut
  const getOrderStats = () => {
    const stats = {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    };
    return stats;
  };

  // Filtrer les commandes
  const getFilteredOrders = () => {
    if (orderStatusFilter === 'all') {
      return orders;
    }
    return orders.filter(o => o.status === orderStatusFilter);
  };

  // RENDU
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement du dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!startup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Startup introuvable</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalRevenue = getTotalRevenue();
  const revenueToday = getRevenueToday();
  const revenueWeek = getRevenueThisWeek();
  const topProducts = getTopProducts();
  const lowStock = getLowStockProducts();
  const avgOrder = getAverageOrderValue();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER PREMIUM */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            🏢 {startup.name}
          </Text>
          <Text style={styles.headerSubtitle}>Dashboard Premium</Text>
        </View>
        <TouchableOpacity onPress={() => loadDashboard()} style={styles.headerButton}>
          <Text style={styles.refreshBtn}>🔄</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* TABS */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                📊 Vue d'ensemble
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'products' && styles.activeTab]}
              onPress={() => setActiveTab('products')}
            >
              <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
                📦 Produits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
              onPress={() => setActiveTab('orders')}
            >
              <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
                🛒 Commandes ({orders.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'promo' && styles.activeTab]}
              onPress={() => setActiveTab('promo')}
            >
              <Text style={[styles.tabText, activeTab === 'promo' && styles.activeTabText]}>
                🎁 Promos ({promoCodes.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <>
            {/* ✅ PHASE 1: UTILISATION ABONNEMENT */}
            {subscriptionStats && (
              <View style={styles.section}>
                <View style={styles.usageHeader}>
                  <Text style={styles.sectionTitle}>📊 Utilisation de votre plan</Text>
                  <TouchableOpacity
                    style={styles.planBadge}
                    onPress={() => navigation.navigate('ManageSubscription')}
                  >
                    <Text style={styles.planBadgeText}>
                      {subscriptionStats.planName || 'STARTER'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Produits */}
                <View style={styles.usageCard}>
                  <View style={styles.usageCardHeader}>
                    <Text style={styles.usageLabel}>📦 Produits</Text>
                    <Text style={styles.usageNumbers}>
                      {subscriptionStats.productsUsed} / {subscriptionStats.productsMax === 999999 ? '∞' : subscriptionStats.productsMax}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(subscriptionStats.productsPercentage, 100)}%`,
                          backgroundColor: subscriptionStats.productsPercentage > 80 ? '#FF3B30' : '#34C759',
                        },
                      ]}
                    />
                  </View>
                  {subscriptionStats.productsPercentage > 80 && subscriptionStats.productsMax !== 999999 && (
                    <Text style={styles.warningText}>⚠️ Bientôt à la limite !</Text>
                  )}
                </View>

                {/* Commandes */}
                <View style={styles.usageCard}>
                  <View style={styles.usageCardHeader}>
                    <Text style={styles.usageLabel}>🛒 Commandes ce mois</Text>
                    <Text style={styles.usageNumbers}>
                      {subscriptionStats.ordersUsed} / {subscriptionStats.ordersMax === 999999 ? '∞' : subscriptionStats.ordersMax}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(subscriptionStats.ordersPercentage, 100)}%`,
                          backgroundColor: subscriptionStats.ordersPercentage > 80 ? '#FF3B30' : '#34C759',
                        },
                      ]}
                    />
                  </View>
                  {subscriptionStats.ordersPercentage > 80 && subscriptionStats.ordersMax !== 999999 && (
                    <Text style={styles.warningText}>⚠️ Bientôt à la limite !</Text>
                  )}
                </View>

                {/* Bouton Améliorer */}
                {subscriptionStats.plan !== 'premium' && (
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate('ManageSubscription')}
                  >
                    <Text style={styles.upgradeButtonIcon}>⬆️</Text>
                    <Text style={styles.upgradeButtonText}>Améliorer mon plan</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* KPIs PRINCIPAUX PREMIUM */}
            <View style={styles.kpisContainer}>
              <LinearGradient
                colors={['#11998e', '#38ef7d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>💰</Text>
                <Text style={styles.kpiValue}>
                  {totalRevenue.toLocaleString('fr-FR')}
                </Text>
                <Text style={styles.kpiLabel}>Revenus totaux (FCFA)</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>🛒</Text>
                <Text style={styles.kpiValue}>{orders.length}</Text>
                <Text style={styles.kpiLabel}>Commandes</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>📦</Text>
                <Text style={styles.kpiValue}>{products.length}</Text>
                <Text style={styles.kpiLabel}>Produits</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>📊</Text>
                <Text style={styles.kpiValue}>
                  {avgOrder.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.kpiLabel}>Panier moyen (FCFA)</Text>
              </LinearGradient>
            </View>

            {/* REVENUS RÉCENTS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💸 Revenus récents</Text>
              <View style={styles.revenueCards}>
                <View style={styles.revenueCard}>
                  <Text style={styles.revenueLabel}>Aujourd'hui</Text>
                  <Text style={styles.revenueValue}>
                    {revenueToday.toLocaleString('fr-FR')} F
                  </Text>
                </View>
                <View style={styles.revenueCard}>
                  <Text style={styles.revenueLabel}>7 derniers jours</Text>
                  <Text style={styles.revenueValue}>
                    {revenueWeek.toLocaleString('fr-FR')} F
                  </Text>
                </View>
              </View>
            </View>

            {/* TOP PRODUITS */}
            {topProducts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏆 Top produits</Text>
                {topProducts.map((product, index) => (
                  <View key={product.id} style={styles.topProductCard}>
                    <View style={styles.topProductRank}>
                      <Text style={styles.topProductRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.topProductInfo}>
                      <Text style={styles.topProductName}>{product.name}</Text>
                      <Text style={styles.topProductStats}>
                        {product.quantity} ventes • {product.revenue.toLocaleString('fr-FR')} FCFA
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* STOCK FAIBLE */}
            {lowStock.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ Stock faible</Text>
                {lowStock.map(product => (
                  <View key={product.id} style={styles.alertCard}>
                    <Text style={styles.alertIcon}>📦</Text>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertName}>{product.name}</Text>
                      <Text style={styles.alertStock}>
                        Plus que {product.stock} en stock
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.alertButton}
                      onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
                    >
                      <Text style={styles.alertButtonText}>Réapprovisionner</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ACTIONS RAPIDES PREMIUM */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity onPress={() => navigation.navigate('AddProduct', { startupId })}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>+</Text>
                    <Text style={styles.actionText}>Ajouter Produit</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('CreatePromoCode')}>
                  <LinearGradient
                    colors={['#11998e', '#38ef7d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>🎁</Text>
                    <Text style={styles.actionText}>Code Promo</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('StartupMessages')}>
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionText}>Messages</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('StartupPaymentSettings', { startupId })}>
                  <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>💳</Text>
                    <Text style={styles.actionText}>Paiements</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ManageSubscription')}>
                  <LinearGradient
                    colors={['#fa709a', '#fee140']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>💎</Text>
                    <Text style={styles.actionText}>Mon Abonnement</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ONGLET PRODUITS */}
        {activeTab === 'products' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📦 Mes produits ({products.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddProduct', { startupId })}
              >
                <Text style={styles.addButtonText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>Aucun produit</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('AddProduct', { startupId })}
                >
                  <Text style={styles.emptyButtonText}>Ajouter un produit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              products.map(product => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImageContainer}>
                    {product.image && typeof product.image === 'string' && 
                     (product.image.startsWith('http') || product.image.startsWith('file')) ? (
                      <Image source={{ uri: product.image }} style={styles.productImage} />
                    ) : (
                      <Text style={styles.productEmoji}>{product.image || '📦'}</Text>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>
                      {product.price?.toLocaleString('fr-FR')} FCFA
                    </Text>
                    <Text style={styles.productStock}>
                      Stock: {product.stock} • {product.available ? '✅ Dispo' : '❌ Indispo'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
                  >
                    <Text style={styles.editButtonText}>✏️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ONGLET COMMANDES AMÉLIORÉ */}
        {activeTab === 'orders' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛒 Gestion des Commandes</Text>

            {/* Statistiques par statut */}
            {orders.length > 0 && (
              <View style={styles.orderStatsContainer}>
                <TouchableOpacity
                  style={[
                    styles.orderStatCard,
                    orderStatusFilter === 'all' && styles.orderStatCardActive
                  ]}
                  onPress={() => setOrderStatusFilter('all')}
                >
                  <LinearGradient
                    colors={orderStatusFilter === 'all' ? ['#667eea', '#764ba2'] : ['#f5f5f5', '#e0e0e0']}
                    style={styles.orderStatGradient}
                  >
                    <Text style={[styles.orderStatNumber, orderStatusFilter === 'all' && styles.orderStatTextActive]}>
                      {getOrderStats().all}
                    </Text>
                    <Text style={[styles.orderStatLabel, orderStatusFilter === 'all' && styles.orderStatTextActive]}>
                      Toutes
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orderStatCard,
                    orderStatusFilter === 'pending' && styles.orderStatCardActive
                  ]}
                  onPress={() => setOrderStatusFilter('pending')}
                >
                  <LinearGradient
                    colors={orderStatusFilter === 'pending' ? ['#FFA500', '#FF8C00'] : ['#f5f5f5', '#e0e0e0']}
                    style={styles.orderStatGradient}
                  >
                    <Text style={[styles.orderStatNumber, orderStatusFilter === 'pending' && styles.orderStatTextActive]}>
                      {getOrderStats().pending}
                    </Text>
                    <Text style={[styles.orderStatLabel, orderStatusFilter === 'pending' && styles.orderStatTextActive]}>
                      En attente
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orderStatCard,
                    orderStatusFilter === 'processing' && styles.orderStatCardActive
                  ]}
                  onPress={() => setOrderStatusFilter('processing')}
                >
                  <LinearGradient
                    colors={orderStatusFilter === 'processing' ? ['#4facfe', '#00f2fe'] : ['#f5f5f5', '#e0e0e0']}
                    style={styles.orderStatGradient}
                  >
                    <Text style={[styles.orderStatNumber, orderStatusFilter === 'processing' && styles.orderStatTextActive]}>
                      {getOrderStats().processing}
                    </Text>
                    <Text style={[styles.orderStatLabel, orderStatusFilter === 'processing' && styles.orderStatTextActive]}>
                      En préparation
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orderStatCard,
                    orderStatusFilter === 'shipped' && styles.orderStatCardActive
                  ]}
                  onPress={() => setOrderStatusFilter('shipped')}
                >
                  <LinearGradient
                    colors={orderStatusFilter === 'shipped' ? ['#11998e', '#38ef7d'] : ['#f5f5f5', '#e0e0e0']}
                    style={styles.orderStatGradient}
                  >
                    <Text style={[styles.orderStatNumber, orderStatusFilter === 'shipped' && styles.orderStatTextActive]}>
                      {getOrderStats().shipped}
                    </Text>
                    <Text style={[styles.orderStatLabel, orderStatusFilter === 'shipped' && styles.orderStatTextActive]}>
                      Expédiées
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orderStatCard,
                    orderStatusFilter === 'delivered' && styles.orderStatCardActive
                  ]}
                  onPress={() => setOrderStatusFilter('delivered')}
                >
                  <LinearGradient
                    colors={orderStatusFilter === 'delivered' ? ['#38ef7d', '#11998e'] : ['#f5f5f5', '#e0e0e0']}
                    style={styles.orderStatGradient}
                  >
                    <Text style={[styles.orderStatNumber, orderStatusFilter === 'delivered' && styles.orderStatTextActive]}>
                      {getOrderStats().delivered}
                    </Text>
                    <Text style={[styles.orderStatLabel, orderStatusFilter === 'delivered' && styles.orderStatTextActive]}>
                      Livrées
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Liste des commandes filtrées */}
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyText}>Aucune commande</Text>
              </View>
            ) : getFilteredOrders().length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>Aucune commande avec ce statut</Text>
              </View>
            ) : (
              getFilteredOrders().map(order => {
                const startupItems = order.items?.filter(item => item.startupId === startupId) || [];
                const orderTotal = startupItems.reduce((sum, item) =>
                  sum + (item.price * item.quantity), 0
                );

                return (
                  <View key={order.id} style={styles.orderCardEnhanced}>
                    {/* En-tête de la commande */}
                    <View style={styles.orderHeaderEnhanced}>
                      <View style={styles.orderHeaderLeft}>
                        <Text style={styles.orderIdEnhanced}>#{order.id.slice(0, 8)}</Text>
                        <Text style={styles.orderDateEnhanced}>
                          {order.createdAt?.toDate?.()?.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) || 'Date inconnue'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.statusBadgeEnhanced, { backgroundColor: getStatusColor(order.status) }]}
                        onPress={() => {
                          Alert.alert(
                            'Mettre à jour le statut',
                            'Choisir le nouveau statut',
                            [
                              { text: 'En préparation', onPress: () => updateOrderStatus(order.id, 'processing') },
                              { text: 'Expédié', onPress: () => updateOrderStatus(order.id, 'shipped') },
                              { text: 'Livré', onPress: () => updateOrderStatus(order.id, 'delivered') },
                              { text: 'Annuler', style: 'cancel' }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.statusTextEnhanced}>{getStatusLabel(order.status)}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Informations client */}
                    {order.shippingAddress && (
                      <View style={styles.orderClientInfo}>
                        <Text style={styles.orderClientIcon}>👤</Text>
                        <View style={styles.orderClientDetails}>
                          <Text style={styles.orderClientName}>{order.shippingAddress.name || 'Client'}</Text>
                          <Text style={styles.orderClientPhone}>{order.shippingAddress.phone || ''}</Text>
                          <Text style={styles.orderClientAddress} numberOfLines={2}>
                            {order.shippingAddress.address}, {order.shippingAddress.city}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Articles commandés */}
                    <View style={styles.orderItemsSection}>
                      <Text style={styles.orderItemsTitle}>📦 Articles ({startupItems.length})</Text>
                      {startupItems.map((item, idx) => (
                        <View key={idx} style={styles.orderItemRow}>
                          <Text style={styles.orderItemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.orderItemQuantity}>x{item.quantity}</Text>
                          <Text style={styles.orderItemPrice}>
                            {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Total */}
                    <View style={styles.orderTotalSection}>
                      <Text style={styles.orderTotalLabel}>Total</Text>
                      <Text style={styles.orderTotalValue}>
                        {orderTotal.toLocaleString('fr-FR')} FCFA
                      </Text>
                    </View>

                    {/* Actions rapides */}
                    <View style={styles.orderQuickActions}>
                      {order.status === 'pending' && (
                        <TouchableOpacity
                          style={[styles.quickActionBtn, styles.quickActionProcessing]}
                          onPress={() => updateOrderStatus(order.id, 'processing')}
                        >
                          <Text style={styles.quickActionText}>🔧 Préparer</Text>
                        </TouchableOpacity>
                      )}
                      {order.status === 'processing' && (
                        <TouchableOpacity
                          style={[styles.quickActionBtn, styles.quickActionShip]}
                          onPress={() => updateOrderStatus(order.id, 'shipped')}
                        >
                          <Text style={styles.quickActionText}>🚚 Expédier</Text>
                        </TouchableOpacity>
                      )}
                      {order.status === 'shipped' && (
                        <TouchableOpacity
                          style={[styles.quickActionBtn, styles.quickActionDeliver]}
                          onPress={() => updateOrderStatus(order.id, 'delivered')}
                        >
                          <Text style={styles.quickActionText}>✅ Livrer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ONGLET PROMOS */}
        {activeTab === 'promo' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎁 Codes promo ({promoCodes.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('CreatePromoCode')}
              >
                <Text style={styles.addButtonText}>+ Créer</Text>
              </TouchableOpacity>
            </View>

            {promoCodes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyText}>Aucun code promo</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('CreatePromoCode')}
                >
                  <Text style={styles.emptyButtonText}>Créer un code</Text>
                </TouchableOpacity>
              </View>
            ) : (
              promoCodes.map(promo => (
                <View key={promo.id} style={styles.promoCard}>
                  <View style={styles.promoHeader}>
                    <Text style={styles.promoCode}>{promo.code}</Text>
                    <View style={[styles.promoBadge, { backgroundColor: promo.active ? '#34C759' : '#FF3B30' }]}>
                      <Text style={styles.promoBadgeText}>
                        {promo.active ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.promoDescription}>
                    {promo.type === 'percentage' && `${promo.value}% de réduction`}
                    {promo.type === 'fixed' && `${promo.value.toLocaleString('fr-FR')} FCFA de réduction`}
                    {promo.type === 'free_shipping' && 'Livraison gratuite'}
                  </Text>
                  <Text style={styles.promoUsage}>
                    {promo.currentUses || 0} / {promo.maxUses || '∞'} utilisations
                  </Text>
                  {/* ✅ BOUTONS ACTIONS */}
<View style={styles.promoActions}>
  <TouchableOpacity
    style={styles.promoActionButton}
    onPress={async () => {
      try {
        await updateDoc(doc(db, 'promoCodes', promo.id), {
          active: !promo.active
        });
        Alert.alert('Succès', `Code ${!promo.active ? 'activé' : 'désactivé'}`);
        loadDashboard();
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de modifier le code');
      }
    }}
  >
    <Text style={styles.promoActionText}>
      {promo.active ? '⏸️ Désactiver' : '▶️ Activer'}
    </Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={[styles.promoActionButton, styles.promoActionButtonDanger]}
    onPress={() => {
      Alert.alert(
        'Supprimer le code',
        `Voulez-vous supprimer le code "${promo.code}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteDoc(doc(db, 'promoCodes', promo.id));
                Alert.alert('Succès', 'Code supprimé');
                loadDashboard();
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de supprimer le code');
              }
            }
          }
        ]
      );
    }}
  >
    <Text style={[styles.promoActionText, styles.promoActionTextDanger]}>
      🗑️ Supprimer
    </Text>
  </TouchableOpacity>
</View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// HELPERS
const getStatusColor = (status) => {
  const colors = {
    pending: '#FF9500',
    processing: '#007AFF',
    shipped: '#5856D6',
    delivered: '#34C759',
    cancelled: '#FF3B30',
  };
  return colors[status] || '#8E8E93';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: { fontSize: 28, color: 'white' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  refreshBtn: { fontSize: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#8E8E93' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorIcon: { fontSize: 64, marginBottom: 16 },
  errorText: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 24 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  content: { flex: 1 },
  tabsContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  activeTab: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  activeTabText: { color: 'white', fontWeight: 'bold' },
  
  // ✅ PHASE 1: Styles utilisation abonnement
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planBadge: {
    backgroundColor: '#AF52DE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  planBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  usageCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  usageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  usageNumbers: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    marginTop: 6,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AF52DE',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#AF52DE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  kpisContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  kpiCard: {
    width: (width - 36) / 2,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  kpiIcon: { fontSize: 40, marginBottom: 12 },
  kpiValue: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  kpiLabel: { fontSize: 12, color: 'rgba(255,255,255,0.95)', textAlign: 'center', fontWeight: '600' },
  
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  addButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  
  revenueCards: { flexDirection: 'row', gap: 12 },
  revenueCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#34C759', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  revenueLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 8 },
  revenueValue: { fontSize: 20, fontWeight: 'bold', color: '#34C759' },
  
  topProductCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  topProductRank: { width: 32, height: 32, backgroundColor: '#007AFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  topProductRankText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  topProductInfo: { flex: 1 },
  topProductName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4 },
  topProductStats: { fontSize: 13, color: '#8E8E93' },
  
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3CD', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#FF9500' },
  alertIcon: { fontSize: 24, marginRight: 12 },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 2 },
  alertStock: { fontSize: 12, color: '#FF9500' },
  alertButton: { backgroundColor: '#FF9500', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  alertButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  actionIcon: { fontSize: 36, color: 'white', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  actionText: { fontSize: 14, fontWeight: 'bold', color: 'white', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  
  productCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  productImageContainer: { width: 60, height: 60, backgroundColor: '#F2F2F7', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  productEmoji: { fontSize: 32 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#007AFF', marginBottom: 2 },
  productStock: { fontSize: 12, color: '#8E8E93' },
  editButton: { width: 36, height: 36, backgroundColor: '#007AFF', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  editButtonText: { fontSize: 18 },
  
  orderCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2 
  },
  orderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  orderId: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white'
  },
  orderItems: { 
    fontSize: 13, 
    color: '#8E8E93', 
    marginBottom: 4 
  },
  orderTotal: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#007AFF', 
    marginBottom: 4 
  },
  orderDate: {
    fontSize: 12,
    color: '#8E8E93'
  },

  // Nouveaux styles pour gestion améliorée des commandes
  orderStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  orderStatCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderStatGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  orderStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  orderStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  orderStatTextActive: {
    color: 'white',
  },
  orderCardEnhanced: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderHeaderEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderIdEnhanced: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDateEnhanced: {
    fontSize: 13,
    color: '#999',
  },
  statusBadgeEnhanced: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusTextEnhanced: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  orderClientInfo: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  orderClientIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  orderClientDetails: {
    flex: 1,
  },
  orderClientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  orderClientPhone: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  orderClientAddress: {
    fontSize: 12,
    color: '#999',
  },
  orderItemsSection: {
    marginBottom: 12,
  },
  orderItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  orderItemQuantity: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  orderTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
    marginBottom: 12,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  orderQuickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionProcessing: {
    backgroundColor: '#4facfe',
  },
  quickActionShip: {
    backgroundColor: '#11998e',
  },
  quickActionDeliver: {
    backgroundColor: '#38ef7d',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  promoActions: {
  flexDirection: 'row',
  marginTop: 12,
  gap: 8,
},
promoActionButton: {
  flex: 1,
  backgroundColor: '#F2F2F7',
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 8,
  alignItems: 'center',
},
promoActionButtonDanger: {
  backgroundColor: '#FFEBEE',
},
promoActionText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#000',
},
promoActionTextDanger: {
  color: '#FF3B30',
},
  
  promoCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  promoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  promoCode: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  promoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  promoBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  promoDescription: { fontSize: 14, color: '#000', marginBottom: 4 },
  promoUsage: { fontSize: 12, color: '#8E8E93' },
  
  emptyState: { backgroundColor: 'white', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#8E8E93', marginBottom: 8 },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
});