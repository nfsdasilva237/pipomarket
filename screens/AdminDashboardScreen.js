// screens/AdminDashboardScreen.js - DASHBOARD ADMIN ULTRA-COMPLET
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import adminService from '../utils/adminService';
import ambassadorService from '../utils/ambassadorService';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
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
      // Vérifier si user est admin
      const isAdmin = await adminService.isAdmin(auth.currentUser.uid);
      if (!isAdmin) {
        Alert.alert('Accès refusé', 'Vous n\'êtes pas administrateur', [
          { text: 'OK', onPress: () => navigation.replace('Home') }
        ]);
        return;
      }

      // Charger stats globales
      const globalStats = await adminService.getGlobalStats();
      setStats(globalStats);

      // Charger données selon onglet actif
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
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement du panel admin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>👑</Text>
          <View>
            <Text style={styles.headerTitle}>Admin PipoMarket</Text>
            <Text style={styles.headerSubtitle}>Panel Administrateur</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
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
              👥 Codes Ambassadeur ({stats?.totalAmbassadorCodes || 0})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* VUE D'ENSEMBLE */}
        {activeTab === 'overview' && stats && (
          <View style={styles.section}>
            {/* KPIs */}
            <Text style={styles.sectionTitle}>📊 Statistiques Globales</Text>
            <View style={styles.kpisGrid}>
              <View style={[styles.kpiCard, { backgroundColor: '#34C759' }]}>
                <Text style={styles.kpiIcon}>💰</Text>
                <Text style={styles.kpiValue}>
                  {(stats.totalRevenue / 1000).toFixed(0)}K
                </Text>
                <Text style={styles.kpiLabel}>Revenus (FCFA)</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.kpiIcon}>🏢</Text>
                <Text style={styles.kpiValue}>{stats.totalStartups}</Text>
                <Text style={styles.kpiLabel}>Startups</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: '#FF9500' }]}>
                <Text style={styles.kpiIcon}>📦</Text>
                <Text style={styles.kpiValue}>{stats.totalProducts}</Text>
                <Text style={styles.kpiLabel}>Produits</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: '#AF52DE' }]}>
                <Text style={styles.kpiIcon}>🛒</Text>
                <Text style={styles.kpiValue}>{stats.totalOrders}</Text>
                <Text style={styles.kpiLabel}>Commandes</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: '#FF3B30' }]}>
                <Text style={styles.kpiIcon}>👥</Text>
                <Text style={styles.kpiValue}>{stats.totalUsers}</Text>
                <Text style={styles.kpiLabel}>Utilisateurs</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: '#5856D6' }]}>
                <Text style={styles.kpiIcon}>🎁</Text>
                <Text style={styles.kpiValue}>{stats.totalPromos}</Text>
                <Text style={styles.kpiLabel}>Codes Promo</Text>
              </View>
            </View>

            {/* Répartition Users */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>👥 Répartition Utilisateurs</Text>
              <View style={styles.userStats}>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatValue}>{stats.clients}</Text>
                  <Text style={styles.userStatLabel}>Clients</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatValue}>{stats.startupUsers}</Text>
                  <Text style={styles.userStatLabel}>Startups</Text>
                </View>
                <View style={styles.userStatItem}>
                  <Text style={styles.userStatValue}>{stats.admins}</Text>
                  <Text style={styles.userStatLabel}>Admins</Text>
                </View>
              </View>
            </View>

            {/* Actions Rapides */}
            // REMPLACE la section "Actions Rapides" (ligne ~460-490) par CECI:

{/* Actions Rapides */}
<View style={styles.subsection}>
  <Text style={styles.subsectionTitle}>⚡ Actions Rapides</Text>
  <View style={styles.actionsGrid}>
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: '#007AFF' }]}
      onPress={() => {
        setActiveTab('startups');
        loadTabData('startups');
      }}
    >
      <Text style={styles.actionIcon}>🏢</Text>
      <Text style={styles.actionText}>Gérer Startups</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: '#FF9500' }]}
      onPress={() => {
        setActiveTab('products');
        loadTabData('products');
      }}
    >
      <Text style={styles.actionIcon}>📦</Text>
      <Text style={styles.actionText}>Gérer Produits</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: '#34C759' }]}
      onPress={() => {
        setActiveTab('orders');
        loadTabData('orders');
      }}
    >
      <Text style={styles.actionIcon}>🛒</Text>
      <Text style={styles.actionText}>Gérer Commandes</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: '#AF52DE' }]}
      onPress={() => {
        setActiveTab('users');
        loadTabData('users');
      }}
    >
      <Text style={styles.actionIcon}>👥</Text>
      <Text style={styles.actionText}>Gérer Users</Text>
    </TouchableOpacity>

    {/* ✅ NOUVEAU: Bouton Catégories */}
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: '#5856D6' }]}
      onPress={() => navigation.navigate('AdminManageCategories')}
    >
      <Text style={styles.actionIcon}>📂</Text>
      <Text style={styles.actionText}>Gérer Catégories</Text>
    </TouchableOpacity>

    <TouchableOpacity
  style={[styles.actionCard, { backgroundColor: '#FFD700' }]}
  onPress={() => navigation.navigate('AdminManageAmbassadorCodesScreen')}
