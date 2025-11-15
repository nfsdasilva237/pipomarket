// screens/BDLAdminDashboardScreen.js - Dashboard admin pour gérer les demandes BDL
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import { bdlBranding } from '../data/bdlServicesData';

export default function BDLAdminDashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed, cancelled

  // Charger toutes les commandes
  const loadOrders = () => {
    const q = query(
      collection(db, 'bdlServiceOrders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setOrders(ordersData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Erreur chargement commandes:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = loadOrders();
    return () => unsubscribe && unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Filtrer les commandes
  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    const date = timestamp.toDate();
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Badge statut
  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: 'En attente', color: '#FF9500', icon: '⏳' },
      in_progress: { label: 'En cours', color: '#007AFF', icon: '⚙️' },
      completed: { label: 'Terminé', color: '#34C759', icon: '✅' },
      cancelled: { label: 'Annulé', color: '#FF3B30', icon: '❌' },
    };
    const config = configs[status] || configs.pending;
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <Text style={styles.statusIcon}>{config.icon}</Text>
        <Text style={styles.statusText}>{config.label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={bdlBranding.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: bdlBranding.colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>BDL Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Gestion des demandes de services
        </Text>
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statNumber, { color: '#FF9500' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.statNumber, { color: '#007AFF' }]}>{stats.in_progress}</Text>
          <Text style={styles.statLabel}>En cours</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.statNumber, { color: '#34C759' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Terminé</Text>
        </View>
      </ScrollView>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContainer}
      >
        {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filter === status && { backgroundColor: bdlBranding.colors.primary }
            ]}
            onPress={() => setFilter(status)}
          >
            <Text style={[
              styles.filterChipText,
              filter === status && styles.filterChipTextActive
            ]}>
              {status === 'all' ? 'Tout' :
               status === 'pending' ? 'En attente' :
               status === 'in_progress' ? 'En cours' :
               status === 'completed' ? 'Terminé' : 'Annulé'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des commandes */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>
              Aucune commande{filter !== 'all' ? ' dans ce filtre' : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filteredOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('BDLAdminOrderDetail', {
                  orderId: order.id
                })}
              >
                {/* Header */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderNumber}>
                      #{order.id.substring(0, 8).toUpperCase()}
                    </Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                  {getStatusBadge(order.status)}
                </View>

                {/* Client */}
                <View style={styles.clientSection}>
                  <Text style={styles.clientIcon}>👤</Text>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>
                      {order.customerInfo.firstName} {order.customerInfo.lastName}
                    </Text>
                    <Text style={styles.clientContact}>
                      {order.customerInfo.phone} • {order.customerInfo.email}
                    </Text>
                  </View>
                </View>

                {/* Service */}
                <View style={styles.serviceSection}>
                  <Text style={styles.serviceName}>{order.serviceName}</Text>
                  <Text style={styles.packageName}>{order.packageName}</Text>
                </View>

                {/* Description */}
                <Text style={styles.orderDescription} numberOfLines={2}>
                  {order.projectDescription}
                </Text>

                {/* Footer */}
                <View style={styles.orderFooter}>
                  <Text style={styles.orderPrice}>
                    {order.packagePrice.toLocaleString()} XAF
                  </Text>
                  <View style={styles.orderActions}>
                    {order.messages && order.messages.length > 0 && (
                      <View style={styles.messagesBadge}>
                        <Text style={styles.messagesBadgeText}>
                          💬 {order.messages.length}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.viewAction}>Gérer →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },

  // Header
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },

  // Stats
  statsScroll: {
    marginTop: 16,
    maxHeight: 120,
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#275471',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  // Filtres
  filtersScroll: {
    marginTop: 16,
    maxHeight: 50,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },

  // Orders List
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  ordersList: {
    paddingHorizontal: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Order Header
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#275471',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Client Section
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  clientIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  clientContact: {
    fontSize: 13,
    color: '#666',
  },

  // Service Section
  serviceSection: {
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 14,
    color: '#f4a04b',
    fontWeight: '600',
  },

  // Description
  orderDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Order Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#275471',
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messagesBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messagesBadgeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  viewAction: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
