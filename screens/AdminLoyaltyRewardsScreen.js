// screens/AdminLoyaltyRewardsScreen.js - ✅ GESTION RÉCOMPENSES ACTIVES

import { LinearGradient } from 'expo-linear-gradient';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';

export default function AdminLoyaltyRewardsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, used, expired

  useEffect(() => {
    loadRewards();
  }, [filter]);

  const loadRewards = async () => {
    try {
      setLoading(true);

      let q;
      if (filter === 'all') {
        q = query(collection(db, 'userRewards'));
      } else if (filter === 'active') {
        q = query(collection(db, 'userRewards'), where('used', '==', false));
      } else if (filter === 'used') {
        q = query(collection(db, 'userRewards'), where('used', '==', true));
      }

      const snapshot = await getDocs(q);
      const rewardsData = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Récupérer info utilisateur
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        const userName = userDoc.exists()
          ? userDoc.data().fullName || 'Utilisateur'
          : 'Utilisateur';

        // Vérifier expiration
        const now = new Date();
        const expiresAt = data.expiresAt?.toDate
          ? data.expiresAt.toDate()
          : new Date(data.expiresAt);
        const isExpired = expiresAt < now;

        rewardsData.push({
          id: docSnap.id,
          ...data,
          userName,
          isExpired,
        });
      }

      // Filtrer expirés si demandé
      let filtered = rewardsData;
      if (filter === 'expired') {
        filtered = rewardsData.filter((r) => r.isExpired);
      }

      setRewards(filtered);
    } catch (error) {
      console.error('Erreur chargement récompenses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRevokeReward = (reward) => {
    Alert.alert(
      'Révoquer récompense',
      `Voulez-vous révoquer cette récompense pour ${reward.userName} ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'userRewards', reward.id), {
                used: true,
                usedAt: new Date(),
                revokedByAdmin: true,
              });

              Alert.alert('Succès', 'Récompense révoquée');
              loadRewards();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de révoquer');
            }
          },
        },
      ]
    );
  };

  const getRewardStatusColor = (reward) => {
    if (reward.used) return '#FF3B30';
    if (reward.isExpired) return '#FF9500';
    return '#34C759';
  };

  const getRewardStatusText = (reward) => {
    if (reward.used) return '✅ Utilisée';
    if (reward.isExpired) return '⏰ Expirée';
    return '🎁 Active';
  };

  const renderReward = ({ item }) => (
    <View style={styles.rewardCard}>
      <View style={styles.rewardHeader}>
        <Text style={styles.rewardIcon}>{item.icon || '🎁'}</Text>
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{item.rewardName}</Text>
          <Text style={styles.rewardUser}>👤 {item.userName}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getRewardStatusColor(item) },
          ]}
        >
          <Text style={styles.statusText}>{getRewardStatusText(item)}</Text>
        </View>
      </View>

      <View style={styles.rewardDetails}>
        <View style={styles.rewardDetailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{item.rewardType}</Text>
        </View>

        <View style={styles.rewardDetailRow}>
          <Text style={styles.detailLabel}>Valeur:</Text>
          <Text style={styles.detailValue}>
            {item.rewardType === 'discount'
              ? `${item.rewardValue}%`
              : `${item.rewardValue?.toLocaleString()} FCFA`}
          </Text>
        </View>

        <View style={styles.rewardDetailRow}>
          <Text style={styles.detailLabel}>Points dépensés:</Text>
          <Text style={styles.detailValue}>{item.pointsSpent}</Text>
        </View>

        <View style={styles.rewardDetailRow}>
          <Text style={styles.detailLabel}>Échangée le:</Text>
          <Text style={styles.detailValue}>
            {item.redeemedAt?.toDate().toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {item.expiresAt && (
          <View style={styles.rewardDetailRow}>
            <Text style={styles.detailLabel}>Expire le:</Text>
            <Text
              style={[
                styles.detailValue,
                item.isExpired && { color: '#FF3B30' },
              ]}
            >
              {item.expiresAt?.toDate
                ? item.expiresAt.toDate().toLocaleDateString('fr-FR')
                : new Date(item.expiresAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}

        {item.usedAt && (
          <View style={styles.rewardDetailRow}>
            <Text style={styles.detailLabel}>Utilisée le:</Text>
            <Text style={styles.detailValue}>
              {item.usedAt?.toDate
                ? item.usedAt.toDate().toLocaleDateString('fr-FR')
                : new Date(item.usedAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}
      </View>

      {!item.used && !item.isExpired && (
        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => handleRevokeReward(item)}
        >
          <Text style={styles.revokeButtonText}>🚫 Révoquer</Text>
        </TouchableOpacity>
      )}
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
          <Text style={styles.headerTitle}>🎁 Récompenses</Text>
          <Text style={styles.headerSubtitle}>
            {rewards.length} récompense{rewards.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={loadRewards} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* FILTRES */}
      <View style={styles.filterContainer}>
        {['all', 'active', 'used', 'expired'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'all'
                ? 'Toutes'
                : f === 'active'
                ? '🎁 Actives'
                : f === 'used'
                ? '✅ Utilisées'
                : '⏰ Expirées'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTE */}
      <FlatList
        data={rewards}
        renderItem={renderReward}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRewards();
            }}
            tintColor="#9333EA"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>Aucune récompense</Text>
            <Text style={styles.emptyText}>
              Les récompenses échangées apparaîtront ici
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: { backgroundColor: '#9333EA' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTextActive: { color: 'white' },

  list: { padding: 20 },

  rewardCard: {
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
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  rewardIcon: { fontSize: 36, marginRight: 12 },
  rewardInfo: { flex: 1 },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  rewardUser: { fontSize: 13, color: '#666' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: 'bold', color: 'white' },

  rewardDetails: { marginBottom: 12 },
  rewardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },

  revokeButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  revokeButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

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