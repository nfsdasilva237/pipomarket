// screens/AdminManageAmbassadorsScreen.js - ✅ GESTION PAIEMENTS AMBASSADEURS
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import adminService from '../utils/adminService';
import ambassadorService from '../utils/ambassadorService';

export default function AdminManageAmbassadorsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ambassadors, setAmbassadors] = useState([]);
  const [filteredAmbassadors, setFilteredAmbassadors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, paid

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const isAdmin = await adminService.isAdmin(auth.currentUser?.uid);
      if (!isAdmin) {
        Alert.alert('Accès refusé', 'Vous n\'êtes pas administrateur', [
          { text: 'OK', onPress: () => navigation.replace('Home') }
        ]);
        return;
      }
      loadData();
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      navigation.replace('Home');
    }
  };

  const loadData = async () => {
    try {
      // Charger ambassadeurs
      const ambassadorsResult = await ambassadorService.getAllAmbassadors();
      if (ambassadorsResult.success) {
        setAmbassadors(ambassadorsResult.ambassadors);
        applyFilters(ambassadorsResult.ambassadors, searchQuery, filterStatus);
      }

      // Charger stats
      const statsResult = await ambassadorService.getGlobalAmbassadorStats();
      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (ambassadorsList, search, status) => {
    let filtered = [...ambassadorsList];

    // Filtre par statut
    if (status === 'pending') {
      filtered = filtered.filter(a => (a.pendingPayment || 0) > 0);
    } else if (status === 'paid') {
      filtered = filtered.filter(a => (a.paidOut || 0) > 0);
    }

    // Filtre par recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.name?.toLowerCase().includes(searchLower) ||
        a.email?.toLowerCase().includes(searchLower) ||
        a.code?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredAmbassadors(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(ambassadors, text, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    applyFilters(ambassadors, searchQuery, status);
  };

  const handlePayAmbassador = (ambassador) => {
    if (ambassador.pendingPayment <= 0) {
      Alert.alert('Info', 'Aucun paiement en attente pour cet ambassadeur');
      return;
    }

    Alert.alert(
      'Payer ambassadeur',
      `Payer ${ambassador.pendingPayment.toLocaleString('fr-FR')} FCFA à ${ambassador.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer paiement',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await ambassadorService.payAmbassador(
                ambassador.id,
                ambassador.pendingPayment
              );

              if (result.success) {
                Alert.alert('Succès', 'Paiement effectué avec succès');
                loadData();
              } else {
                Alert.alert('Erreur', result.error || 'Échec du paiement');
              }
            } catch (error) {
              console.error('Erreur paiement:', error);
              Alert.alert('Erreur', 'Impossible d\'effectuer le paiement');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (ambassador) => {
    navigation.navigate('AmbassadorDetails', { ambassadorId: ambassador.id });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderAmbassador = ({ item }) => (
    <View style={styles.ambassadorCard}>
      <View style={styles.ambassadorHeader}>
        <View style={styles.ambassadorHeaderLeft}>
          <Text style={styles.ambassadorIcon}>👤</Text>
          <View>
            <Text style={styles.ambassadorName}>{item.name}</Text>
            <Text style={styles.ambassadorCode}>{item.code}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.active ? '#34C759' : '#8E8E93' }
        ]}>
          <Text style={styles.statusText}>
            {item.active ? 'Actif' : 'Inactif'}
          </Text>
        </View>
      </View>

      <View style={styles.ambassadorStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>Filleuls</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Commandes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {(item.totalEarnings || 0).toLocaleString('fr-FR')}
          </Text>
          <Text style={styles.statLabel}>Total gains</Text>
        </View>
      </View>

      <View style={styles.paymentSection}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentLabel}>En attente:</Text>
          <Text style={[
            styles.paymentValue,
            { color: (item.pendingPayment || 0) > 0 ? '#FF9500' : '#8E8E93' }
          ]}>
            {(item.pendingPayment || 0).toLocaleString('fr-FR')} FCFA
          </Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentLabel}>Payé:</Text>
          <Text style={[styles.paymentValue, { color: '#34C759' }]}>
            {(item.paidOut || 0).toLocaleString('fr-FR')} FCFA
          </Text>
        </View>
      </View>

      <View style={styles.ambassadorActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
          onPress={() => handleViewDetails(item)}
        >
          <Text style={styles.actionButtonText}>👁️ Détails</Text>
        </TouchableOpacity>
        
        {(item.pendingPayment || 0) > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#34C759' }]}
            onPress={() => handlePayAmbassador(item)}
          >
            <Text style={styles.actionButtonText}>💰 Payer</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.email && (
        <Text style={styles.ambassadorEmail}>📧 {item.email}</Text>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Ambassadeurs</Text>
          <Text style={styles.headerSubtitle}>
            {stats?.totalAmbassadors || 0} ambassadeur{(stats?.totalAmbassadors || 0) > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* STATS GLOBALES */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.globalStatCard}>
            <Text style={styles.globalStatValue}>
              {stats.totalEarnings?.toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.globalStatLabel}>Total Gains (FCFA)</Text>
          </View>
          <View style={styles.globalStatCard}>
            <Text style={[styles.globalStatValue, { color: '#FF9500' }]}>
              {stats.pendingPayments?.toLocaleString('fr-FR')}
            </Text>
            <Text style={styles.globalStatLabel}>À Payer (FCFA)</Text>
          </View>
          <View style={styles.globalStatCard}>
            <Text style={styles.globalStatValue}>{stats.totalReferrals || 0}</Text>
            <Text style={styles.globalStatLabel}>Filleuls</Text>
          </View>
        </View>
      )}

      {/* RECHERCHE */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher ambassadeur..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTRES */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
          onPress={() => handleFilterChange('pending')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'pending' && styles.filterChipTextActive]}>
            ⏳ À payer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'paid' && styles.filterChipActive]}
          onPress={() => handleFilterChange('paid')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'paid' && styles.filterChipTextActive]}>
            ✅ Payés
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTE */}
      <FlatList
        data={filteredAmbassadors}
        renderItem={renderAmbassador}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun résultat' : 'Aucun ambassadeur'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Essayez une autre recherche'
                : 'Les ambassadeurs apparaîtront ici'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#8E8E93' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  placeholder: { width: 28 },

  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  globalStatCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  globalStatValue: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  globalStatLabel: { fontSize: 11, color: '#8E8E93', textAlign: 'center' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#000' },
  clearIcon: { fontSize: 20, color: '#8E8E93', paddingLeft: 8 },

  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E5EA' },
  filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  filterChipTextActive: { color: 'white' },

  list: { paddingHorizontal: 16, paddingBottom: 80 },
  
  ambassadorCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  ambassadorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  ambassadorHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ambassadorIcon: { fontSize: 32, marginRight: 12 },
  ambassadorName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  ambassadorCode: { fontSize: 12, color: '#007AFF', fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: 'white' },

  ambassadorStats: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 10 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#8E8E93', textAlign: 'center' },

  paymentSection: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  paymentInfo: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 8, padding: 10 },
  paymentLabel: { fontSize: 11, color: '#8E8E93', marginBottom: 4 },
  paymentValue: { fontSize: 14, fontWeight: 'bold' },

  ambassadorActions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: 'white' },

  ambassadorEmail: { fontSize: 12, color: '#8E8E93', marginTop: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
});