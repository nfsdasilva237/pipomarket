// screens/AdminDashboardScreen.js - INTERFACE ADMIN MODERNE & ÉLÉGANTE
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import adminService from '../utils/adminService';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

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

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger le dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await auth.signOut();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER MODERNE */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Bonjour Admin 👋</Text>
            <Text style={styles.headerSubtitle}>Tableau de bord PipoMarket</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* STATISTIQUES CLÉS */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>

          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={styles.statIcon}>🏢</Text>
              <Text style={styles.statValue}>{stats?.totalStartups || 0}</Text>
              <Text style={styles.statLabel}>Startups</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statValue}>{stats?.totalProducts || 0}</Text>
              <Text style={styles.statLabel}>Produits</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Utilisateurs</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={styles.statIcon}>🛒</Text>
              <Text style={styles.statValue}>{stats?.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Commandes</Text>
            </LinearGradient>
          </View>

          {/* REVENUS */}
          <LinearGradient
            colors={['#FFF9C4', '#FFF59D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.revenueCard}
          >
            <View style={styles.revenueContent}>
              <Text style={styles.revenueIcon}>💰</Text>
              <View style={styles.revenueInfo}>
                <Text style={styles.revenueLabel}>Revenu total</Text>
                <Text style={styles.revenueValue}>
                  {(stats?.totalRevenue || 0).toLocaleString('fr-FR')} XAF
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* GESTION RAPIDE */}
        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AdminManageCategories')}
            >
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🏷️</Text>
                <Text style={styles.actionText}>Catégories</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AdminManagePromoCodes')}
            >
              <LinearGradient
                colors={['#ff9a9e', '#fecfef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🎁</Text>
                <Text style={styles.actionText}>Codes Promo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AdminManageAmbassadorCodes')}
            >
              <LinearGradient
                colors={['#a8edea', '#fed6e3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionText}>Ambassadeurs</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AdminManageStartupCodes')}
            >
              <LinearGradient
                colors={['#ffecd2', '#fcb69f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🎫</Text>
                <Text style={styles.actionText}>Codes Startup</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AdminBDLOrders')}
            >
              <LinearGradient
                colors={['#275471', '#f4a04b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🎨</Text>
                <Text style={styles.actionText}>BDL Studio</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AdminAddStartup')}
            >
              <LinearGradient
                colors={['#a1c4fd', '#c2e9fb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionText}>Ajouter Startup</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACTIVITÉ RÉCENTE */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>🔔 Activité récente</Text>

          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>🏢</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Nouvelles startups</Text>
                <Text style={styles.activityDescription}>
                  {stats?.recentStartups || 0} startups cette semaine
                </Text>
              </View>
              <Text style={styles.activityBadge}>{stats?.recentStartups || 0}</Text>
            </View>

            <View style={styles.activityDivider} />

            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>🛒</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Commandes en attente</Text>
                <Text style={styles.activityDescription}>
                  À traiter rapidement
                </Text>
              </View>
              <Text style={styles.activityBadge}>{stats?.pendingOrders || 0}</Text>
            </View>

            <View style={styles.activityDivider} />

            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>👤</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Nouveaux utilisateurs</Text>
                <Text style={styles.activityDescription}>
                  {stats?.recentUsers || 0} inscrits cette semaine
                </Text>
              </View>
              <Text style={styles.activityBadge}>{stats?.recentUsers || 0}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  // HEADER
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
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
    fontSize: 24,
  },

  // STATS SECTION
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  revenueCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  revenueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f57c00',
  },

  // QUICK ACTIONS
  quickSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  // ACTIVITY
  activitySection: {
    padding: 20,
    paddingTop: 0,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
    color: '#666',
  },
  activityBadge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
});
