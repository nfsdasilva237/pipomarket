// screens/OrdersScreen.js
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigation.replace('Login');
        return;
      }

      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const ordersData = [];
      
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });

      setOrders(ordersData);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'confirmed': return '#007AFF';
      case 'delivered': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const formatOrderDate = (createdAt) => {
    try {
      let date;

      // Si c'est un Timestamp Firestore
      if (createdAt && typeof createdAt.toDate === 'function') {
        date = createdAt.toDate();
      }
      // Si c'est déjà un objet Date
      else if (createdAt instanceof Date) {
        date = createdAt;
      }
      // Si c'est une string ou un nombre
      else if (createdAt) {
        date = new Date(createdAt);
      }
      // Par défaut, date actuelle
      else {
        date = new Date();
      }

      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'Date inconnue';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Commandes</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Aucune commande</Text>
              <Text style={styles.emptyText}>
                Vos commandes apparaîtront ici
              </Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.shopButtonText}>Commencer à acheter</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>
                    Commande #{(order.id || 'N/A').substring(0, 8).toUpperCase()}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(order.status) }
                    ]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderInfo}>
                  <Text style={styles.orderDate}>
                    📅 {formatOrderDate(order.createdAt)}
                  </Text>
                  <Text style={styles.orderItems}>
                    📦 {order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}
                  </Text>
                </View>

                <View style={styles.orderDetails}>
                  {order.items?.slice(0, 2).map((item, index) => (
                    <Text key={index} style={styles.orderItem}>
                      • {item.name} (x{item.quantity})
                    </Text>
                  ))}
                  {order.items?.length > 2 && (
                    <Text style={styles.orderItemMore}>
                      et {order.items.length - 2} autre{order.items.length > 3 ? 's' : ''}...
                    </Text>
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.orderTotal}>
                      {(order.totalAmount || order.total || 0).toLocaleString()} FCFA
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 13,
    color: '#666',
  },
  orderDetails: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  orderItem: {
    fontSize: 13,
    color: '#000',
    marginBottom: 2,
  },
  orderItemMore: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  totalContainer: {
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
