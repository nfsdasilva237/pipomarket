// components/NotificationsCard.js
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../config/firebase';
import { notificationService } from '../utils/notificationService';

export default function NotificationsCard() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await notificationService.getUserNotifications(auth.currentUser.uid);
      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'payment_received': '💰',
      'payment_confirmed': '✅',
      'payment_cancelled': '❌',
      'new_order': '🛍️',
      'order_shipped': '📦',
      'order_delivered': '🎉',
      'message_received': '💬',
      'promo_code': '🎁',
    };
    return icons[type] || '📢';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <Text style={styles.notificationIcon}>
        {getNotificationIcon(item.type)}
      </Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {item.createdAt?.toDate?.()?.toLocaleString('fr-FR') || 'Date inconnue'}
        </Text>
      </View>
      {!item.read && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyText}>Aucune notification</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      renderItem={renderNotification}
      keyExtractor={item => item.id}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F0F9FF',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    alignSelf: 'center',
  },
});