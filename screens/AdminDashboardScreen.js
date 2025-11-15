// screens/AdminDashboardScreen.js - DASHBOARD ADMIN COMPLET - DESIGN ÉLÉGANT & MODERNE
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import adminService from '../utils/adminService';
import ambassadorService from '../utils/ambassadorService';

const { width } = Dimensions.get('window');

// HELPERS - Doivent être AVANT le composant car utilisés dedans
const getOrderStatusColor = (status) => {
  const colors = {
    pending: '#FFA94D',
    processing: '#6C63FF',
    shipped: '#C471ED',
    delivered: '#10d98c',
    cancelled: '#FF6B9D',
  };
  return colors[status] || '#A0A0A0';
};

const getOrderStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
};

const getRoleColor = (role) => {
  const colors = {
    admin: '#FFA94D',
    startup: '#6C63FF',
    client: '#10d98c',
  };
  return colors[role] || '#A0A0A0';
};

const getRoleLabel = (role) => {
  const labels = {
    admin: '👑 Admin',
    startup: '🏢 Startup',
    client: '👤 Client',
  };
  return labels[role] || role;
};

export default function AdminDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [startups, setStartups] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [ambassadorCodes, setAmbassadorCodes] = useState([]);

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
      const isAdmin = await adminService.isAdmin(auth.currentUser.uid);
      if (!isAdmin) {
        Alert.alert('Accès refusé', 'Vous n\'êtes pas administrateur', [
          { text: 'OK', onPress: () => navigation.replace('Home') }
        ]);
        return;
      }

      const globalStats = await adminService.getGlobalStats();
      setStats(globalStats);

      await loadTabData(activeTab);

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger le dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTabData = async (tab) => {
    switch (tab) {
      case 'startups':
        const startupsData = await adminService.getAllStartups();
        setStartups(startupsData);
        break;
      case 'products':
        const productsData = await adminService.getAllProducts();
        setProducts(productsData);
        break;
      case 'orders':
        const ordersData = await adminService.getAllOrders();
        setOrders(ordersData);
        break;
      case 'users':
        const usersData = await adminService.getAllUsers();
        setUsers(usersData);
        break;
      case 'promos':
        const promosData = await adminService.getAllPromoCodes();
        setPromoCodes(promosData);
        break;
      case 'ambassadors':
        const ambassadorCodesData = await ambassadorService.getAllInviteCodes();
        setAmbassadorCodes(ambassadorCodesData);
        break;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleDeleteStartup = (startupId, startupName) => {
    Alert.alert(
      'Supprimer startup',
      `Supprimer "${startupName}" et tous ses produits ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.deleteStartup(startupId);
            if (result.success) {
              Alert.alert('Succès', 'Startup supprimée');
              loadDashboard();
            } else {
              Alert.alert('Erreur', result.error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteProduct = (productId, productName) => {
    Alert.alert(
      'Supprimer produit',
      `Supprimer "${productName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.deleteProduct(productId);
            if (result.success) {
              Alert.alert('Succès', 'Produit supprimé');
              loadDashboard();
            } else {
              Alert.alert('Erreur', result.error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      'Supprimer utilisateur',
      `Supprimer "${userName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.deleteUser(userId);
            if (result.success) {
              Alert.alert('Succès', 'Utilisateur supprimé');
              loadDashboard();
            } else {
              Alert.alert('Erreur', result.error);
            }
          },
        },
      ]
    );
  };

  const handleToggleStartup = async (startupId, currentStatus) => {
    const result = await adminService.toggleStartupStatus(startupId, !currentStatus);
    if (result.success) {
      Alert.alert('Succès', `Startup ${!currentStatus ? 'activée' : 'désactivée'}`);
      loadDashboard();
    }
  };

  const handleToggleProduct = async (productId, currentStatus) => {
    const result = await adminService.toggleProductStatus(productId, !currentStatus);
    if (result.success) {
      Alert.alert('Succès', `Produit ${!currentStatus ? 'activé' : 'désactivé'}`);
      loadDashboard();
    }
  };

  const handlePromoteUser = async (userId, userName) => {
    Alert.alert(
      'Promouvoir en Admin',
      `Donner les droits admin à "${userName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Promouvoir',
          onPress: async () => {
            const result = await adminService.promoteToAdmin(userId);
            if (result.success) {
              Alert.alert('Succès', 'Utilisateur promu admin');
              loadDashboard();
            } else {
              Alert.alert('Erreur', result.error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteInviteCode = (codeId, code) => {
    Alert.alert(
      'Supprimer code',
      `Voulez-vous supprimer le code "${code}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await ambassadorService.deleteInviteCode(codeId);
            if (result.success) {
              Alert.alert('Succès', 'Code supprimé');
              loadTabData('ambassadors');
            } else {
              Alert.alert('Erreur', result.error);
            }
          },
        },
      ]
    );
  };

  const handleToggleInviteCode = async (codeId, code, isDisabled) => {
    const result = await ambassadorService.toggleInviteCode(codeId, isDisabled);
    if (result.success) {
      Alert.alert('Succès', `Code ${isDisabled ? 'activé' : 'désactivé'}`);
      loadTabData('ambassadors');
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Se déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          onPress: async () => {
            await auth.signOut();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Chargement du panel admin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER MODERNE ET ÉLÉGANT */}
      <LinearGradient
        colors={['#6C63FF', '#5A52E0', '#4845C2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>👑</Text>
            <View>
              <Text style={styles.headerTitle}>Panel Admin</Text>
              <Text style={styles.headerSubtitle}>PipoMarket Management</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* TABS NAVIGATION */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => {
              setActiveTab('overview');
              loadTabData('overview');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              📊 Vue d'ensemble
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'startups' && styles.activeTab]}
            onPress={() => {
              setActiveTab('startups');
              loadTabData('startups');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'startups' && styles.activeTabText]}>
              🏢 Startups ({stats?.totalStartups || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => {
              setActiveTab('products');
              loadTabData('products');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
              📦 Produits ({stats?.totalProducts || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
            onPress={() => {
              setActiveTab('orders');
              loadTabData('orders');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
              🛒 Commandes ({stats?.totalOrders || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => {
              setActiveTab('users');
              loadTabData('users');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              👥 Users ({stats?.totalUsers || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'promos' && styles.activeTab]}
            onPress={() => {
              setActiveTab('promos');
              loadTabData('promos');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'promos' && styles.activeTabText]}>
              🎁 Promos ({stats?.totalPromos || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ambassadors' && styles.activeTab]}
            onPress={() => {
              setActiveTab('ambassadors');
              loadTabData('ambassadors');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'ambassadors' && styles.activeTabText]}>
              🤝 Ambassadeurs
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* VUE D'ENSEMBLE */}
        {activeTab === 'overview' && stats && (
          <View style={styles.section}>
            {/* KPIs MODERNES */}
            <Text style={styles.sectionTitle}>📊 Statistiques Globales</Text>
            <View style={styles.kpisGrid}>
              <LinearGradient
                colors={['#10d98c', '#0fd483']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>💰</Text>
                <Text style={styles.kpiValue}>
                  {(stats.totalRevenue / 1000).toFixed(0)}K
                </Text>
                <Text style={styles.kpiLabel}>Revenus FCFA</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#6C63FF', '#5A52E0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>🏢</Text>
                <Text style={styles.kpiValue}>{stats.totalStartups}</Text>
                <Text style={styles.kpiLabel}>Startups</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#FF6B9D', '#FF5E88']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>📦</Text>
                <Text style={styles.kpiValue}>{stats.totalProducts}</Text>
                <Text style={styles.kpiLabel}>Produits</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#FFA94D', '#FF9A3B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>🛒</Text>
                <Text style={styles.kpiValue}>{stats.totalOrders}</Text>
                <Text style={styles.kpiLabel}>Commandes</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#00D4FF', '#00C4EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>👥</Text>
                <Text style={styles.kpiValue}>{stats.totalUsers}</Text>
                <Text style={styles.kpiLabel}>Utilisateurs</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#C471ED', '#B865E0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.kpiCard}
              >
                <Text style={styles.kpiIcon}>🎁</Text>
                <Text style={styles.kpiValue}>{stats.totalPromos}</Text>
                <Text style={styles.kpiLabel}>Codes Promo</Text>
              </LinearGradient>
            </View>

            {/* Répartition Users */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>👥 Répartition Utilisateurs</Text>
              <View style={styles.userStatsCard}>
                <LinearGradient
                  colors={['#6C63FF', '#5A52E0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.userStatItem}
                >
                  <Text style={styles.userStatValue}>{stats.clients}</Text>
                  <Text style={styles.userStatLabel}>Clients</Text>
                </LinearGradient>
                <LinearGradient
                  colors={['#10d98c', '#0fd483']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.userStatItem}
                >
                  <Text style={styles.userStatValue}>{stats.startupUsers}</Text>
                  <Text style={styles.userStatLabel}>Startups</Text>
                </LinearGradient>
                <LinearGradient
                  colors={['#FFA94D', '#FF9A3B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.userStatItem}
                >
                  <Text style={styles.userStatValue}>{stats.admins}</Text>
                  <Text style={styles.userStatLabel}>Admins</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Actions Rapides */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>⚡ Actions Rapides</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('startups');
                    loadTabData('startups');
                  }}
                >
                  <LinearGradient
                    colors={['#6C63FF', '#5A52E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>🏢</Text>
                    <Text style={styles.actionText}>Gérer Startups</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('products');
                    loadTabData('products');
                  }}
                >
                  <LinearGradient
                    colors={['#FF6B9D', '#FF5E88']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>📦</Text>
                    <Text style={styles.actionText}>Gérer Produits</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('orders');
                    loadTabData('orders');
                  }}
                >
                  <LinearGradient
                    colors={['#10d98c', '#0fd483']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>🛒</Text>
                    <Text style={styles.actionText}>Gérer Commandes</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('users');
                    loadTabData('users');
                  }}
                >
                  <LinearGradient
                    colors={['#FFA94D', '#FF9A3B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>👥</Text>
                    <Text style={styles.actionText}>Gérer Users</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminManageCategories')}
                >
                  <LinearGradient
                    colors={['#00D4FF', '#00C4EE']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>📂</Text>
                    <Text style={styles.actionText}>Catégories</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminManageAmbassadorCodesScreen')}
                >
                  <LinearGradient
                    colors={['#C471ED', '#B865E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>👥</Text>
                    <Text style={styles.actionText}>Ambassadeurs</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminManageStartupCodes')}
                >
                  <LinearGradient
                    colors={['#4ECDC4', '#44B8B1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>🎫</Text>
                    <Text style={styles.actionText}>Codes Startup</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminManagePromoCodes')}
                >
                  <LinearGradient
                    colors={['#FC5C7D', '#EC4F6A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>🎁</Text>
                    <Text style={styles.actionText}>Codes Promo</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminBDLOrders')}
                >
                  <LinearGradient
                    colors={['#275471', '#f4a04b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>🎨</Text>
                    <Text style={styles.actionText}>BDL Studio</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('AdminAddStartup')}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Text style={styles.actionIcon}>➕</Text>
                    <Text style={styles.actionText}>Ajouter Startup</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* GESTION STARTUPS */}
        {activeTab === 'startups' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏢 Gestion Startups</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AdminAddStartup')}
              >
                <LinearGradient
                  colors={['#6C63FF', '#5A52E0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>+ Ajouter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {startups.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyText}>Aucune startup</Text>
              </View>
            ) : (
              startups.map((startup) => (
                <View key={startup.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{startup.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: startup.active !== false ? '#10d98c' : '#FF6B9D' }
                    ]}>
                      <Text style={styles.statusText}>
                        {startup.active !== false ? '✓ Actif' : '✗ Inactif'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>
                    👤 Propriétaire: {startup.ownerName || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    ✉️ Email: {startup.ownerEmail || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    📦 Produits: {startup.products || 0}
                  </Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={() => handleToggleStartup(startup.id, startup.active !== false)}
                    >
                      <LinearGradient
                        colors={startup.active !== false ? ['#FFA94D', '#FF9A3B'] : ['#10d98c', '#0fd483']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemButton}
                      >
                        <Text style={styles.itemButtonText}>
                          {startup.active !== false ? 'Désactiver' : 'Activer'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteStartup(startup.id, startup.name)}
                    >
                      <LinearGradient
                        colors={['#FF6B9D', '#FF5E88']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemButton}
                      >
                        <Text style={styles.itemButtonText}>Supprimer</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* GESTION PRODUITS */}
        {activeTab === 'products' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Gestion Produits</Text>
            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>Aucun produit</Text>
              </View>
            ) : (
              products.map((product) => (
                <View key={product.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{product.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: product.available !== false ? '#10d98c' : '#FF6B9D' }
                    ]}>
                      <Text style={styles.statusText}>
                        {product.available !== false ? '✓ Dispo' : '✗ Indispo'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>
                    💰 Prix: {product.price?.toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text style={styles.itemDetail}>
                    📊 Stock: {product.stock || 0}
                  </Text>
                  <Text style={styles.itemDetail}>
                    🏢 Startup: {product.startupName || 'N/A'}
                  </Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={() => handleToggleProduct(product.id, product.available !== false)}
                    >
                      <LinearGradient
                        colors={product.available !== false ? ['#FFA94D', '#FF9A3B'] : ['#10d98c', '#0fd483']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemButton}
                      >
                        <Text style={styles.itemButtonText}>
                          {product.available !== false ? 'Désactiver' : 'Activer'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(product.id, product.name)}
                    >
                      <LinearGradient
                        colors={['#FF6B9D', '#FF5E88']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemButton}
                      >
                        <Text style={styles.itemButtonText}>Supprimer</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* GESTION COMMANDES */}
        {activeTab === 'orders' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛒 Gestion Commandes</Text>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyText}>Aucune commande</Text>
              </View>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getOrderStatusColor(order.status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {getOrderStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>
                    💰 Total: {order.total?.toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text style={styles.itemDetail}>
                    📦 Articles: {order.items?.length || 0}
                  </Text>
                  <Text style={styles.itemDetail}>
                    📅 Date: {order.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* GESTION USERS */}
        {activeTab === 'users' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Gestion Utilisateurs</Text>
            {users.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>Aucun utilisateur</Text>
              </View>
            ) : (
              users.map((user) => (
                <View key={user.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{user.name || 'N/A'}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getRoleColor(user.role) }
                    ]}>
                      <Text style={styles.statusText}>
                        {getRoleLabel(user.role)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>
                    ✉️ Email: {user.email || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    📱 Téléphone: {user.phone || 'N/A'}
                  </Text>
                  <View style={styles.itemActions}>
                    {user.role !== 'admin' && (
                      <TouchableOpacity
                        onPress={() => handlePromoteUser(user.id, user.name)}
                      >
                        <LinearGradient
                          colors={['#FFA94D', '#FF9A3B']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.itemButton}
                        >
                          <Text style={styles.itemButtonText}>👑 Promouvoir</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    {user.id !== auth.currentUser.uid && (
                      <TouchableOpacity
                        onPress={() => handleDeleteUser(user.id, user.name)}
                      >
                        <LinearGradient
                          colors={['#FF6B9D', '#FF5E88']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.itemButton}
                        >
                          <Text style={styles.itemButtonText}>Supprimer</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* GESTION PROMOS */}
        {activeTab === 'promos' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎁 Gestion Codes Promo</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AdminManagePromoCodes')}
              >
                <LinearGradient
                  colors={['#C471ED', '#B865E0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>📋 Gérer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {promoCodes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyText}>Aucun code promo</Text>
              </View>
            ) : (
              promoCodes.map((promo) => (
                <View key={promo.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{promo.code}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: promo.active ? '#10d98c' : '#FF6B9D' }
                    ]}>
                      <Text style={styles.statusText}>
                        {promo.active ? '✓ Actif' : '✗ Inactif'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>
                    💵 Type: {promo.type === 'percentage' ? `${promo.value}%` : `${promo.value} FCFA`}
                  </Text>
                  <Text style={styles.itemDetail}>
                    📊 Utilisations: {promo.currentUses || 0} / {promo.maxUses || '∞'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* GESTION CODES AMBASSADEUR */}
        {activeTab === 'ambassadors' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🤝 Codes Ambassadeur</Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const result = await ambassadorService.generateInviteCode();
                    if (result.success) {
                      Alert.alert('Succès', `Nouveau code créé: ${result.code}`);
                      loadTabData('ambassadors');
                    } else {
                      Alert.alert('Erreur', result.error || 'Erreur lors de la création du code');
                    }
                  } catch (error) {
                    console.error('Erreur génération code:', error);
                    Alert.alert('Erreur', 'Impossible de générer le code');
                  }
                }}
              >
                <LinearGradient
                  colors={['#6C63FF', '#5A52E0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>+ Nouveau</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {ambassadorCodes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🤝</Text>
                <Text style={styles.emptyText}>Aucun code d'invitation</Text>
              </View>
            ) : (
              ambassadorCodes.map((code) => (
                <View key={code.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{code.code}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: code.used ? '#FF6B9D' : code.disabled ? '#A0A0A0' : '#10d98c' }
                    ]}>
                      <Text style={styles.statusText}>
                        {code.used ? 'Utilisé' : code.disabled ? 'Désactivé' : 'Disponible'}
                      </Text>
                    </View>
                  </View>
                  {code.used && (
                    <>
                      <Text style={styles.itemDetail}>
                        👤 Utilisé par: {code.usedByEmail || 'N/A'}
                      </Text>
                      <Text style={styles.itemDetail}>
                        📅 Date: {code.usedAt ? new Date(code.usedAt.toDate()).toLocaleDateString() : 'N/A'}
                      </Text>
                    </>
                  )}
                  <Text style={styles.itemDetail}>
                    📅 Créé le: {new Date(code.createdAt.toDate()).toLocaleDateString()}
                  </Text>
                  <View style={styles.itemActions}>
                    {!code.used && (
                      <TouchableOpacity
                        onPress={() => handleToggleInviteCode(code.id, code.code, code.disabled)}
                      >
                        <LinearGradient
                          colors={code.disabled ? ['#10d98c', '#0fd483'] : ['#FFA94D', '#FF9A3B']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.itemButton}
                        >
                          <Text style={styles.itemButtonText}>
                            {code.disabled ? 'Activer' : 'Désactiver'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeleteInviteCode(code.id, code.code)}
                    >
                      <LinearGradient
                        colors={['#FF6B9D', '#FF5E88']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.itemButton}
                      >
                        <Text style={styles.itemButtonText}>Supprimer</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Padding en bas qui s'adapte à tous les téléphones */}
        <View style={{ height: Math.max(insets.bottom + 20, 80) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },

  // HEADER
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 22,
    color: 'white',
  },

  // CONTENT
  content: {
    flex: 1,
  },

  // TABS
  tabsContainer: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  activeTab: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // SECTION
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },

  // KPIs
  kpisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  kpiCard: {
    width: (width - 56) / 2,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  kpiIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },

  // SUBSECTION
  subsection: {
    marginBottom: 28,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 16,
  },
  userStatsCard: {
    flexDirection: 'row',
    gap: 12,
  },
  userStatItem: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  userStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  userStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },

  // ACTIONS GRID
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 2,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  // ITEM CARD
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  itemDetail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  itemButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  itemButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
  },

  // ADD BUTTON
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // EMPTY STATE
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
