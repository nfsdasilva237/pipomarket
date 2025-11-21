// screens/AdminLoyaltyTransactionsScreen.js - ✅ HISTORIQUE TRANSACTIONS

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
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';

export default function AdminLoyaltyTransactionsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, earned, redeemed

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      let q;
      if (filter === 'all') {
        q = query(
          collection(db, 'pointsHistory'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      } else {
        q = query(
          collection(db, 'pointsHistory'),
          where('type', '==', filter),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      const transactionsData = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Récupérer info utilisateur
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        const userName = userDoc.exists()
          ? userDoc.data().fullName || 'Utilisateur'
          : 'Utilisateur';

        transactionsData.push({
          id: docSnap.id,
          ...data,
          userName,
        });
      }

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTransactionIcon = (type) => {
    return type === 'earned' ? '➕' : '➖';
  };

  const getTransactionColor = (type) => {
    return type === 'earned' ? '#34C759' : '#FF3B30';
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <View
        style={[
          styles.transactionIcon,
          { backgroundColor: `${getTransactionColor(item.type)}20` },
        ]}
      >
        <Text style={styles.transactionIconText}>{getTransactionIcon(item.type)}</Text>
      </View>

      <View style={styles.transactionInfo}>
        <Text style={styles.transactionUser}>{item.userName}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>
            {item.createdAt?.toDate().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {item.orderAmount && (
            <Text style={styles.transactionAmount}>
              💰 {item.orderAmount.toLocaleString()} FCFA
            </Text>
          )}
        </View>
      </View>

      <View style={styles.transactionPoints}>
        <Text
          style={[
            styles.pointsValue,
            { color: getTransactionColor(item.type) },
          ]}
        >
          {item.type === 'earned' ? '+' : '-'}
          {item.points}
        </Text>
        <Text style={styles.pointsLabel}>points</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Chargement...</Text>
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
          <Text style={styles.headerTitle}>📊 Transactions</Text>
          <Text style={styles.headerSubtitle}>
            {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={loadTransactions} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* FILTRES */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'earned' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('earned')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'earned' && styles.filterTextActive,
            ]}
          >
            ➕ Gagnés
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'redeemed' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('redeemed')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'redeemed' && styles.filterTextActive,
            ]}
          >
            ➖ Échangés
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTE */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTransactions();
            }}
            tintColor="#9333EA"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Aucune transaction</Text>
            <Text style={styles.emptyText}>
              Les transactions apparaîtront ici
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },

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

  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: { backgroundColor: '#9333EA' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTextActive: { color: 'white' },

  list: { padding: 20 },

  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: { fontSize: 24 },
  transactionInfo: { flex: 1 },
  transactionUser: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDescription: { fontSize: 13, color: '#666', marginBottom: 6 },
  transactionMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionDate: { fontSize: 11, color: '#999' },
  transactionAmount: { fontSize: 11, color: '#9333EA', fontWeight: '600' },
  transactionPoints: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 20, fontWeight: 'bold' },
  pointsLabel: { fontSize: 11, color: '#666', marginTop: 2 },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
});