// screens/BDLOrderDetailScreen.js - Détail d'une commande BDL avec chat
import { arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { bdlBranding } from '../data/bdlServicesData';

export default function BDLOrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const orderRef = doc(db, 'bdlServiceOrders', orderId);

    const unsubscribe = onSnapshot(
      orderRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setOrder({
            id: docSnapshot.id,
            ...docSnapshot.data(),
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erreur chargement commande:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  // Envoyer un message
  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const orderRef = doc(db, 'bdlServiceOrders', orderId);
      const newMessage = {
        text: message.trim(),
        sender: 'client',
        senderName: order.customerInfo.firstName + ' ' + order.customerInfo.lastName,
        timestamp: new Date(),
      };

      await updateDoc(orderRef, {
        messages: arrayUnion(newMessage),
        updatedAt: new Date(),
      });

      setMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setSending(false);
    }
  };

  // Status config
  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'En attente', color: '#FF9500', icon: '⏳' },
      in_progress: { label: 'En cours', color: '#007AFF', icon: '⚙️' },
      completed: { label: 'Terminé', color: '#34C759', icon: '✅' },
      cancelled: { label: 'Annulé', color: '#FF3B30', icon: '❌' },
    };
    return configs[status] || configs.pending;
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={bdlBranding.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Commande introuvable</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: bdlBranding.colors.primary }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Commande</Text>
          <Text style={styles.orderNumber}>
            #{order.id.substring(0, 8).toUpperCase()}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Status */}
          <View style={styles.statusSection}>
            <View style={[styles.statusBadgeLarge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusIconLarge}>{statusConfig.icon}</Text>
              <Text style={styles.statusTextLarge}>{statusConfig.label}</Text>
            </View>
          </View>

          {/* Infos commande */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails de la commande</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service :</Text>
                <Text style={styles.infoValue}>{order.serviceName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Package :</Text>
                <Text style={[styles.infoValue, { color: bdlBranding.colors.accent }]}>
                  {order.packageName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prix :</Text>
                <Text style={[styles.infoValue, styles.infoPriceValue]}>
                  {order.packagePrice.toLocaleString()} XAF
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date :</Text>
                <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
              </View>

              {order.desiredDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date souhaitée :</Text>
                  <Text style={styles.infoValue}>{order.desiredDate}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description projet */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description du projet</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{order.projectDescription}</Text>
            </View>
          </View>

          {/* Messages / Chat */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discussion</Text>

            {order.messages && order.messages.length > 0 ? (
              <View style={styles.messagesContainer}>
                {order.messages.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageBubble,
                      msg.sender === 'client' ? styles.messageBubbleClient : styles.messageBubbleAdmin
                    ]}
                  >
                    <Text style={styles.messageSender}>{msg.senderName}</Text>
                    <Text style={styles.messageText}>{msg.text}</Text>
                    <Text style={styles.messageTime}>
                      {formatDate(msg.timestamp)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noMessagesBox}>
                <Text style={styles.noMessagesText}>
                  Aucun message pour le moment. Posez vos questions ici !
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Input message */}
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Votre message..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: bdlBranding.colors.accent },
              (!message.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!message.trim() || sending}
          >
            <Text style={styles.sendButtonText}>
              {sending ? '...' : '→'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 20,
  },

  // Header
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnText: {
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
  orderNumber: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },

  // Status
  statusSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  statusIconLarge: {
    fontSize: 24,
    marginRight: 12,
  },
  statusTextLarge: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },

  // Info Card
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  infoPriceValue: {
    fontSize: 18,
    color: '#275471',
    fontWeight: 'bold',
  },

  // Description
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },

  // Messages
  messagesContainer: {
    gap: 12,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 16,
    maxWidth: '80%',
  },
  messageBubbleClient: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  messageBubbleAdmin: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#8E8E93',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
  },
  messageTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  noMessagesBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  noMessagesText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Message Input
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 24,
    color: '#275471',
    fontWeight: 'bold',
  },

  // Back Button
  backButton: {
    backgroundColor: bdlBranding.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
