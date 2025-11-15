// screens/AdminBDLOrdersScreen.js - Gestion admin des commandes BDL Studio
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import bdlOrderService from '../utils/bdlOrderService';

export default function AdminBDLOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadOrders = async () => {
    try {
      const allOrders = await bdlOrderService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await bdlOrderService.updateOrderStatus(orderId, newStatus);
      Alert.alert('Succès', 'Statut mis à jour');
      loadOrders();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    try {
      await bdlOrderService.updatePaymentStatus(orderId, newStatus);
      Alert.alert('Succès', 'Statut de paiement mis à jour');
      loadOrders();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le paiement');
    }
  };

  const showStatusMenu = (order) => {
    Alert.alert(
      'Changer le statut',
      'Sélectionnez le nouveau statut',
      [
        {
          text: '⏳ En attente',
          onPress: () => handleUpdateStatus(order.id, 'pending')
        },
        {
          text: '✅ Confirmée',
          onPress: () => handleUpdateStatus(order.id, 'confirmed')
        },
        {
          text: '🔨 En cours',
          onPress: () => handleUpdateStatus(order.id, 'in_progress')
        },
        {
          text: '✓ Terminée',
          onPress: () => handleUpdateStatus(order.id, 'completed')
        },
        {
          text: '❌ Annulée',
          onPress: () => handleUpdateStatus(order.id, 'cancelled'),
          style: 'destructive'
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  const showPaymentMenu = (order) => {
    Alert.alert(
      'Statut de paiement',
      'Modifier le statut de paiement',
      [
        {
          text: '⏳ En attente',
          onPress: () => handleUpdatePaymentStatus(order.id, 'pending')
        },
        {
          text: '✅ Payé',
          onPress: () => handleUpdatePaymentStatus(order.id, 'paid')
        },
        {
          text: '❌ Échoué',
          onPress: () => handleUpdatePaymentStatus(order.id, 'failed'),
          style: 'destructive'
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => bdlOrderService.getStatusColor(status);
  const getStatusLabel = (status) => bdlOrderService.getStatusLabel(status);
  const getPaymentStatusLabel = (status) => bdlOrderService.getPaymentStatusLabel(status);

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <LinearGradient
        colors={['#275471', '#f4a04b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Commandes BDL Studio</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* STATISTIQUES */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#9C27B0' }]}>{stats.in_progress}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
        </View>
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Revenu total (payé)</Text>
          <Text style={styles.revenueValue}>
            {stats.totalRevenue.toLocaleString('fr-FR')} XAF
          </Text>
        </View>
      </View>

      {/* FILTRES */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
              Tout ({orders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'pending' && styles.filterChipTextActive]}>
              En attente ({stats.pending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'confirmed' && styles.filterChipActive]}
            onPress={() => setFilterStatus('confirmed')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'confirmed' && styles.filterChipTextActive]}>
              Confirmées ({stats.confirmed})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'in_progress' && styles.filterChipActive]}
            onPress={() => setFilterStatus('in_progress')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'in_progress' && styles.filterChipTextActive]}>
              En cours ({stats.in_progress})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'completed' && styles.filterChipActive]}
            onPress={() => setFilterStatus('completed')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'completed' && styles.filterChipTextActive]}>
              Terminées ({stats.completed})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* LISTE DES COMMANDES */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#275471" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptyText}>
              {filterStatus === 'all'
                ? 'Aucune commande BDL Studio pour le moment'
                : `Aucune commande avec le statut "${getStatusLabel(filterStatus)}"`}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filteredOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                {/* HEADER */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderIcon}>{order.serviceIcon}</Text>
                    <View>
                      <Text style={styles.orderService}>{order.serviceName}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) }
                    ]}
                  >
                    <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                  </View>
                </View>

                {/* DÉTAILS */}
                <View style={styles.orderBody}>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Package</Text>
                    <Text style={styles.orderValue}>{order.packageName}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Client</Text>
                    <Text style={styles.orderValue}>{order.customerName}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Téléphone</Text>
                    <Text style={styles.orderValue}>{order.customerPhone}</Text>
                  </View>
                  {order.customerEmail && (
                    <View style={styles.orderRow}>
                      <Text style={styles.orderLabel}>Email</Text>
                      <Text style={styles.orderValue}>{order.customerEmail}</Text>
                    </View>
                  )}
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Paiement</Text>
                    <Text style={styles.orderValue}>
                      {order.paymentMethod === 'mobile_money' ? '📱 Mobile Money' : '💵 Cash'}
                      {order.paymentMethod === 'mobile_money' && ` - ${order.paymentPhone}`}
                    </Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Statut paiement</Text>
                    <Text style={[
                      styles.orderValue,
                      { color: order.paymentStatus === 'paid' ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </Text>
                  </View>
                  {order.projectDetails && (
                    <View style={styles.orderDetailsBox}>
                      <Text style={styles.orderDetailsLabel}>Détails du projet :</Text>
                      <Text style={styles.orderDetailsText}>{order.projectDetails}</Text>
                    </View>
                  )}
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderPrice}>
                      {order.totalAmount.toLocaleString('fr-FR')} XAF
                    </Text>
                    <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                  </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => showStatusMenu(order)}
                  >
                    <Text style={styles.actionButtonText}>Changer statut</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => showPaymentMenu(order)}
                  >
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      Paiement
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Math.max(insets.bottom + 20, 80) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSpacer: {
    width: 40,
  },

  // STATS
  statsSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#275471',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  revenueCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },

  // FILTERS
  filtersSection: {
    paddingVertical: 12,
    paddingLeft: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#275471',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },

  // CONTENT
  content: {
    flex: 1,
  },
  loadingContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    marginTop: 16,
  },
  emptyContainer: {
    paddingTop: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ORDERS
  ordersList: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  orderService: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  orderBody: {
    gap: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderLabel: {
    fontSize: 13,
    color: '#666',
  },
  orderValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  orderDetailsBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  orderDetailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  orderDetailsText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#275471',
  },
  orderId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#275471',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#275471',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButtonTextSecondary: {
    color: '#275471',
  },
});
