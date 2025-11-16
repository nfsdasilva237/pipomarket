import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function StartupMessagesScreen({ route, navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupérer startupId depuis les params (important pour login par code)
  const { startupId: paramStartupId } = route.params || {};
  const currentUser = auth.currentUser;

  // Utiliser startupId des params OU currentUser.uid en fallback
  const effectiveStartupId = paramStartupId || currentUser?.uid;

  // Écouter les conversations en temps réel
  useEffect(() => {
    if (!effectiveStartupId) return;

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('startupId', '==', effectiveStartupId),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        
        // Récupérer le nom du client
        let clientName = 'Client';
        try {
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          if (userDoc.exists()) {
            clientName = userDoc.data().fullName || userDoc.data().email || 'Client';
          }
        } catch (error) {
          console.error('Erreur récupération nom client:', error);
        }

        conversationsData.push({
          id: docSnapshot.id,
          ...data,
          clientName,
        });
      }
      
      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveStartupId]);

  const renderConversation = ({ item }) => {
    const hasUnread = item.unreadStartup > 0;

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() =>
          navigation.navigate('Chat', {
            clientId: item.userId,
            startupName: item.startupName,
            clientName: item.clientName,
          })
        }
      >
        {/* Logo */}
        <View style={styles.conversationLogo}>
          <Text style={styles.conversationLogoText}>👤</Text>
        </View>

        {/* Infos */}
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{item.clientName}</Text>
            {item.lastMessageTime && (
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessageTime.toDate())}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.conversationLastMessage,
              hasUnread && styles.conversationLastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || 'Aucun message'}
          </Text>
        </View>

        {/* Badge non-lus */}
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadStartup}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Messages clients</Text>
      </View>

      {/* LISTE */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💬</Text>
            <Text style={styles.emptyStateTitle}>Aucun message</Text>
            <Text style={styles.emptyStateText}>
              Les clients pourront vous contacter directement depuis votre page
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  listContainer: {
    flexGrow: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  conversationLogo: {
    width: 56,
    height: 56,
    backgroundColor: '#F2F2F7',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationLogoText: {
    fontSize: 28,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  conversationTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  conversationLastMessageUnread: {
    fontWeight: '600',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