>
  <Text style={styles.actionIcon}>🎁</Text>
  <Text style={styles.actionText}>Gérer Ambassadeurs</Text>
</TouchableOpacity>



    {/* ✅ NOUVEAU: Bouton Codes Promo */}
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: '#FF2D55' }]}
      onPress={() => navigation.navigate('AdminManagePromoCodes')}
    >
      <Text style={styles.actionIcon}>🎁</Text>
      <Text style={styles.actionText}>Gérer Promos</Text>
    </TouchableOpacity>

    {/* ✅ NOUVEAU: Bouton Demandes Boost */}
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: '#FF9500' }]}
      onPress={() => navigation.navigate('AdminBoostRequests')}
    >
      <Text style={styles.actionIcon}>🚀</Text>
      <Text style={styles.actionText}>Demandes Boost</Text>
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
                <Text style={styles.addButtonText}>+ Ajouter</Text>
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
                      { backgroundColor: startup.active !== false ? '#34C759' : '#FF3B30' }
                    ]}>
                      <Text style={styles.statusText}>
                        {startup.active !== false ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>
                    Propriétaire: {startup.ownerName || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Email: {startup.ownerEmail || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Produits: {startup.products || 0}
                  </Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={[styles.itemButton, { backgroundColor: startup.active !== false ? '#FF9500' : '#34C759' }]}
                      onPress={() => handleToggleStartup(startup.id, startup.active !== false)}
                    >
                      <Text style={styles.itemButtonText}>
                        {startup.active !== false ? 'Désactiver' : 'Activer'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.itemButton, { backgroundColor: '#FF3B30' }]}
                      onPress={() => handleDeleteStartup(startup.id, startup.name)}
                    >
                      <Text style={styles.itemButtonText}>Supprimer</Text>
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
                      { backgroundColor: product.available !== false ? '#34C759' : '#FF3B30' }
                    ]}>
                      <Text style={styles.statusText}>
                        {product.available !== false ? 'Dispo' : 'Indispo'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>
                    Prix: {product.price?.toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text style={styles.itemDetail}>
                    Stock: {product.stock || 0}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Startup: {product.startupName || 'N/A'}
                  </Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={[styles.itemButton, { backgroundColor: product.available !== false ? '#FF9500' : '#34C759' }]}
                      onPress={() => handleToggleProduct(product.id, product.available !== false)}
                    >
                      <Text style={styles.itemButtonText}>
                        {product.available !== false ? 'Désactiver' : 'Activer'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.itemButton, { backgroundColor: '#FF3B30' }]}
                      onPress={() => handleDeleteProduct(product.id, product.name)}
                    >
                      <Text style={styles.itemButtonText}>Supprimer</Text>
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
                    <Text style={styles.itemName}>#{order.id.slice(0, 8)}</Text>
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
                    Total: {order.total?.toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text style={styles.itemDetail}>
                    Articles: {order.items?.length || 0}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Date: {order.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
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
                    Email: {user.email || 'N/A'}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Téléphone: {user.phone || 'N/A'}
                  </Text>
                  <View style={styles.itemActions}>
                    {user.role !== 'admin' && (
                      <TouchableOpacity
                        style={[styles.itemButton, { backgroundColor: '#FFD700' }]}
                        onPress={() => handlePromoteUser(user.id, user.name)}
                      >
                        <Text style={styles.itemButtonText}>👑 Promouvoir</Text>
                      </TouchableOpacity>
                    )}
                    {user.id !== auth.currentUser.uid && (
                      <TouchableOpacity
                        style={[styles.itemButton, { backgroundColor: '#FF3B30' }]}
                        onPress={() => handleDeleteUser(user.id, user.name)}
                      >
                        <Text style={styles.itemButtonText}>Supprimer</Text>
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
            <Text style={styles.sectionTitle}>🎁 Gestion Codes Promo</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreatePromoCode')}
            >
              <Text style={styles.addButtonText}>+ Créer Code Promo Global</Text>
              <TouchableOpacity
  style={[styles.addButton, { backgroundColor: '#34C759', marginTop: 8 }]}
  onPress={() => navigation.navigate('AdminManagePromoCodes')}
>
  <Text style={styles.addButtonText}>📋 Gérer Tous les Codes</Text>
</TouchableOpacity>
            </TouchableOpacity>
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
                      { backgroundColor: promo.active ? '#34C759' : '#FF3B30' }
                    ]}>
                      <Text style={styles.statusText}>
                        {promo.active ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetail}>
                    Type: {promo.type === 'percentage' ? `${promo.value}%` : `${promo.value} FCFA`}
                  </Text>
                  <Text style={styles.itemDetail}>
                    Utilisations: {promo.currentUses || 0} / {promo.maxUses || '∞'}
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
              <Text style={styles.sectionTitle}>👥 Codes Ambassadeur</Text>
              <TouchableOpacity
                style={styles.addButton}
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
                <Text style={styles.addButtonText}>+ Nouveau Code</Text>
              </TouchableOpacity>
            </View>

            {ambassadorCodes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>Aucun code d'invitation</Text>
              </View>
            ) : (
              ambassadorCodes.map((code) => (
                <View key={code.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{code.code}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: code.used ? '#FF3B30' : code.disabled ? '#8E8E93' : '#34C759' }
                    ]}>
                      <Text style={styles.statusText}>
                        {code.used ? 'Utilisé' : code.disabled ? 'Désactivé' : 'Disponible'}
                      </Text>
                    </View>
                  </View>
                  {code.used && (
                    <>
                      <Text style={styles.itemDetail}>
                        Utilisé par: {code.usedByEmail || 'N/A'}
                      </Text>
                      <Text style={styles.itemDetail}>
                        Date: {code.usedAt ? new Date(code.usedAt.toDate()).toLocaleDateString() : 'N/A'}
                      </Text>
                    </>
                  )}
                  <Text style={styles.itemDetail}>
                    Créé le: {new Date(code.createdAt.toDate()).toLocaleDateString()}
                  </Text>
                  <View style={styles.itemActions}>
                    {!code.used && (
                      <TouchableOpacity
                        style={[styles.itemButton, { backgroundColor: code.disabled ? '#34C759' : '#FF9500' }]}
                        onPress={() => handleToggleInviteCode(code.id, code.code, code.disabled)}
                      >
                        <Text style={styles.itemButtonText}>
                          {code.disabled ? 'Activer' : 'Désactiver'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.itemButton, { backgroundColor: '#FF3B30' }]}
                      onPress={() => handleDeleteInviteCode(code.id, code.code)}
                    >
                      <Text style={styles.itemButtonText}>Supprimer</Text>
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
const getOrderStatusColor = (status) => {
  const colors = {
    pending: '#FF9500',
    processing: '#007AFF',
    shipped: '#5856D6',
    delivered: '#34C759',
    cancelled: '#FF3B30',
  };
  return colors[status] || '#8E8E93';
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
    admin: '#FFD700',
    startup: '#007AFF',
    client: '#34C759',
  };
  return colors[role] || '#8E8E93';
};

const getRoleLabel = (role) => {
  const labels = {
    admin: '👑 Admin',
    startup: '🏢 Startup',
    client: '👤 Client',
  };
  return labels[role] || role;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#8E8E93' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFD700', padding: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { fontSize: 32, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#000', opacity: 0.7 },
  logoutButton: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logoutIcon: { fontSize: 20 },
  
  content: { flex: 1 },
  tabsContainer: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 8 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  activeTabText: { color: 'white' },
  
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  
  kpisGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { width: (width - 44) / 2, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  kpiIcon: { fontSize: 32, marginBottom: 8 },
  kpiValue: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  kpiLabel: { fontSize: 12, color: 'white', textAlign: 'center', opacity: 0.9 },
  
  subsection: { marginBottom: 24 },
  subsectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  userStats: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 16, gap: 16 },
  userStatItem: { flex: 1, alignItems: 'center' },
  userStatValue: { fontSize: 24, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  userStatLabel: { fontSize: 12, color: '#8E8E93' },
  
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: (width - 44) / 2, borderRadius: 12, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  actionIcon: { fontSize: 32, color: 'white', marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: 'white', textAlign: 'center' },
  
  itemCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#000', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: 'white' },
  itemDetail: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  itemButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  itemButtonText: { fontSize: 13, fontWeight: '600', color: 'white' },
  
  addButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  
  emptyState: { backgroundColor: 'white', borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#8E8E93' },
});