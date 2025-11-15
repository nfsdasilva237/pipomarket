// screens/AdminManagePromoCodesScreen.js - ✅ GESTION COMPLÈTE CODES PROMO
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import adminService from '../utils/adminService';

export default function AdminManagePromoCodesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promoCodes, setPromoCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

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
      loadPromoCodes();
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      navigation.replace('Home');
    }
  };

  const loadPromoCodes = async () => {
    try {
      const codesSnap = await getDocs(collection(db, 'promoCodes'));
      const codes = codesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Trier par date de création (plus récent d'abord)
      codes.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setPromoCodes(codes);
      applyFilters(codes, searchQuery, filterStatus);
    } catch (error) {
      console.error('Erreur chargement codes promo:', error);
      Alert.alert('Erreur', 'Impossible de charger les codes promo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (codes, search, status) => {
    let filtered = [...codes];

    // Filtre par statut
    if (status === 'active') {
      filtered = filtered.filter(c => c.active === true);
    } else if (status === 'inactive') {
      filtered = filtered.filter(c => c.active === false);
    }

    // Filtre par recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.code?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCodes(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(promoCodes, text, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    applyFilters(promoCodes, searchQuery, status);
  };

  const handleToggleStatus = async (codeId, currentStatus, codeName) => {
    const newStatus = !currentStatus;
    
    Alert.alert(
      newStatus ? 'Activer le code' : 'Désactiver le code',
      `${newStatus ? 'Activer' : 'Désactiver'} le code "${codeName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: newStatus ? 'Activer' : 'Désactiver',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'promoCodes', codeId), {
                active: newStatus,
                updatedAt: new Date(),
              });
              
              Alert.alert('Succès', `Code ${newStatus ? 'activé' : 'désactivé'}`);
              loadPromoCodes();
            } catch (error) {
              console.error('Erreur mise à jour:', error);
              Alert.alert('Erreur', 'Impossible de modifier le code');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (codeId, codeName) => {
    Alert.alert(
      'Supprimer le code',
      `Supprimer définitivement le code "${codeName}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'promoCodes', codeId));
              Alert.alert('Succès', 'Code promo supprimé');
              loadPromoCodes();
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le code');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPromoCodes();
  };

  const getTypeLabel = (type) => {
    const labels = {
      percentage: 'Pourcentage',
      fixed: 'Montant fixe',
      free_shipping: 'Livraison gratuite',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      percentage: '%',
      fixed: '💰',
      free_shipping: '🚚',
    };
    return icons[type] || '🎁';
  };

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter(c => c.active).length,
    inactive: promoCodes.filter(c => !c.active).length,
    totalUses: promoCodes.reduce((sum, c) => sum + (c.currentUses || 0), 0),
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des codes promo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Codes Promo</Text>
          <Text style={styles.headerSubtitle}>{stats.total} code{stats.total > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreatePromoCode')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* STATS RAPIDES */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Inactifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalUses}</Text>
            <Text style={styles.statLabel}>Utilisations</Text>
          </View>
        </View>

        {/* RECHERCHE */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un code..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="characters"
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
              Tous ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
            onPress={() => handleFilterChange('active')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'active' && styles.filterChipTextActive]}>
              ✅ Actifs ({stats.active})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipActive]}
            onPress={() => handleFilterChange('inactive')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'inactive' && styles.filterChipTextActive]}>
              ❌ Inactifs ({stats.inactive})
            </Text>
          </TouchableOpacity>
        </View>

        {/* LISTE CODES */}
        {filteredCodes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun résultat' : 'Aucun code promo'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Essayez une autre recherche'
                : 'Créez votre premier code promo'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('CreatePromoCode')}
              >
                <Text style={styles.emptyButtonText}>+ Créer un code</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredCodes.map((code) => (
            <View key={code.id} style={styles.codeCard}>
              {/* HEADER */}
              <View style={styles.codeHeader}>
                <View style={styles.codeHeaderLeft}>
                  <Text style={styles.codeTypeIcon}>{getTypeIcon(code.type)}</Text>
                  <View>
                    <Text style={styles.codeName}>{code.code}</Text>
                    <Text style={styles.codeType}>{getTypeLabel(code.type)}</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: code.active ? '#34C759' : '#FF3B30' }
                ]}>
                  <Text style={styles.statusText}>
                    {code.active ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </View>

              {/* DÉTAILS */}
              <View style={styles.codeDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Réduction:</Text>
                  <Text style={styles.detailValue}>
                    {code.type === 'percentage' && `${code.value}%`}
                    {code.type === 'fixed' && `${code.value?.toLocaleString('fr-FR')} FCFA`}
                    {code.type === 'free_shipping' && 'Livraison gratuite'}
                  </Text>
                </View>

                {code.minOrderAmount > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Commande min:</Text>
                    <Text style={styles.detailValue}>
                      {code.minOrderAmount?.toLocaleString('fr-FR')} FCFA
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Utilisations:</Text>
                  <Text style={styles.detailValue}>
                    {code.currentUses || 0} / {code.maxUses || '∞'}
                  </Text>
                </View>

                {code.startupId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Startup:</Text>
                    <Text style={styles.detailValue}>{code.startupName || 'N/A'}</Text>
                  </View>
                )}

                {code.firstOrderOnly && (
                  <View style={styles.badgeRow}>
                    <View style={styles.infoBadge}>
                      <Text style={styles.infoBadgeText}>🆕 Nouveaux clients</Text>
                    </View>
                  </View>
                )}

                {code.description && (
                  <View style={styles.descriptionRow}>
                    <Text style={styles.descriptionText}>{code.description}</Text>
                  </View>
                )}
              </View>

              {/* ACTIONS */}
              <View style={styles.codeActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: code.active ? '#FF9500' : '#34C759' }
                  ]}
                  onPress={() => handleToggleStatus(code.id, code.active, code.code)}
                >
                  <Text style={styles.actionButtonText}>
                    {code.active ? '🔒 Désactiver' : '🔓 Activer'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                  onPress={() => handleDelete(code.id, code.code)}
                >
                  <Text style={styles.actionButtonText}>🗑️ Supprimer</Text>
                </TouchableOpacity>
              </View>

              {/* DATES */}
              <View style={styles.codeDates}>
                <Text style={styles.dateText}>
                  Créé: {code.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                </Text>
                {code.endDate && (
                  <Text style={styles.dateText}>
                    Expire: {code.endDate?.toDate?.()?.toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* BOUTON FLOTTANT */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('CreatePromoCode')}
      >
        <Text style={styles.fabButtonText}>+ Créer</Text>
      </TouchableOpacity>
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
  addButton: { width: 40, height: 40, backgroundColor: '#007AFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },

  content: { flex: 1 },

  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8E8E93' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#000' },
  clearIcon: { fontSize: 20, color: '#8E8E93', paddingLeft: 8 },

  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E5EA' },
  filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  filterChipTextActive: { color: 'white' },

  codeCard: { backgroundColor: 'white', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  codeHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  codeTypeIcon: { fontSize: 32, marginRight: 12 },
  codeName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  codeType: { fontSize: 12, color: '#8E8E93' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: 'white' },

  codeDetails: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: '#8E8E93' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#000' },
  
  badgeRow: { flexDirection: 'row', marginTop: 8, marginBottom: 8 },
  infoBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  infoBadgeText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  
  descriptionRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  descriptionText: { fontSize: 13, color: '#666', lineHeight: 18 },

  codeActions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: 'white' },

  codeDates: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  dateText: { fontSize: 11, color: '#8E8E93', marginBottom: 2 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8E8E93', marginBottom: 24, textAlign: 'center' },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },

  fabButton: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
