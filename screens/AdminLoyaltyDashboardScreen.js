// screens/AdminLoyaltyDashboardScreen.js - ✅ DASHBOARD ADMIN FIDÉLITÉ COMPLET

import { LinearGradient } from 'expo-linear-gradient';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import { loyaltyConfig } from '../config/loyaltyConfig';

const { width } = Dimensions.get('window');

export default function AdminLoyaltyDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    totalRedeemed: 0,
    loyaltyFund: 0,
    totalPaidByPipo: 0,
    activeRewards: 0,
  });
  const [levelDistribution, setLevelDistribution] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // 1️⃣ STATS GLOBALES
      await loadGlobalStats();

      // 2️⃣ DISTRIBUTION PAR NIVEAU
      await loadLevelDistribution();

      // 3️⃣ TRANSACTIONS RÉCENTES
      await loadRecentTransactions();

      // 4️⃣ TOP UTILISATEURS
      await loadTopUsers();
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadGlobalStats = async () => {
    try {
      // Utilisateurs avec points
      const usersSnap = await getDocs(collection(db, 'users'));
      let totalUsers = 0;
      let totalPoints = 0;

      usersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.loyaltyPoints && data.loyaltyPoints > 0) {
          totalUsers++;
          totalPoints += data.loyaltyPoints;
        }
      });

      // Points échangés (historique)
      const historySnap = await getDocs(
        query(
          collection(db, 'pointsHistory'),
          where('type', '==', 'redeemed')
        )
      );
      let totalRedeemed = 0;
      historySnap.forEach((doc) => {
        totalRedeemed += doc.data().points || 0;
      });

      // Fond de fidélité
      const fundDoc = await getDoc(doc(db, 'settings', 'loyaltyFund'));
      const loyaltyFund = fundDoc.exists() ? fundDoc.data().totalFund || 0 : 0;

      // Montant total payé par PipoMarket
      const paymentsSnap = await getDocs(collection(db, 'loyaltyPayments'));
      let totalPaidByPipo = 0;
      paymentsSnap.forEach((doc) => {
        totalPaidByPipo += doc.data().pipoPays || 0;
      });

      // Récompenses actives
      const rewardsSnap = await getDocs(
        query(collection(db, 'userRewards'), where('used', '==', false))
      );
      const activeRewards = rewardsSnap.size;

      setStats({
        totalUsers,
        totalPoints,
        totalRedeemed,
        loyaltyFund,
        totalPaidByPipo,
        activeRewards,
      });
    } catch (error) {
      console.error('Erreur stats globales:', error);
    }
  };

  const loadLevelDistribution = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const distribution = {};

      loyaltyConfig.levels.forEach((level) => {
        distribution[level.name] = 0;
      });

      usersSnap.forEach((doc) => {
        const points = doc.data().loyaltyPoints || 0;
        const level = loyaltyConfig.levels.find(
          (l) => points >= l.minPoints && points <= l.maxPoints
        );
        if (level) {
          distribution[level.name]++;
        }
      });

      setLevelDistribution(distribution);
    } catch (error) {
      console.error('Erreur distribution niveaux:', error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const q = query(
        collection(db, 'pointsHistory'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const transactions = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Récupérer info utilisateur
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        const userName = userDoc.exists()
          ? userDoc.data().fullName || 'Utilisateur'
          : 'Utilisateur';

        transactions.push({
          id: docSnap.id,
          ...data,
          userName,
        });
      }

      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Erreur transactions récentes:', error);
    }
  };

  const loadTopUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = [];

      usersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.loyaltyPoints && data.loyaltyPoints > 0) {
          users.push({
            id: doc.id,
            name: data.fullName || 'Utilisateur',
            points: data.loyaltyPoints,
          });
        }
      });

      // Trier par points décroissants
      users.sort((a, b) => b.points - a.points);

      setTopUsers(users.slice(0, 10));
    } catch (error) {
      console.error('Erreur top utilisateurs:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Chargement du dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <LinearGradient
        colors={['#9333EA', '#7E22CE', '#6B21A8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>⭐ Fidélité Admin</Text>
          <Text style={styles.headerSubtitle}>Gestion du programme</Text>
        </View>
        <TouchableOpacity onPress={loadDashboard} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9333EA"
          />
        }
      >
        {/* KPI CARDS */}
        <View style={styles.kpiContainer}>
          <LinearGradient
            colors={['#34C759', '#28A745']}
            style={styles.kpiCard}
          >
            <Text style={styles.kpiIcon}>👥</Text>
            <Text style={styles.kpiValue}>{stats.totalUsers}</Text>
            <Text style={styles.kpiLabel}>Utilisateurs actifs</Text>
          </LinearGradient>

          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.kpiCard}>
            <Text style={styles.kpiIcon}>⭐</Text>
            <Text style={styles.kpiValue}>
              {stats.totalPoints.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Points en circulation</Text>
          </LinearGradient>

          <LinearGradient colors={['#007AFF', '#0051D5']} style={styles.kpiCard}>
            <Text style={styles.kpiIcon}>💰</Text>
            <Text style={styles.kpiValue}>
              {stats.loyaltyFund.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Fond fidélité (FCFA)</Text>
          </LinearGradient>

          <LinearGradient colors={['#FF3B30', '#DC2626']} style={styles.kpiCard}>
            <Text style={styles.kpiIcon}>💸</Text>
            <Text style={styles.kpiValue}>
              {stats.totalPaidByPipo.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Payé par Pipo (FCFA)</Text>
          </LinearGradient>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminLoyaltyUsers')}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionText}>Utilisateurs</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminLoyaltyTransactions')}
            >
              <LinearGradient
                colors={['#11998e', '#38ef7d']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Transactions</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminLoyaltySettings')}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionText}>Paramètres</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminLoyaltyRewards')}
            >
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>🎁</Text>
                <Text style={styles.actionText}>Récompenses</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* DISTRIBUTION PAR NIVEAU */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Distribution par niveau</Text>
          {loyaltyConfig.levels.map((level) => {
            const count = levelDistribution[level.name] || 0;
            const percentage =
              stats.totalUsers > 0
                ? ((count / stats.totalUsers) * 100).toFixed(1)
                : 0;

            return (
              <View key={level.name} style={styles.levelCard}>
                <View style={styles.levelHeader}>
                  <Text style={styles.levelIcon}>{level.icon}</Text>
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelName}>{level.name}</Text>
                    <Text style={styles.levelRange}>
                      {level.minPoints.toLocaleString()} -{' '}
                      {level.maxPoints === Infinity
                        ? '∞'
                        : level.maxPoints.toLocaleString()}{' '}
                      points
                    </Text>
                  </View>
                  <View style={styles.levelStats}>
                    <Text style={styles.levelCount}>{count}</Text>
                    <Text style={styles.levelPercentage}>{percentage}%</Text>
                  </View>
                </View>
                <View style={styles.levelProgressBar}>
                  <View
                    style={[
                      styles.levelProgressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: level.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* TOP UTILISATEURS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top 10 utilisateurs</Text>
          {topUsers.map((user, index) => (
            <View key={user.id} style={styles.topUserCard}>
              <View
                style={[
                  styles.topUserRank,
                  index < 3 && styles.topUserRankPodium,
                ]}
              >
                <Text style={styles.topUserRankText}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </Text>
              </View>
              <View style={styles.topUserInfo}>
                <Text style={styles.topUserName}>{user.name}</Text>
                <Text style={styles.topUserPoints}>
                  {user.points.toLocaleString()} points
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* TRANSACTIONS RÉCENTES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Transactions récentes</Text>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionIconText}>
                  {transaction.type === 'earned' ? '➕' : '➖'}
                </Text>
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionUser}>
                  {transaction.userName}
                </Text>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {transaction.createdAt
                    ?.toDate()
                    .toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionPoints,
                  transaction.type === 'earned' && styles.transactionPointsPositive,
                ]}
              >
                {transaction.type === 'earned' ? '+' : '-'}
                {transaction.points}
              </Text>
            </View>
          ))}
        </View>

        {/* SANTÉ DU SYSTÈME */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🩺 Santé du système</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Fond de fidélité</Text>
              <Text
                style={[
                  styles.healthValue,
                  {
                    color:
                      stats.loyaltyFund > 100000
                        ? '#34C759'
                        : stats.loyaltyFund > 50000
                        ? '#FF9500'
                        : '#FF3B30',
                  },
                ]}
              >
                {stats.loyaltyFund.toLocaleString()} FCFA
              </Text>
              <Text style={styles.healthStatus}>
                {stats.loyaltyFund > 100000
                  ? '✅ Excellent'
                  : stats.loyaltyFund > 50000
                  ? '⚠️ Attention'
                  : '🚨 Critique'}
              </Text>
            </View>

            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Récompenses actives</Text>
              <Text style={styles.healthValue}>{stats.activeRewards}</Text>
              <Text style={styles.healthStatus}>
                {stats.activeRewards < 10 ? '✅ Normal' : '⚠️ Élevé'}
              </Text>
            </View>

            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Points échangés</Text>
              <Text style={styles.healthValue}>
                {stats.totalRedeemed.toLocaleString()}
              </Text>
              <Text style={styles.healthStatus}>📊 Activité</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666', fontWeight: '500' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { fontSize: 28, color: 'white', fontWeight: 'bold' },
  headerCenter: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: { fontSize: 24 },

  content: { flex: 1 },

  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  kpiCard: {
    width: (width - 36) / 2,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  kpiIcon: { fontSize: 36, marginBottom: 8 },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 36, color: 'white', marginBottom: 8 },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  levelCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelIcon: { fontSize: 32, marginRight: 12 },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  levelRange: { fontSize: 12, color: '#666' },
  levelStats: { alignItems: 'flex-end' },
  levelCount: { fontSize: 20, fontWeight: 'bold', color: '#9333EA' },
  levelPercentage: { fontSize: 12, color: '#666', marginTop: 2 },
  levelProgressBar: {
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: { height: '100%', borderRadius: 3 },

  topUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topUserRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topUserRankPodium: { backgroundColor: '#FFD700' },
  topUserRankText: { fontSize: 18, fontWeight: 'bold' },
  topUserInfo: { flex: 1 },
  topUserName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  topUserPoints: { fontSize: 13, color: '#666', fontWeight: '500' },

  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: { fontSize: 20 },
  transactionInfo: { flex: 1 },
  transactionUser: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  transactionDescription: { fontSize: 13, color: '#666', marginBottom: 4 },
  transactionDate: { fontSize: 11, color: '#999' },
  transactionPoints: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30' },
  transactionPointsPositive: { color: '#34C759' },

  healthCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthItem: { marginBottom: 16 },
  healthLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  healthValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  healthStatus: { fontSize: 13, color: '#666' },
});