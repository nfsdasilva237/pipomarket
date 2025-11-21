// screens/AdminManageAmbassadorCodesScreen.js - ✅ GESTION CODES AMBASSADEURS
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
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import adminService from '../utils/adminService';
import ambassadorService from '../utils/ambassadorService';

export default function AdminManageAmbassadorCodesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [codes, setCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, available, used, disabled

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
      loadCodes();
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      navigation.replace('Home');
    }
  };

  const loadCodes = async () => {
    try {
      const codesData = await ambassadorService.getAllInviteCodes();
      
      // Trier par date (plus récents d'abord)
      codesData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setCodes(codesData);
      applyFilters(codesData, searchQuery, filterStatus);
    } catch (error) {
      console.error('Erreur chargement codes:', error);
      Alert.alert('Erreur', 'Impossible de charger les codes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (codesList, search, status) => {
    let filtered = [...codesList];

    // Filtre par statut
    if (status === 'available') {
      filtered = filtered.filter(c => !c.used && !c.disabled);
    } else if (status === 'used') {
      filtered = filtered.filter(c => c.used === true);
    } else if (status === 'disabled') {
      filtered = filtered.filter(c => c.disabled === true && !c.used);
    }

    // Filtre par recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.code?.toLowerCase().includes(searchLower) ||
        c.ambassadorName?.toLowerCase().includes(searchLower) ||
        c.ambassadorEmail?.toLowerCase().includes(searchLower) ||
        c.usedByEmail?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCodes(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(codes, text, filterStatus);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    applyFilters(codes, searchQuery, status);
  };

  const handleToggleCode = async (codeId, code, isDisabled) => {
    const result = await ambassadorService.toggleInviteCode(codeId, isDisabled);
    if (result.success) {
      Alert.alert('Succès', `Code ${isDisabled ? 'activé' : 'désactivé'}`);
      loadCodes();
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleDeleteCode = (codeId, code) => {
    Alert.alert(
      'Supprimer code',
      `Supprimer le code "${code}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const result = await ambassadorService.deleteInviteCode(codeId);
            if (result.success) {
              Alert.alert('Succès', 'Code supprimé');
              loadCodes();
            } else {
              Alert.alert('Erreur', result.error);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCodes();
  };

  const stats = {
    total: codes.length,
    available: codes.filter(c => !c.used && !c.disabled).length,
    used: codes.filter(c => c.used).length,
    disabled: codes.filter(c => c.disabled && !c.used).length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Chargement des codes...</Text>
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
          <Text style={styles.headerTitle}>Codes Ambassadeur</Text>
          <Text style={styles.headerSubtitle}>{stats.total} code{stats.total > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.createCodeButton}
          onPress={() => navigation.navigate('AdminCreateAmbassadorCode')}
        >
          <Text style={styles.createCodeButtonText}>+</Text>
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
            <Text style={styles.statValue}>{stats.available}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.used}</Text>
            <Text style={styles.statLabel}>Utilisés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.disabled}</Text>
            <Text style={styles.statLabel}>Désactivés</Text>
          </View>
        </View>

        {/* RECHERCHE */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un code, nom, email..."
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
            style={[styles.filterChip, filterStatus === 'available' && styles.filterChipActive]}
            onPress={() => handleFilterChange('available')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'available' && styles.filterChipTextActive]}>
              ✅ Disponibles ({stats.available})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'used' && styles.filterChipActive]}
            onPress={() => handleFilterChange('used')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'used' && styles.filterChipTextActive]}>
              🎯 Utilisés ({stats.used})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'disabled' && styles.filterChipActive]}
            onPress={() => handleFilterChange('disabled')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'disabled' && styles.filterChipTextActive]}>
              ❌ Désactivés ({stats.disabled})
            </Text>
          </TouchableOpacity>
        </View>

        {/* LISTE CODES */}
        {filteredCodes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤝</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun résultat' : 'Aucun code'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Essayez une autre recherche'
                : 'Créez votre premier code ambassadeur'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AdminCreateAmbassadorCode')}
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
                  <View style={styles.codeIconContainer}>
                    <Text style={styles.codeIcon}>🎫</Text>
                  </View>
                  <View>
                    <Text style={styles.codeName}>{code.code}</Text>
                    {code.ambassadorName && (
                      <Text style={styles.codeAmbassadorName}>
                        👤 {code.ambassadorName}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: code.used 
                      ? '#FF6B9D' 
                      : code.disabled 
                        ? '#8E8E93' 
                        : '#34C759' 
                  }
                ]}>
                  <Text style={styles.statusText}>
                    {code.used ? 'Utilisé' : code.disabled ? 'Désactivé' : 'Disponible'}
                  </Text>
                </View>
              </View>

              {/* DÉTAILS */}
              <View style={styles.codeDetails}>
                {code.ambassadorEmail && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>✉️ Email ambassadeur:</Text>
                    <Text style={styles.detailValue}>{code.ambassadorEmail}</Text>
                  </View>
                )}

                {code.ambassadorPhone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📱 Téléphone:</Text>
                    <Text style={styles.detailValue}>{code.ambassadorPhone}</Text>
                  </View>
                )}

                {code.used && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>🎯 Utilisé par:</Text>
                      <Text style={styles.detailValue}>
                        {code.usedByEmail || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>📅 Date utilisation:</Text>
                      <Text style={styles.detailValue}>
                        {code.usedAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                      </Text>
                    </View>
                  </>
                )}

                {!code.used && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 Créé le:</Text>
                    <Text style={styles.detailValue}>
                      {code.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                    </Text>
                  </View>
                )}

                {code.notes && (
                  <View style={styles.notesRow}>
                    <Text style={styles.notesLabel}>📝 Notes:</Text>
                    <Text style={styles.notesText}>{code.notes}</Text>
                  </View>
                )}
              </View>

              {/* ACTIONS */}
              <View style={styles.codeActions}>
                {!code.used && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: code.disabled ? '#34C759' : '#FF9500' }
                    ]}
                    onPress={() => handleToggleCode(code.id, code.code, code.disabled)}
                  >
                    <Text style={styles.actionButtonText}>
                      {code.disabled ? '🔓 Activer' : '🔒 Désactiver'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                  onPress={() => handleDeleteCode(code.id, code.code)}
                >
                  <Text style={styles.actionButtonText}>🗑️ Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: Math.max(insets.bottom + 20, 80) }} />
      </ScrollView>

      {/* BOUTON FLOTTANT */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('AdminCreateAmbassadorCode')}
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

  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E5EA' 
  },
  backButton: { fontSize: 28, color: '#4ECDC4' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  createCodeButton: { 
    width: 40, 
    height: 40, 
    backgroundColor: '#4ECDC4', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createCodeButtonText: { fontSize: 24, color: 'white', fontWeight: 'bold' },

  content: { flex: 1 },

  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2 
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#4ECDC4', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8E8E93' },

  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E5EA' 
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#000' },
  clearIcon: { fontSize: 20, color: '#8E8E93', paddingLeft: 8 },

  filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8, flexWrap: 'wrap' },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: '#E5E5EA' 
  },
  filterChipActive: { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  filterChipTextActive: { color: 'white' },

  codeCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 12, 
    borderRadius: 16, 
    padding: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 3 
  },

  codeHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F7' 
  },
  codeHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  codeIconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#E0F7F5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  codeIcon: { fontSize: 24 },
  codeName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 2, fontFamily: 'monospace' },
  codeAmbassadorName: { fontSize: 13, color: '#4ECDC4', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: 'white' },

  codeDetails: { marginBottom: 16 },
  detailRow: { marginBottom: 8 },
  detailLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#000' },

  notesRow: { 
    marginTop: 8, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#F2F2F7' 
  },
  notesLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  notesText: { fontSize: 13, color: '#666', lineHeight: 18 },

  codeActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: 'white' },

  emptyState: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80,
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8E8E93', marginBottom: 24, textAlign: 'center' },
  emptyButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },

  fabButton: { 
    position: 'absolute', 
    bottom: 24, 
    right: 24, 
    backgroundColor: '#4ECDC4', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 8 
  },
  fabButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});