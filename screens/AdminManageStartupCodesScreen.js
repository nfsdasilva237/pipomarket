// screens/AdminManageStartupCodesScreen.js - GESTION CODES INVITATION STARTUP
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import adminService from '../utils/adminService';
import startupInviteService from '../utils/startupInviteService';

export default function AdminManageStartupCodesScreen({ navigation }) {
    const insets = useSafeAreaInsets(); // ← Ajouté pour SafeAreaInsets
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Form
  const [expirationDays, setExpirationDays] = useState('30');
  const [maxUses, setMaxUses] = useState('1');
  const [notes, setNotes] = useState('');

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
      const [codesData, statsData] = await Promise.all([
        startupInviteService.getAllCodes(),
        startupInviteService.getCodesStats(),
      ]);

      // Trier par date de création (plus récent en premier)
      const sortedCodes = codesData.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });

      setCodes(sortedCodes);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerateCode = async () => {
    const days = parseInt(expirationDays);
    const uses = parseInt(maxUses);

    if (isNaN(days) || days < 1 || days > 365) {
      Alert.alert('Erreur', 'Jours d\'expiration invalides (1-365)');
      return;
    }

    if (isNaN(uses) || uses < 1 || uses > 100) {
      Alert.alert('Erreur', 'Nombre d\'utilisations invalide (1-100)');
      return;
    }

    setLoading(true);

    try {
      const userData = await auth.currentUser;
      const result = await startupInviteService.generateInviteCode(
        userData.uid,
        userData.displayName || userData.email,
        days,
        uses,
        notes
      );

      if (result.success) {
        Alert.alert(
          'Code créé !',
          `Code: ${result.code}\n\nCe code expire dans ${days} jours et peut être utilisé ${uses} fois.`,
          [{ text: 'OK' }]
        );
        setModalVisible(false);
        setNotes('');
        loadData();
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      console.error('Erreur génération code:', error);
      Alert.alert('Erreur', 'Impossible de générer le code');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCode = async (codeId, currentStatus) => {
    try {
      const result = await startupInviteService.toggleCode(codeId, currentStatus);
      if (result.success) {
        loadData();
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le code');
    }
  };

  const handleDeleteCode = async (codeId, code) => {
    Alert.alert(
      'Supprimer le code',
      `Supprimer le code ${code} ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await startupInviteService.deleteCode(codeId);
              if (result.success) {
                Alert.alert('Succès', 'Code supprimé');
                loadData();
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le code');
            }
          },
        },
      ]
    );
  };

  const handleCopyCode = (code) => {
    Alert.alert('Code copié', code);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    const date = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    return new Date() > date;
  };

  const renderCode = ({ item }) => {
    const expired = isExpired(item.expiresAt);
    const exhausted = item.usedCount >= item.maxUses;
    const canUse = item.active && !expired && !exhausted;

    return (
      <View style={styles.codeCard}>
        {/* EN-TÊTE */}
        <View style={styles.codeHeader}>
          <TouchableOpacity
            onPress={() => handleCopyCode(item.code)}
            style={styles.codeCodeContainer}
          >
            <Text style={styles.codeCode}>{item.code}</Text>
            <Text style={styles.copyIcon}>📋</Text>
          </TouchableOpacity>
          <View style={[
            styles.statusBadge,
            canUse ? styles.statusActive :
            expired ? styles.statusExpired :
            exhausted ? styles.statusExhausted :
            styles.statusInactive
          ]}>
            <Text style={styles.statusBadgeText}>
              {canUse ? '✓ Actif' :
               expired ? '⏰ Expiré' :
               exhausted ? '✓ Épuisé' :
               '✗ Inactif'}
            </Text>
          </View>
        </View>

        {/* INFOS */}
        <View style={styles.codeInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créé par:</Text>
            <Text style={styles.infoValue}>{item.createdByName || 'Admin'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créé le:</Text>
            <Text style={styles.infoValue}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expire le:</Text>
            <Text style={[styles.infoValue, expired && styles.expiredText]}>
              {formatDate(item.expiresAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Utilisations:</Text>
            <Text style={[
              styles.infoValue,
              exhausted && styles.exhaustedText
            ]}>
              {item.usedCount} / {item.maxUses}
            </Text>
          </View>
          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}
        </View>

        {/* STARTUPS QUI ONT UTILISÉ */}
        {item.usedBy && item.usedBy.length > 0 && (
          <View style={styles.usedBySection}>
            <Text style={styles.usedByTitle}>Utilisé par:</Text>
            {item.usedBy.map((usage, index) => (
              <View key={index} style={styles.usedByItem}>
                <Text style={styles.usedByName}>🏢 {usage.startupName}</Text>
                <Text style={styles.usedByDate}>
                  {formatDate(usage.usedAt)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ACTIONS */}
        <View style={styles.codeActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: item.active ? '#FF9500' : '#34C759' }
            ]}
            onPress={() => handleToggleCode(item.id, item.active)}
          >
            <Text style={styles.actionButtonText}>
              {item.active ? '⏸️ Désactiver' : '▶️ Activer'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => handleDeleteCode(item.id, item.code)}
          >
            <Text style={styles.actionButtonText}>🗑️ Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Codes Startup</Text>
          <Text style={styles.headerSubtitle}>
            {stats?.activeCodes || 0} actif{stats?.activeCodes > 1 ? 's' : ''} sur {stats?.totalCodes || 0}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* STATISTIQUES */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCodes}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#34C759' }]}>
              {stats.activeCodes}
            </Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF9500' }]}>
              {stats.usedCodes}
            </Text>
            <Text style={styles.statLabel}>Utilisés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF3B30' }]}>
              {stats.expiredCodes}
            </Text>
            <Text style={styles.statLabel}>Expirés</Text>
          </View>
        </View>
      )}

      {/* LISTE */}
      <FlatList
        data={codes}
        renderItem={renderCode}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>Aucun code</Text>
            <Text style={styles.emptyText}>
              Créez votre premier code d'invitation
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>+ Créer un code</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* MODAL CRÉATION CODE */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau code d'invitation</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>
                Créez un code unique pour permettre à une startup de s'inscrire
              </Text>

              <Text style={styles.label}>Expire dans (jours) *</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                value={expirationDays}
                onChangeText={setExpirationDays}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Nombre d'utilisations *</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={maxUses}
                onChangeText={setMaxUses}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Pour startup TechCorp..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  ℹ️ Le code sera généré automatiquement au format STARTUP-XXXXX
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleGenerateCode}
              >
                <Text style={styles.saveButtonText}>Générer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabButtonText}>+ Nouveau</Text>
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

  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#8E8E93', textAlign: 'center' },

  list: { padding: 16 },

  codeCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  codeCodeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeCode: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', fontFamily: 'monospace' },
  copyIcon: { fontSize: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusActive: { backgroundColor: '#E8F5E9' },
  statusInactive: { backgroundColor: '#FFF3E0' },
  statusExpired: { backgroundColor: '#FFEBEE' },
  statusExhausted: { backgroundColor: '#E0E0E0' },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },

  codeInfo: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#8E8E93' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#000' },
  expiredText: { color: '#FF3B30' },
  exhaustedText: { color: '#FF9500' },
  notesContainer: { marginTop: 8, padding: 12, backgroundColor: '#F9F9F9', borderRadius: 8 },
  notesLabel: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93', marginBottom: 4 },
  notesText: { fontSize: 13, color: '#000', lineHeight: 18 },

  usedBySection: { marginTop: 12, padding: 12, backgroundColor: '#F0F8FF', borderRadius: 8 },
  usedByTitle: { fontSize: 12, fontWeight: 'bold', color: '#007AFF', marginBottom: 8 },
  usedByItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  usedByName: { fontSize: 12, color: '#000' },
  usedByDate: { fontSize: 11, color: '#8E8E93' },

  codeActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: 'white' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8E8E93', marginBottom: 24, textAlign: 'center' },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  modalClose: { fontSize: 28, color: '#8E8E93' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalDescription: { fontSize: 14, color: '#8E8E93', marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  textArea: { height: 80, textAlignVertical: 'top' },
  infoBox: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 12, marginTop: 12 },
  infoBoxText: { fontSize: 13, color: '#007AFF', lineHeight: 18 },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F2F2F7' },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#8E8E93' },
  saveButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#007AFF' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },

  fabButton: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});