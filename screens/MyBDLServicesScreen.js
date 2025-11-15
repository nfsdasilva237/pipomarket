// screens/MyBDLServicesScreen.js - Liste des demandes de services BDL du client
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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
import { auth, db } from '../config/firebase';
import { bdlBranding } from '../data/bdlServicesData';

export default function MyBDLServicesScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les commandes
  const loadOrders = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'bdlServiceOrders'),
      where('userId', '==', userId)
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

        // Trier par date décroissante
        ordersData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toDate() - a.createdAt.toDate();
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

  // Badge de statut
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', color: '#FF9500', icon: '⏳' },
      in_progress: { label: 'En cours', color: '#007AFF', icon: '⚙️' },
      completed: { label: 'Terminé', color: '#34C759', icon: '✅' },
      cancelled: { label: 'Annulé', color: '#FF3B30', icon: '❌' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <Text style={styles.statusBadgeIcon}>{config.icon}</Text>
        <Text style={styles.statusBadgeText}>{config.label}</Text>
      </View>
    );
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    const date = timestamp.toDate();
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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

        <Text style={styles.headerTitle}>Mes Services BDL</Text>
        <Text style={styles.headerSubtitle}>
          {orders.length} demande{orders.length > 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyDescription}>
              Vous n'avez pas encore commandé de service BDL Studio
            </Text>
            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: bdlBranding.colors.accent }]}
              onPress={() => navigation.navigate('HomeTab')}
            >
              <Text style={styles.browseButtonText}>Découvrir nos services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('BDLOrderDetail', {
                  orderId: order.id
                })}
              >
                {/* Header */}
                <View style={styles.orderCardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>
                      #{order.id.substring(0, 8).toUpperCase()}
                    </Text>
                    <Text style={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>
                  {getStatusBadge(order.status)}
                </View>

                {/* Service */}
                <View style={styles.orderService}>
                  <Text style={styles.orderServiceName}>{order.serviceName}</Text>
                  <Text style={styles.orderPackageName}>{order.packageName}</Text>
                </View>

                {/* Description */}
                <Text style={styles.orderDescription} numberOfLines={2}>
                  {order.projectDescription}
                </Text>

                {/* Footer */}
                <View style={styles.orderCardFooter}>
                  <Text style={styles.orderPrice}>
                    {order.packagePrice.toLocaleString()} XAF
                  </Text>
                  <Text style={styles.orderAction}>Voir détails →</Text>
                </View>

                {/* Nouveau badge pour messages non lus */}
                {order.unreadMessages > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {order.unreadMessages}
                    </Text>
                  </View>
                )}
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
    marginBottom: 20,
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

  // Scroll
  scrollView: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#275471',
  },

  // Orders List
  ordersList: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
    position: 'relative',
  },

  // Order Card Header
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#275471',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
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
  statusBadgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Order Service
  orderService: {
    marginBottom: 12,
  },
  orderServiceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  orderPackageName: {
    fontSize: 14,
    color: '#f4a04b',
    fontWeight: '600',
  },

  // Order Description
  orderDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Order Card Footer
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#275471',
  },
  orderAction: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Unread Badge
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
