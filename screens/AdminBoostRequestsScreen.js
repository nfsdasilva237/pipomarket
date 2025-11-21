// screens/AdminBoostRequestsScreen.js - Gestion des demandes de boost
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getPendingBoostRequests,
  getAllBoostRequests,
  approveBoostRequest,
  rejectBoostRequest,
  BOOST_TYPES,
} from '../utils/boostService';

const COLORS = {
  primary: '#FF9500',
  success: '#34C759',
  danger: '#FF3B30',
  dark: '#1a1a1a',
  light: '#f8f9fa',
};

export default function AdminBoostRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      let data;
      if (filter === 'all') {
        data = await getAllBoostRequests();
      } else {
        data = await getAllBoostRequests(filter);
      }
      setRequests(data);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      Alert.alert('Erreur', 'Impossible de charger les demandes de boost');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = (request) => {
    Alert.alert(
      'Approuver le boost',
      `Confirmer l'activation du boost "${request.boostName}" pour "${request.productName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          style: 'default',
          onPress: async () => {
            try {
              const result = await approveBoostRequest(request.id);
              if (result.success) {
                Alert.alert('Succès', `Boost activé jusqu'au ${result.expiresAt.toLocaleDateString('fr-FR')}`);
                loadRequests();
              }
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleReject = (request) => {
    Alert.alert(
      'Rejeter la demande',
      `Rejeter la demande de boost pour "${request.productName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectBoostRequest(request.id, 'Paiement non reçu');
              Alert.alert('Succès', 'Demande rejetée');
              loadRequests();
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'En attente', color: '#FF9500', icon: '⏳' };
      case 'approved':
        return { text: 'Approuvé', color: '#34C759', icon: '✅' };
      case 'rejected':
        return { text: 'Rejeté', color: '#FF3B30', icon: '❌' };
      default:
        return { text: status, color: '#999', icon: '❓' };
    }
  };

  const isImageUrl = (img) => img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('file://'));

  const renderRequest = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);
    const createdAt = item.createdAt?.toDate?.() || new Date();

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.productInfo}>
            <View style={styles.productImageBox}>
              {isImageUrl(item.productImage) ? (
                <Image source={{ uri: item.productImage }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <Text style={styles.productEmoji}>{item.productImage || '📦'}</Text>
              )}
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
              <Text style={styles.boostType}>{item.boostName}</Text>
              <Text style={styles.requestDate}>
                {createdAt.toLocaleDateString('fr-FR')} à {createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceValue}>{item.price?.toLocaleString()}</Text>
            <Text style={styles.priceCurrency}>FCFA</Text>
          </View>
        </View>

        <View style={styles.requestFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
            <Text style={styles.statusIcon}>{statusBadge.icon}</Text>
            <Text style={[styles.statusText, { color: statusBadge.color }]}>{statusBadge.text}</Text>
          </View>

          {item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleReject(item)}
              >
                <Text style={styles.rejectBtnText}>Rejeter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleApprove(item)}
              >
                <Text style={styles.approveBtnText}>Approuver</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.referenceBox}>
          <Text style={styles.referenceLabel}>Référence:</Text>
          <Text style={styles.referenceValue}>BOOST-{item.id?.slice(0, 8).toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  const renderFilterTab = (filterValue, label, count) => (
    <TouchableOpacity
      style={[styles.filterTab, filter === filterValue && styles.filterTabActive]}
      onPress={() => setFilter(filterValue)}
    >
      <Text style={[styles.filterTabText, filter === filterValue && styles.filterTabTextActive]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={[styles.filterBadge, filter === filterValue && styles.filterBadgeActive]}>
          <Text style={[styles.filterBadgeText, filter === filterValue && styles.filterBadgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#FF9500', '#FF6B00']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🚀 Demandes de Boost</Text>
          <Text style={styles.headerSubtitle}>
            {filter === 'pending' ? `${requests.length} en attente` : `${requests.length} demande(s)`}
          </Text>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {renderFilterTab('pending', 'En attente', filter === 'pending' ? requests.length : undefined)}
        {renderFilterTab('approved', 'Approuvés')}
        {renderFilterTab('rejected', 'Rejetés')}
        {renderFilterTab('all', 'Tous')}
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des demandes...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Aucune demande</Text>
          <Text style={styles.emptyText}>
            {filter === 'pending' ? 'Aucune demande de boost en attente' : 'Aucune demande trouvée'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadRequests();
              }}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },

  header: {
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backBtnText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  filterTabs: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: { backgroundColor: COLORS.primary },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#666' },
  filterTabTextActive: { color: 'white' },
  filterBadge: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  filterBadgeTextActive: { color: 'white' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },

  listContent: { padding: 16 },

  requestCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productInfo: { flexDirection: 'row', flex: 1 },
  productImageBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: { width: '100%', height: '100%' },
  productEmoji: { fontSize: 28 },
  productDetails: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginBottom: 4 },
  boostType: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  requestDate: { fontSize: 12, color: '#999' },

  priceBox: { alignItems: 'flex-end' },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  priceCurrency: { fontSize: 11, color: '#999' },

  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: { fontSize: 14, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },

  actionButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  rejectBtn: { backgroundColor: COLORS.danger + '15' },
  rejectBtnText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  approveBtn: { backgroundColor: COLORS.success },
  approveBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },

  referenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  referenceLabel: { fontSize: 12, color: '#999', marginRight: 8 },
  referenceValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
});
