// screens/BDLAdminOrderDetailScreen.js - Gestion admin d'une commande BDL
import { arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { db } from '../config/firebase';
import { bdlBranding } from '../data/bdlServicesData';

export default function BDLAdminOrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  // Changer le statut
  const updateStatus = async (newStatus) => {
    Alert.alert(
      'Changer le statut',
      `Voulez-vous vraiment passer cette commande à "${getStatusLabel(newStatus)}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              const orderRef = doc(db, 'bdlServiceOrders', orderId);
              await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: new Date(),
              });
              Alert.alert('Succès', 'Statut mis à jour');
            } catch (error) {
              console.error('Erreur mise à jour statut:', error);
              Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
            } finally {
              setUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const orderRef = doc(db, 'bdlServiceOrders', orderId);
      const newMessage = {
        text: message.trim(),
        sender: 'admin',
        senderName: 'Équipe BDL Studio',
        timestamp: new Date(),
      };

      await updateDoc(orderRef, {
        messages: arrayUnion(newMessage),
        updatedAt: new Date(),
      });

      setMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  // Labels statuts
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
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

          <Text style={styles.headerTitle}>Gestion Commande</Text>
          <Text style={styles.orderNumber}>
            #{order.id.substring(0, 8).toUpperCase()}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Status actuel */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Statut actuel</Text>
            <View style={[styles.statusBadgeLarge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusIconLarge}>{statusConfig.icon}</Text>
              <Text style={styles.statusTextLarge}>{statusConfig.label}</Text>
            </View>
          </View>

          {/* Actions de changement de statut */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changer le statut</Text>
            <View style={styles.statusActions}>
              {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusActionButton,
                    order.status === status && styles.statusActionButtonCurrent,
                    { borderColor: getStatusConfig(status).color }
                  ]}
                  onPress={() => updateStatus(status)}
                  disabled={order.status === status || updatingStatus}
                >
                  <Text style={styles.statusActionIcon}>
                    {getStatusConfig(status).icon}
                  </Text>
                  <Text style={styles.statusActionText}>
                    {getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info client */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations client</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom :</Text>
                <Text style={styles.infoValue}>
                  {order.customerInfo.firstName} {order.customerInfo.lastName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email :</Text>
                <Text style={styles.infoValue}>{order.customerInfo.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone :</Text>
                <Text style={[styles.infoValue, styles.phoneValue]}>
                  {order.customerInfo.phone}
                </Text>
              </View>
            </View>
          </View>

          {/* Détails commande */}
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
                <Text style={[styles.infoValue, styles.priceValue]}>
                  {order.packagePrice.toLocaleString()} XAF
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date commande :</Text>
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
            <Text style={styles.sectionTitle}>
              Discussion ({order.messages?.length || 0})
            </Text>

            {order.messages && order.messages.length > 0 ? (
              <View style={styles.messagesContainer}>
                {order.messages.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageBubble,
                      msg.sender === 'admin' ? styles.messageBubbleAdmin : styles.messageBubbleClient
                    ]}
                  >
                    <Text style={styles.messageSender}>{msg.senderName}</Text>
                    <Text style={[
                      styles.messageText,
                      msg.sender === 'admin' && styles.messageTextAdmin
                    ]}>
                      {msg.text}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      msg.sender === 'admin' && styles.messageTimeAdmin
                    ]}>
                      {formatDate(msg.timestamp)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noMessagesBox}>
                <Text style={styles.noMessagesText}>
                  Aucun message. Commencez la conversation !
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
            placeholder="Répondre au client..."
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
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
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

  // Status Actions
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  statusActionButtonCurrent: {
    opacity: 0.5,
  },
  statusActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statusActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
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
  phoneValue: {
    color: '#007AFF',
  },
  priceValue: {
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
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  messageBubbleAdmin: {
    backgroundColor: '#275471',
    alignSelf: 'flex-start',
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
    color: '#000',
  },
  messageTextAdmin: {
    color: 'white',
  },
  messageTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  messageTimeAdmin: {
    color: 'rgba(255,255,255,0.7)',
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
});
