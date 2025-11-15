// screens/BDLMyOrdersScreen.js - Liste des commandes BDL Studio de l'utilisateur
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
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
import { auth } from '../config/firebase';
import bdlOrderService from '../utils/bdlOrderService';

export default function BDLMyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userOrders = await bdlOrderService.getUserOrders(userId);
      setOrders(userOrders);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
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

  const getStatusColor = (status) => {
    return bdlOrderService.getStatusColor(status);
  };

  const getStatusLabel = (status) => {
    return bdlOrderService.getStatusLabel(status);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

        <Text style={styles.headerTitle}>Mes commandes BDL</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* CONTENT */}
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
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore passé de commande BDL Studio
            </Text>
            <TouchableOpacity
              style={styles.browsButton}
              onPress={() => navigation.navigate('BDLStudioHome')}
            >
              <LinearGradient
                colors={['#275471', '#f4a04b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.browseGradient}
              >
                <Text style={styles.browseButtonText}>Découvrir nos services</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('BDLOrderDetail', { orderId: order.id })}
                activeOpacity={0.7}
              >
                {/* HEADER CARD */}
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

                {/* DETAILS */}
                <View style={styles.orderBody}>
                  <Text style={styles.orderPackage}>{order.packageName}</Text>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderPrice}>
                      {order.totalAmount.toLocaleString('fr-FR')} XAF
                    </Text>
                    <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                  </View>
                </View>

                {/* ARROW */}
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSpacer: {
    width: 40,
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

  // EMPTY STATE
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
    marginBottom: 32,
  },
  browsButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  browseGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  // ORDERS LIST
  ordersList: {
    padding: 16,
    gap: 12,
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
    position: 'relative',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginBottom: 8,
  },
  orderPackage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
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
  orderId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  arrowContainer: {
    position: 'absolute',
    top: '50%',
    right: 16,
    marginTop: -12,
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
  },
});
