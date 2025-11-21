// screens/AmbassadorDetailsScreen.js - ✅ DÉTAILS COMPLETS AMBASSADEUR
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import ambassadorService from '../utils/ambassadorService';

export default function AmbassadorDetailsScreen({ route, navigation }) {
    const insets = useSafeAreaInsets(); // ← Ajouté pour SafeAreaInsets
  const { ambassadorId, ambassadorData } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    try {
      // Charger filleuls
      const referralsResult = await ambassadorService.getAmbassadorReferrals(ambassadorId);
      if (referralsResult.success) {
        setReferrals(referralsResult.referrals);
      }

      // Charger gains
      const earningsResult = await ambassadorService.getAmbassadorEarnings(ambassadorId);
      if (earningsResult.success) {
        setEarnings(earningsResult.earnings);
      }

      // Charger historique paiements
      const paymentsSnap = await getDocs(
        query(
          collection(db, 'ambassadorPayments'),
          where('ambassadorId', '==', ambassadorId)
        )
      );
      const paymentsData = paymentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);

    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDetails();
  };

  const pendingEarnings = earnings.filter(e => e.status === 'pending');
  const paidEarnings = earnings.filter(e => e.status === 'paid');

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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
          <Text style={styles.headerTitle}>Détails Ambassadeur</Text>
          <Text style={styles.headerSubtitle}>{ambassadorData.name}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* INFOS GÉNÉRALES */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoIcon}>👤</Text>
              <View style={styles.infoHeaderText}>
                <Text style={styles.infoName}>{ambassadorData.name}</Text>
                <Text style={styles.infoCode}>{ambassadorData.code}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: ambassadorData.active ? '#34C759' : '#8E8E93' }
              ]}>
                <Text style={styles.statusText}>
                  {ambassadorData.active ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>

            {ambassadorData.email && (
              <Text style={styles.infoDetail}>📧 {ambassadorData.email}</Text>
            )}
            {ambassadorData.phone && (
              <Text style={styles.infoDetail}>📱 {ambassadorData.phone}</Text>
            )}
            <Text style={styles.infoDetail}>
              📅 Inscrit le {new Date(ambassadorData.createdAt?.toDate?.() || Date.now()).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{ambassadorData.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>👥 Filleuls</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{ambassadorData.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>🛒 Commandes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {ambassadorData.totalReferrals > 0
                  ? ((ambassadorData.totalOrders / ambassadorData.totalReferrals) * 100).toFixed(0)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>📈 Conversion</Text>
            </View>
          </View>
        </View>

        {/* GAINS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Gains</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Total gagné</Text>
              <Text style={styles.earningValue}>
                {(ambassadorData.totalEarnings || 0).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>En attente</Text>
              <Text style={[styles.earningValue, { color: '#FF9500' }]}>
                {(ambassadorData.pendingPayment || 0).toLocaleString('fr-FR')} FCFA
              </Text>
              <Text style={styles.earningCount}>
                ({pendingEarnings.length} commande{pendingEarnings.length > 1 ? 's' : ''})
              </Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Déjà payé</Text>
              <Text style={[styles.earningValue, { color: '#34C759' }]}>
                {(ambassadorData.paidOut || 0).toLocaleString('fr-FR')} FCFA
              </Text>
              <Text style={styles.earningCount}>
                ({payments.length} paiement{payments.length > 1 ? 's' : ''})
              </Text>
            </View>
          </View>
        </View>

        {/* FILLEULS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Filleuls ({referrals.length})</Text>
          {referrals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun filleul</Text>
            </View>
          ) : (
            referrals.map((referral) => (
              <View key={referral.id} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <Text style={styles.listItemIcon}>👤</Text>
                  <View>
                    <Text style={styles.listItemTitle}>{referral.name}</Text>
                    <Text style={styles.listItemSubtitle}>{referral.email}</Text>
                  </View>
                </View>
                <Text style={styles.listItemDate}>
                  {new Date(referral.joinedAt?.toDate?.() || Date.now()).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* HISTORIQUE PAIEMENTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 Historique Paiements ({payments.length})</Text>
          {payments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun paiement effectué</Text>
            </View>
          ) : (
            payments
              .sort((a, b) => b.paidAt?.toDate?.() - a.paidAt?.toDate?.())
              .map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentIcon}>💰</Text>
                    <View>
                      <Text style={styles.paymentAmount}>
                        {payment.amount?.toLocaleString('fr-FR')} FCFA
                      </Text>
                      <Text style={styles.paymentDate}>
                        {new Date(payment.paidAt?.toDate?.() || Date.now()).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>✓ Payé</Text>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* GAINS DÉTAILLÉS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            💵 Gains Détaillés ({earnings.length})
          </Text>
          {earnings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun gain enregistré</Text>
            </View>
          ) : (
            earnings
              .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.())
              .slice(0, 20)
              .map((earning) => (
                <View key={earning.id} style={styles.earningItemDetail}>
                  <View style={styles.earningItemLeft}>
                    <Text style={styles.earningItemIcon}>
                      {earning.status === 'paid' ? '✅' : '⏳'}
                    </Text>
                    <View>
                      <Text style={styles.earningItemAmount}>
                        +{earning.amount} FCFA
                      </Text>
                      <Text style={styles.earningItemDate}>
                        {new Date(earning.createdAt?.toDate?.() || Date.now()).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.earningStatusBadge,
                    { backgroundColor: earning.status === 'paid' ? '#34C759' : '#FF9500' }
                  ]}>
                    <Text style={styles.earningStatusText}>
                      {earning.status === 'paid' ? 'Payé' : 'En attente'}
                    </Text>
                  </View>
                </View>
              ))
          )}
        </View>

        <View style={{ height: Math.max(insets.bottom + 20, 80) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  placeholder: { width: 28 },

  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 12 },

  infoCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  infoIcon: { fontSize: 48, marginRight: 16 },
  infoHeaderText: { flex: 1 },
  infoName: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  infoCode: { fontSize: 14, color: '#007AFF', fontFamily: 'monospace', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: 'white' },
  infoDetail: { fontSize: 14, color: '#666', marginBottom: 8 },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', marginBottom: 8 },
  statLabel: { fontSize: 12, color: '#8E8E93', textAlign: 'center' },

  earningsCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  earningItem: { marginBottom: 20 },
  earningLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 6, fontWeight: '600' },
  earningValue: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  earningCount: { fontSize: 12, color: '#8E8E93' },

  emptyCard: { backgroundColor: 'white', borderRadius: 16, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  emptyText: { fontSize: 14, color: '#8E8E93' },

  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listItemIcon: { fontSize: 32, marginRight: 12 },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 2 },
  listItemSubtitle: { fontSize: 12, color: '#8E8E93' },
  listItemDate: { fontSize: 11, color: '#8E8E93' },

  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  paymentIcon: { fontSize: 32, marginRight: 12 },
  paymentAmount: { fontSize: 16, fontWeight: 'bold', color: '#34C759', marginBottom: 2 },
  paymentDate: { fontSize: 12, color: '#8E8E93' },
  paymentBadge: { backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  paymentBadgeText: { fontSize: 11, fontWeight: 'bold', color: 'white' },

  earningItemDetail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  earningItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  earningItemIcon: { fontSize: 24, marginRight: 12 },
  earningItemAmount: { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  earningItemDate: { fontSize: 11, color: '#8E8E93' },
  earningStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  earningStatusText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
});