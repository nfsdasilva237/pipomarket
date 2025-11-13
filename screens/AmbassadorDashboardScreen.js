// screens/AmbassadorDashboardScreen.js - ✅ DASHBOARD AMBASSADEUR AMÉLIORÉ
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import ambassadorService from '../utils/ambassadorService';

export default function AmbassadorDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ambassador, setAmbassador] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Charger infos ambassadeur
      const result = await ambassadorService.getAmbassadorByUserId(auth.currentUser.uid);
      
      if (!result.success) {
        navigation.replace('Home');
        return;
      }

      setAmbassador(result.ambassador);

      // Charger gains
      const earningsResult = await ambassadorService.getAmbassadorEarnings(result.ambassador.id);
      if (earningsResult.success) {
        setEarnings(earningsResult.earnings);
      }

      // ✅ Charger filleuls
      const referralsResult = await ambassadorService.getAmbassadorReferrals(result.ambassador.id);
      if (referralsResult.success) {
        setReferrals(referralsResult.referrals);
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `🎁 Rejoignez PipoMarket avec mon code ambassadeur : ${ambassador.code}\n\nGagnez des avantages exclusifs ! 🚀\n\n✨ Inscrivez-vous et profitez de produits locaux incroyables !`,
        title: 'Mon code ambassadeur PipoMarket'
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ambassador) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🎁</Text>
          <Text style={styles.errorText}>Aucun compte ambassadeur</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingEarnings = earnings.filter(e => e.status === 'pending');
  const paidEarnings = earnings.filter(e => e.status === 'paid');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎁 Dashboard Ambassadeur</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* INFO AMBASSADEUR */}
        <View style={styles.profileCard}>
          <Text style={styles.profileIcon}>👤</Text>
          <Text style={styles.profileName}>{ambassador.name}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>🔑 Votre code :</Text>
            <Text style={styles.codeValue}>{ambassador.code}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
            <Text style={styles.shareButtonText}>📤 Partager mon code</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>💰 Mes Gains</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {ambassador.totalEarnings?.toLocaleString('fr-FR')} F
              </Text>
              <Text style={styles.statLabel}>Total Gains</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{ambassador.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Commandes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#FF9500' }]}>
                {ambassador.pendingPayment?.toLocaleString('fr-FR')} F
              </Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>
          </View>

          <View style={styles.paidOutCard}>
            <Text style={styles.paidOutIcon}>✅</Text>
            <View style={styles.paidOutInfo}>
              <Text style={styles.paidOutLabel}>Déjà payé</Text>
              <Text style={styles.paidOutValue}>
                {ambassador.paidOut?.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          </View>
        </View>

        {/* ✅ MES FILLEULS */}
        <View style={styles.referralsSection}>
          <Text style={styles.sectionTitle}>
            👥 Mes Filleuls ({ambassador.totalReferrals || 0})
          </Text>
          {referrals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>Aucun filleul pour le moment</Text>
              <Text style={styles.emptySubtext}>
                Partagez votre code pour inviter vos amis !
              </Text>
            </View>
          ) : (
            <>
              {referrals.slice(0, 5).map((referral, index) => (
                <View key={referral.id} style={styles.referralCard}>
                  <View style={styles.referralNumber}>
                    <Text style={styles.referralNumberText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>{referral.name}</Text>
                    <Text style={styles.referralEmail}>{referral.email}</Text>
                    {referral.joinedAt && (
                      <Text style={styles.referralDate}>
                        Inscrit le {referral.joinedAt.toDate?.()?.toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
              {referrals.length > 5 && (
                <Text style={styles.moreReferrals}>
                  + {referrals.length - 5} autre{referrals.length - 5 > 1 ? 's' : ''} filleul{referrals.length - 5 > 1 ? 's' : ''}
                </Text>
              )}
            </>
          )}
        </View>

        {/* COMMENT ÇA MARCHE */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>ℹ️  Comment ça marche ?</Text>
          <View style={styles.howItWorksCard}>
            <Text style={styles.howItWorksStep}>1️⃣  Partagez votre code</Text>
            <Text style={styles.howItWorksDescription}>
              Invitez vos amis à s'inscrire avec votre code
            </Text>
            
            <Text style={styles.howItWorksStep}>2️⃣  Ils commandent</Text>
            <Text style={styles.howItWorksDescription}>
              Quand ils passent une commande validée
            </Text>
            
            <Text style={styles.howItWorksStep}>3️⃣  Vous gagnez 25 FCFA</Text>
            <Text style={styles.howItWorksDescription}>
              Par commande validée par la startup
            </Text>
            
            <Text style={styles.howItWorksStep}>4️⃣  Recevez vos gains</Text>
            <Text style={styles.howItWorksDescription}>
              Les admins vous paient régulièrement
            </Text>
          </View>
        </View>

        {/* HISTORIQUE */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>📊 Historique des gains</Text>
          
          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Aucun gain pour le moment</Text>
              <Text style={styles.emptySubtext}>
                Partagez votre code pour commencer à gagner !
              </Text>
            </View>
          ) : (
            <>
              {/* EN ATTENTE */}
              {pendingEarnings.length > 0 && (
                <>
                  <Text style={styles.historySubtitle}>⏳ En attente de paiement</Text>
                  {pendingEarnings.slice(0, 5).map((earning) => (
                    <View key={earning.id} style={styles.earningCard}>
                      <View style={styles.earningIcon}>
                        <Text style={styles.earningIconText}>⏳</Text>
                      </View>
                      <View style={styles.earningInfo}>
                        <Text style={styles.earningAmount}>+{earning.amount} FCFA</Text>
                        <Text style={styles.earningDetail}>
                          Commande #{earning.orderId.slice(0, 8)}
                        </Text>
                        <Text style={styles.earningDate}>
                          {earning.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* PAYÉS */}
              {paidEarnings.length > 0 && (
                <>
                  <Text style={styles.historySubtitle}>✅ Payés</Text>
                  {paidEarnings.slice(0, 5).map((earning) => (
                    <View key={earning.id} style={[styles.earningCard, styles.earningCardPaid]}>
                      <View style={[styles.earningIcon, { backgroundColor: '#34C759' }]}>
                        <Text style={styles.earningIconText}>✅</Text>
                      </View>
                      <View style={styles.earningInfo}>
                        <Text style={styles.earningAmount}>+{earning.amount} FCFA</Text>
                        <Text style={styles.earningDetail}>
                          Commande #{earning.orderId.slice(0, 8)}
                        </Text>
                        <Text style={styles.earningDate}>
                          Payé le {earning.paidAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#8E8E93' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorIcon: { fontSize: 64, marginBottom: 16 },
  errorText: { fontSize: 18, fontWeight: 'bold', color: '#8E8E93' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { fontSize: 28, color: '#007AFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  placeholder: { width: 28 },
  
  content: { flex: 1 },
  
  profileCard: { backgroundColor: '#007AFF', margin: 16, padding: 24, borderRadius: 20, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  profileIcon: { fontSize: 48, marginBottom: 12 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 16 },
  codeContainer: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginBottom: 16 },
  codeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4, textAlign: 'center' },
  codeValue: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', fontFamily: 'monospace' },
  shareButton: { backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shareButtonText: { fontSize: 15, fontWeight: 'bold', color: '#007AFF' },
  
  statsSection: { backgroundColor: 'white', padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8E8E93', textAlign: 'center' },
  
  paidOutCard: { flexDirection: 'row', backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#34C759' },
  paidOutIcon: { fontSize: 32, marginRight: 12 },
  paidOutInfo: { flex: 1 },
  paidOutLabel: { fontSize: 13, color: '#2E7D32', marginBottom: 4 },
  paidOutValue: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32' },
  
  // ✅ Styles filleuls
  referralsSection: { backgroundColor: 'white', padding: 16, marginBottom: 12 },
  referralCard: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 12, marginBottom: 8, alignItems: 'center' },
  referralNumber: { width: 32, height: 32, backgroundColor: '#007AFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  referralNumberText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  referralEmail: { fontSize: 12, color: '#8E8E93', marginBottom: 2 },
  referralDate: { fontSize: 11, color: '#8E8E93' },
  moreReferrals: { fontSize: 13, color: '#007AFF', fontWeight: '600', textAlign: 'center', marginTop: 8 },
  
  howItWorksSection: { backgroundColor: 'white', padding: 16, marginBottom: 12 },
  howItWorksCard: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16 },
  howItWorksStep: { fontSize: 15, fontWeight: 'bold', color: '#000', marginTop: 12, marginBottom: 4 },
  howItWorksDescription: { fontSize: 13, color: '#8E8E93', marginBottom: 8 },
  
  historySection: { backgroundColor: 'white', padding: 16, marginBottom: 12 },
  historySubtitle: { fontSize: 15, fontWeight: '600', color: '#000', marginTop: 16, marginBottom: 12 },
  
  emptyState: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  emptySubtext: { fontSize: 13, color: '#8E8E93', textAlign: 'center' },
  
  earningCard: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 12, marginBottom: 8 },
  earningCardPaid: { backgroundColor: '#E8F5E9' },
  earningIcon: { width: 48, height: 48, backgroundColor: '#FF9500', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  earningIconText: { fontSize: 24 },
  earningInfo: { flex: 1 },
  earningAmount: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  earningDetail: { fontSize: 13, color: '#8E8E93', marginBottom: 2 },
  earningDate: { fontSize: 12, color: '#8E8E93' },
});