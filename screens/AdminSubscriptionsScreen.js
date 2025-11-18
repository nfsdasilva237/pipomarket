// screens/AdminSubscriptionsScreen.js - GESTION ABONNEMENTS PAR ADMIN
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
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { subscriptionService } from '../utils/subscriptionService';

export default function AdminSubscriptionsScreen({ navigation }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // all, pending, trial, active, suspended

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [subs, payments] = await Promise.all([
        subscriptionService.getAllSubscriptions(),
        subscriptionService.getPendingPayments(),
      ]);

      // Enrichir avec les données de startup
      const enrichedSubs = await Promise.all(
        subs.map(async (sub) => {
          try {
            const startupDoc = await getDoc(doc(db, 'startups', sub.startupId));
            const startupData = startupDoc.exists() ? startupDoc.data() : {};
            return {
              ...sub,
              startupName: startupData.name || 'Startup inconnue',
              startupEmail: startupData.email || 'N/A',
            };
          } catch (error) {
            console.error('Erreur chargement startup:', error);
            return sub;
          }
        })
      );

      setSubscriptions(enrichedSubs);
      setPendingPayments(payments);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleActivateSubscription = (subscription) => {
    Alert.alert(
      'Activer abonnement',
      `Confirmer l'activation de l'abonnement pour ${subscription.startupName} ?\n\nPlan: ${subscription.selectedPlanName}\nPrix: ${subscription.selectedPrice?.toLocaleString()} F`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Activer',
          onPress: async () => {
            try {
              const result = await subscriptionService.activateSubscription(
                subscription.id,
                auth.currentUser?.uid
              );

              if (result.success) {
                Alert.alert('✅ Activé', 'Abonnement activé avec succès');
                loadData();
              } else {
                throw new Error(result.error);
              }
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleSuspendSubscription = (subscription) => {
    Alert.alert(
      'Suspendre abonnement',
      `Voulez-vous vraiment suspendre l'abonnement de ${subscription.startupName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Suspendre',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await subscriptionService.suspendSubscription(
                subscription.id
              );

              if (result.success) {
                Alert.alert('✅ Suspendu', 'Abonnement suspendu');
                loadData();
              } else {
                throw new Error(result.error);
              }
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const getFilteredSubscriptions = () => {
    if (selectedTab === 'all') return subscriptions;
    return subscriptions.filter((s) => s.status === selectedTab);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'trial':
        return '#34C759';
      case 'active':
        return '#007AFF';
      case 'pending_payment':
        return '#FF9500';
      case 'suspended':
        return '#FF3B30';
      case 'expired':
        return '#8E8E93';
      case 'cancelled':
        return '#666';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'trial':
        return 'Essai';
      case 'active':
        return 'Actif';
      case 'pending_payment':
        return 'En attente paiement';
      case 'suspended':
        return 'Suspendu';
      case 'expired':
        return 'Expiré';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderSubscription = ({ item }) => {
    const daysRemaining = item.currentPeriodEnd
      ? Math.ceil(
          (new Date(item.currentPeriodEnd.toDate ? item.currentPeriodEnd.toDate() : item.currentPeriodEnd) -
            new Date()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.startupInfo}>
            <Text style={styles.startupName}>{item.startupName}</Text>
            <Text style={styles.startupEmail}>{item.startupEmail}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Plan actuel:</Text>
            <Text style={styles.value}>{item.currentPlanName || 'N/A'}</Text>
          </View>

          {item.status === 'trial' && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Plan choisi:</Text>
              <Text style={styles.value}>
                {item.selectedPlanName} ({item.selectedPrice?.toLocaleString()} F)
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Fin période:</Text>
            <Text style={styles.value}>
              {formatDate(item.currentPeriodEnd)}
              {daysRemaining > 0 && ` (${daysRemaining}j restants)`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Actif:</Text>
            <Text style={[styles.value, { color: item.isActive ? '#34C759' : '#FF3B30' }]}>
              {item.isActive ? '✅ Oui' : '❌ Non'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          {(item.status === 'pending_payment' || item.status === 'suspended') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.activateButton]}
              onPress={() => handleActivateSubscription(item)}
            >
              <Text style={styles.actionButtonText}>✅ Activer</Text>
            </TouchableOpacity>
          )}

          {(item.status === 'active' || item.status === 'trial') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.suspendButton]}
              onPress={() => handleSuspendSubscription(item)}
            >
              <Text style={styles.actionButtonText}>🔴 Suspendre</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion Abonnements</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            Tous ({subscriptions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trial' && styles.tabActive]}
          onPress={() => setSelectedTab('trial')}
        >
          <Text style={[styles.tabText, selectedTab === 'trial' && styles.tabTextActive]}>
            Essai ({subscriptions.filter((s) => s.status === 'trial').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending_payment' && styles.tabActive]}
          onPress={() => setSelectedTab('pending_payment')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'pending_payment' && styles.tabTextActive]}
          >
            En attente ({subscriptions.filter((s) => s.status === 'pending_payment').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
            Actifs ({subscriptions.filter((s) => s.status === 'active').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {subscriptions.filter((s) => s.status === 'pending_payment').length}
          </Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {subscriptions.filter((s) => s.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Actifs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {subscriptions.filter((s) => s.status === 'suspended').length}
          </Text>
          <Text style={styles.statLabel}>Suspendus</Text>
        </View>
      </View>

      <FlatList
        data={getFilteredSubscriptions()}
        renderItem={renderSubscription}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun abonnement</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  startupEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#34C759',
  },
  suspendButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
