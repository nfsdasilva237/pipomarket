// screens/AdminSubscriptionsScreen.js - ✅ VERSION FINALE COMPLÈTE
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
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

      // ✅ Enrichir avec les données de startup
      const enrichedSubs = await Promise.all(
        subs.map(async (sub) => {
          try {
            const startupDoc = await getDoc(doc(db, 'startups', sub.startupId));
            const startupData = startupDoc.exists() ? startupDoc.data() : {};
            return {
              ...sub,
              startupName: startupData.name || 'Startup inconnue',
              startupEmail: startupData.ownerEmail || startupData.email || 'N/A',
            };
          } catch (error) {
            console.error('Erreur chargement startup:', error);
            return {
              ...sub,
              startupName: 'Startup inconnue',
              startupEmail: 'N/A',
            };
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
      '✅ Activer abonnement',
      `Confirmer l'activation de l'abonnement pour "${subscription.startupName}" ?\n\nPlan: ${subscription.selectedPlanName}\nPrix: ${subscription.selectedPrice?.toLocaleString()} FCFA/mois\n\n⚠️ Cette action indique que le paiement a été vérifié et validé.`,
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
                Alert.alert('✅ Succès', 'Abonnement activé avec succès !');
                loadData();
              } else {
                throw new Error(result.error);
              }
            } catch (error) {
              console.error('Erreur activation:', error);
              Alert.alert('Erreur', error.message || 'Impossible d\'activer l\'abonnement');
            }
          },
        },
      ]
    );
  };

  const handleSuspendSubscription = (subscription) => {
    Alert.alert(
      '⏸️ Suspendre abonnement',
      `Voulez-vous vraiment suspendre l'abonnement de "${subscription.startupName}" ?\n\n⚠️ La startup ne pourra plus accéder aux fonctionnalités premium.`,
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
                Alert.alert('✅ Suspendu', 'Abonnement suspendu avec succès');
                loadData();
              } else {
                throw new Error(result.error);
              }
            } catch (error) {
              console.error('Erreur suspension:', error);
              Alert.alert('Erreur', error.message || 'Impossible de suspendre');
            }
          },
        },
      ]
    );
  };

  const handleExtendSubscription = async (subscription) => {
    Alert.alert(
      '📅 Prolonger abonnement',
      `Prolonger l'abonnement de "${subscription.startupName}" de 30 jours ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Prolonger',
          onPress: async () => {
            try {
              const result = await subscriptionService.extendSubscription(
                subscription.id,
                30 // jours
              );

              if (result.success) {
                Alert.alert('✅ Prolongé', 'Abonnement prolongé de 30 jours');
                loadData();
              } else {
                throw new Error(result.error);
              }
            } catch (error) {
              console.error('Erreur prolongation:', error);
              Alert.alert('Erreur', error.message || 'Impossible de prolonger');
            }
          },
        },
      ]
    );
  };

  const getFilteredSubscriptions = () => {
    if (selectedTab === 'all') return subscriptions;
    if (selectedTab === 'pending') return subscriptions.filter(s => s.status === 'pending_payment');
    return subscriptions.filter(s => s.status === selectedTab);
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
        return '🎁 Essai';
      case 'active':
        return '✅ Actif';
      case 'pending_payment':
        return '⏳ En attente';
      case 'suspended':
        return '⏸️ Suspendu';
      case 'expired':
        return '❌ Expiré';
      case 'cancelled':
        return '🚫 Annulé';
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

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
    const now = new Date();
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const renderSubscription = ({ item }) => {
    const daysRemaining = getDaysRemaining(item.currentPeriodEnd);

    return (
      <View style={styles.card}>
        {/* HEADER */}
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

        {/* BODY */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>📦 Plan actuel:</Text>
            <Text style={styles.value}>{item.currentPlanName || 'Gratuit'}</Text>
          </View>

          {item.status === 'pending_payment' && item.selectedPlanName && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>💳 Plan choisi:</Text>
              <Text style={styles.value}>
                {item.selectedPlanName} ({item.selectedPrice?.toLocaleString()} F)
              </Text>
            </View>
          )}

          {item.currentPeriodEnd && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>📅 Fin période:</Text>
              <Text style={styles.value}>
                {formatDate(item.currentPeriodEnd)}
                {daysRemaining > 0 && ` (${daysRemaining}j restants)`}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>🔌 Actif:</Text>
            <Text
              style={[
                styles.value,
                { color: item.isActive ? '#34C759' : '#FF3B30' },
              ]}
            >
              {item.isActive ? '✅ Oui' : '❌ Non'}
            </Text>
          </View>

          {item.createdAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>🕐 Créé le:</Text>
              <Text style={styles.value}>{formatDate(item.createdAt)}</Text>
            </View>
          )}
        </View>

        {/* ACTIONS */}
        <View style={styles.cardActions}>
          {(item.status === 'pending_payment' || item.status === 'suspended') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.activateButton]}
              onPress={() => handleActivateSubscription(item)}
            >
              <Text style={styles.actionButtonText}>
                {item.status === 'suspended' ? '▶️ Réactiver' : '✅ Activer'}
              </Text>
            </TouchableOpacity>
          )}

          {(item.status === 'active' || item.status === 'trial') && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.extendButton]}
                onPress={() => handleExtendSubscription(item)}
              >
                <Text style={styles.actionButtonTextSecondary}>📅 +30j</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.suspendButton]}
                onPress={() => handleSuspendSubscription(item)}
              >
                <Text style={styles.actionButtonText}>⏸️ Suspendre</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Chargement des abonnements...</Text>
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
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>💳 Gestion Abonnements</Text>
            <Text style={styles.headerSubtitle}>
              {subscriptions.length} abonnement{subscriptions.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}
          >
            🌐 Tous ({subscriptions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'pending' && styles.tabTextActive,
            ]}
          >
            ⏳ En attente (
            {subscriptions.filter((s) => s.status === 'pending_payment').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'trial' && styles.tabActive]}
          onPress={() => setSelectedTab('trial')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'trial' && styles.tabTextActive]}
          >
            🎁 Essai ({subscriptions.filter((s) => s.status === 'trial').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'active' && styles.tabTextActive,
            ]}
          >
            ✅ Actifs ({subscriptions.filter((s) => s.status === 'active').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'suspended' && styles.tabActive]}
          onPress={() => setSelectedTab('suspended')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'suspended' && styles.tabTextActive,
            ]}
          >
            ⏸️ Suspendus (
            {subscriptions.filter((s) => s.status === 'suspended').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* STATS */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {subscriptions.filter((s) => s.status === 'pending_payment').length}
          </Text>
          <Text style={styles.statLabel}>⏳ En attente</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {subscriptions.filter((s) => s.isActive).length}
          </Text>
          <Text style={styles.statLabel}>✅ Actifs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {subscriptions.filter((s) => s.status === 'suspended').length}
          </Text>
          <Text style={styles.statLabel}>⏸️ Suspendus</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {subscriptions.filter((s) => s.status === 'trial').length}
          </Text>
          <Text style={styles.statLabel}>🎁 Essai</Text>
        </View>
      </View>

      {/* LISTE */}
      <FlatList
        data={getFilteredSubscriptions()}
        renderItem={renderSubscription}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#9333EA"
            colors={['#9333EA']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Aucun abonnement</Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'all'
                ? 'Aucun abonnement enregistré pour le moment'
                : `Aucun abonnement avec le statut "${selectedTab}"`}
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
    padding: 20,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666', fontWeight: '500' },

  header: { paddingHorizontal: 20, paddingVertical: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },

  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  tabActive: { backgroundColor: '#9333EA' },
  tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
  tabTextActive: { color: 'white' },

  stats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#9333EA' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' },

  list: { padding: 16 },
  
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  startupInfo: { flex: 1, marginRight: 12 },
  startupName: { fontSize: 17, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  startupEmail: { fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  cardBody: { marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 14, color: '#8E8E93', flex: 1 },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateButton: { backgroundColor: '#34C759' },
  extendButton: { backgroundColor: '#F2F2F7' },
  suspendButton: { backgroundColor: '#FF3B30' },
  actionButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  actionButtonTextSecondary: { color: '#007AFF', fontSize: 14, fontWeight: 'bold' },

  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});